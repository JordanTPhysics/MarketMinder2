// app/api/scrape-contacts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import { checkDailyRequestLimitServer, incrementUserRequestsWithCount } from '../../../utils/request-tracker-server'

interface ScrapeResult {
  url: string
  emails: string[]
  phoneNumbers: string[]
  error?: string
  success: boolean
}


function findContactPageLink(html: string): string {
  // Search for <a> tags containing the word 'contact' and return the href
  const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const innerText = match[2]
    const lowerHref = href.toLowerCase()
    const lowerText = innerText.toLowerCase()
    if (
      lowerHref.includes('contact') ||
      lowerText.includes('contact')
    ) {

        return href
      }
    
  }
  return ''

}

function extractEmails(text: string): string[] {
  // Email regex pattern - matches standard email formats
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = text.match(emailRegex) || []
  // Remove duplicates and filter out common false positives
  const uniqueEmails = Array.from(new Set(emails)).filter(
    email => 
      !email.includes('example.com') &&
      !email.includes('test.com') &&
      !email.includes('domain.com') &&
      !email.includes('email.com') &&
      !email.includes('sentry.io') && // Common tracking/analytics emails
      !email.includes('google-analytics') &&
      !email.includes('googletagmanager')
  )
  return uniqueEmails
}

/**
 * Validate if a phone number is likely a real phone number (not a date, price, ID, etc.)
 */
function isValidPhoneNumber(phone: string, country?: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Must be between 10 and 15 digits
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false
  }

  // Filter out common false positives
  
  // 1. Dates: 01/01/2024, 2024-01-01, etc. (if all digits are the same or sequential)
  if (digitsOnly.length === 8) {
    // Could be a date (DDMMYYYY or YYYYMMDD)
    const year = parseInt(digitsOnly.substring(0, 4))
    const year2 = parseInt(digitsOnly.substring(4, 8))
    if ((year >= 1900 && year <= 2100) || (year2 >= 1900 && year2 <= 2100)) {
      return false // Likely a date
    }
  }

  // 2. Prices/Amounts: If it looks like a price (has currency symbols nearby in original)
  // This is handled by context, but we can filter obvious ones
  
  // 3. IDs: Sequential or repeating digits (like 1234567890, 1111111111)
  if (/^(\d)\1{9,}$/.test(digitsOnly)) {
    return false // All same digit
  }
  if (/^123456789/.test(digitsOnly) || /^987654321/.test(digitsOnly)) {
    return false // Sequential
  }

  // 4. Country-specific validation
  if (country) {
    const countryLower = country.toLowerCase()
    
    if (countryLower === 'uk' || countryLower === 'united kingdom' || countryLower === 'gb') {
      // UK numbers should start with 01, 02, or 07 (most common)
      // Also allow 03, 08, 09 for special services
      // Also allow +44 format (international)
      if (digitsOnly.startsWith('44')) {
        // International format: +44 followed by UK number (without leading 0)
        const ukNumber = digitsOnly.substring(2)
        // UK numbers without leading 0: 1xxx, 2xxx, 3xxx, 7xxx, 8xxx, 9xxx
        if (ukNumber.length >= 9 && ukNumber.length <= 10 && 
            (ukNumber.startsWith('1') || ukNumber.startsWith('2') || ukNumber.startsWith('3') || 
             ukNumber.startsWith('7') || ukNumber.startsWith('8') || ukNumber.startsWith('9'))) {
          return true
        }
      } else if (digitsOnly.startsWith('0')) {
        // UK format with leading 0: 01xxx, 02xxx, 03xxx, 07xxx, 08xxx, 09xxx
        // Must be 10-11 digits total
        if (digitsOnly.length >= 10 && digitsOnly.length <= 11) {
          if (digitsOnly.startsWith('01') || digitsOnly.startsWith('02') || digitsOnly.startsWith('03') ||
              digitsOnly.startsWith('07') || digitsOnly.startsWith('08') || digitsOnly.startsWith('09')) {
            return true
          }
        }
      }
      return false // Doesn't match UK format
    }
    
    if (countryLower === 'us' || countryLower === 'usa' || countryLower === 'united states') {
      // US numbers: 10 digits, can start with +1
      if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
        return true // +1 format
      }
      if (digitsOnly.length === 10) {
        // Must not start with 0 or 1 (invalid area codes)
        const areaCode = digitsOnly.substring(0, 3)
        if (areaCode[0] !== '0' && areaCode[0] !== '1') {
          return true
        }
      }
      return false // Doesn't match US format
    }
  }

  // 5. General validation: Check for reasonable digit distribution
  // Phone numbers shouldn't have too many consecutive zeros or ones
  if (/(0{5,}|1{5,})/.test(digitsOnly)) {
    return false
  }

  // 6. Check if it's likely an IP address (4 groups of 1-3 digits)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(phone.replace(/[\s-]/g, '.'))) {
    return false
  }

  return true
}

