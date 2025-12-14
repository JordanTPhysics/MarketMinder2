// app/api/google-search-ranking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import { checkDailyRequestLimitServer, incrementUserRequestsWithCount } from '../../../utils/request-tracker-server'

interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
}

interface RankingResult {
  found: boolean
  rank?: number
  totalResults?: number
  searchTime?: number
  result?: GoogleSearchResult
  query: string
}

export async function POST(req: NextRequest) {
  // Use the same API key as other Google APIs (can be used for multiple services)
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google API key is missing. Please set GOOGLE_MAPS_API_KEY environment variable.' },
      { status: 500 }
    )
  }

  if (!searchEngineId) {
    return NextResponse.json(
      { error: 'Google Custom Search Engine ID is missing. Please set GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variable.' },
      { status: 500 }
    )
  }

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
    const { placeName, location, type } = body
    const query = type + ' ' + location;

    if (!type || !location) {
      return NextResponse.json(
        { error: 'type and location are required' },
        { status: 400 }
      )
    }

    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1')
    searchUrl.searchParams.append('key', apiKey)
    searchUrl.searchParams.append('cx', searchEngineId)
    searchUrl.searchParams.append('q', query)
    searchUrl.searchParams.append('num', '10') // Get top 10 results

    console.log('Making Custom Search API request:', {
      url: searchUrl.toString().replace(apiKey, '***REDACTED***'),
      searchEngineId,
      query
    })

    const response = await fetch(searchUrl.toString())

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google Custom Search API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        searchEngineId,
        query
      })
      
      // Provide helpful error messages for common issues
      if (response.status === 403) {
        const errorMessage = errorData?.error?.message || 'Unknown error'
        return NextResponse.json(
          { 
            error: 'Google Custom Search API returned 403 Forbidden.',
            details: {
              message: errorMessage,
              possibleCauses: [
                'API key restrictions (IP address or HTTP referrer restrictions) may be blocking the request',
                'Custom Search JSON API may not be enabled for this API key',
                'Invalid Custom Search Engine ID (cx parameter)',
                'Billing/quota issues with your Google Cloud project',
                'API key may not have proper permissions'
              ],
              troubleshooting: [
                'Check API key restrictions in Google Cloud Console',
                'Verify Custom Search JSON API is enabled',
                'Confirm the Custom Search Engine ID is correct',
                'Check billing status in Google Cloud Console',
                'Review the error message details below for specific information'
              ],
              errorData
            }
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: `Google Custom Search API error: ${response.statusText}`, details: errorData },
        { status: response.status }
      )
    }

    const data: GoogleSearchResponse = await response.json()
    
    // Find the ranking of the place in search results
    const rankingResult: RankingResult = {
      found: false,
      query,
      totalResults: data.searchInformation?.totalResults ? parseInt(data.searchInformation.totalResults) : undefined,
      searchTime: data.searchInformation?.searchTime
    }

    if (data.items && data.items.length > 0) {
      // Normalize place name for comparison (lowercase, remove extra spaces)
      const normalizedPlaceName = placeName.toLowerCase().trim().replace(/\s+/g, ' ')
      
      // Check each result to see if it matches the place
      for (let i = 0; i < data.items.length; i++) {
        const result = data.items[i]
        const resultTitle = result.title.toLowerCase()
        const resultSnippet = result.snippet.toLowerCase()
        const resultLink = result.link.toLowerCase()
        const resultDisplayLink = result.displayLink.toLowerCase()
        
        // Check if place name appears in title, snippet, link, or display link
        const matchesTitle = resultTitle.includes(normalizedPlaceName)
        const matchesSnippet = resultSnippet.includes(normalizedPlaceName)
        const matchesLink = resultLink.includes(normalizedPlaceName.toLowerCase().replace(/\s+/g, ''))
        const matchesDisplayLink = resultDisplayLink.includes(normalizedPlaceName.toLowerCase().replace(/\s+/g, ''))
        
        // Also check for partial matches (e.g., if place name is "Joe's Pizza", check for "joes pizza")
        const normalizedPlaceNameNoSpaces = normalizedPlaceName.replace(/\s+/g, '')
        const matchesTitleNoSpaces = resultTitle.replace(/\s+/g, '').includes(normalizedPlaceNameNoSpaces)
        const matchesSnippetNoSpaces = resultSnippet.replace(/\s+/g, '').includes(normalizedPlaceNameNoSpaces)
        
        if (matchesTitle || matchesSnippet || matchesLink || matchesDisplayLink || matchesTitleNoSpaces || matchesSnippetNoSpaces) {
          rankingResult.found = true
          rankingResult.rank = i + 1 // Rank is 1-indexed
          rankingResult.result = result
          break
        }
      }
    }

    // Increment request count (count as 1 request regardless of results)
    const incrementSuccess = await incrementUserRequestsWithCount(user.id, 1)
    
    if (!incrementSuccess) {
      console.error('Failed to increment user requests with count')
      // Don't fail the request, just log the error
    }

    return NextResponse.json(rankingResult)
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