/**
 * Extract phone numbers from text using regex with country-aware validation
 * Supports various formats: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, etc.
 */
function extractPhoneNumbers(text: string, country?: string): string[] {
  // More specific phone number regex patterns
  const patterns = {
    // International format with country code: +44 20 1234 5678, +1 555 123 4567
    "international": /\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/,
    // US format: (123) 456-7890, 123-456-7890, 123.456.7890
    "United States": /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    // UK format: 020 1234 5678, 02012345678, 07123 456789
    "United Kingdom": /^(?:\+44\s?|0)(?:\d\s?){9,10}$/,
  }

  const phoneNumbers: string[] = []

  if (country && patterns[country as keyof typeof patterns]) {
    const matches = text.match(patterns[country as keyof typeof patterns]) || []
    phoneNumbers.push(...matches)
  } else {
      const matches = text.match(patterns["international"]) || []
      phoneNumbers.push(...matches)
  }

  return phoneNumbers
}

/**
 * Scrape a single URL for emails and phone numbers
 */
async function scrapeUrl(url: string, country?: string): Promise<ScrapeResult> {
  try {
    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return {
        url,
        emails: [],
        phoneNumbers: [],
        error: 'Invalid URL format',
        success: false,
      }
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return {
        url,
        emails: [],
        phoneNumbers: [],
        error: 'Only HTTP and HTTPS URLs are allowed',
        success: false,
      }
    }

    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Fetch the HTML content
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        url,
        emails: [],
        phoneNumbers: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        success: false,
      }
    }

    const html = await response.text()

    // Extract emails and phone numbers
    const emails = extractEmails(html)
    const phoneNumbers = extractPhoneNumbers(html, country)
    let contactPage = findContactPageLink(html)

    if (! /^https?:\/\//.test(contactPage)) contactPage = url + contactPage

    if (contactPage) {
      const contactPageResponse = await fetch(contactPage, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      })
      if (contactPageResponse.ok) {
        const contactPageHtml = await contactPageResponse.text()
        const contactPageEmails = extractEmails(contactPageHtml)
        const contactPagePhoneNumbers = extractPhoneNumbers(contactPageHtml, country)
        emails.push(...contactPageEmails)
        phoneNumbers.push(...contactPagePhoneNumbers)
      }
      else {
        console.error(`Failed to fetch contact page: ${contactPageResponse.statusText}`)
      }
    }

    return {
      url,
      emails,
      phoneNumbers,
      success: true,
    }
  } catch (error: any) {
    let errorMessage = error.message || 'Failed to scrape URL'
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout (10 seconds)'
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error or invalid URL'
    }

    return {
      url,
      emails: [],
      phoneNumbers: [],
      error: errorMessage,
      success: false,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient()
    
    // Try to get user from session cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If no user from cookies, try Authorization header (for client-side calls)
    if (!user && req.headers.get('authorization')) {
      const token = req.headers.get('authorization')?.replace('Bearer ', '')
      if (token) {
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
        if (!tokenError && tokenUser) {
          user = tokenUser
          authError = null
        }
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check daily request limit
    const limitExceeded = await checkDailyRequestLimitServer(user.id)
    
    if (limitExceeded) {
      return NextResponse.json(
        { error: 'Daily request limit exceeded' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { urls, country } = body

    // Validate input
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'urls must be an array of URL strings' },
        { status: 400 }
      )
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      )
    }

    // Limit the number of URLs to prevent abuse
    const MAX_URLS = 50
    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_URLS} URLs allowed per request` },
        { status: 400 }
      )
    }

    // Scrape all URLs (in parallel for better performance)
    const scrapePromises = urls.map(url => scrapeUrl(url, country))
    const results = await Promise.all(scrapePromises)

    // Count successful scrapes for rate limiting
    const successfulScrapes = results.filter(r => r.success).length
    
    // Increment request count
    const incrementSuccess = await incrementUserRequestsWithCount(user.id, successfulScrapes)
    
    if (!incrementSuccess) {
      console.error('Failed to increment user requests with count')
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalEmails: results.reduce((sum, r) => sum + r.emails.length, 0),
        totalPhoneNumbers: results.reduce((sum, r) => sum + r.phoneNumbers.length, 0),
      },
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

