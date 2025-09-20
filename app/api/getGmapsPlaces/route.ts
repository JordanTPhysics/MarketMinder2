// app/api/getGmapsPlaces/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import { checkDailyRequestLimitServer, incrementUserRequestsWithCount } from '../../../utils/request-tracker-server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key is missing' },
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
    const { type, city, country, postCode } = body

    const textQuery = `${type} in ${city}, ${country}${postCode ? `, ${postCode}` : ''}`

    const payload = {
      textQuery: textQuery,
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.displayName',
        'places.types',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.websiteUri',
        'places.name',
        'places.nationalPhoneNumber',
        'places.userRatingCount'
      ].join(','),
    }

    const gmapsUrl = `https://places.googleapis.com/v1/places:searchText`

    const response = await fetch(gmapsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Google Places API error:', response.statusText)
      return NextResponse.json(
        { error: `Google Places API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // If the API call was successful, increment the request count with result count
    if (data.places && data.places.length >= 0) {
      const resultCount = data.places.length
      const incrementSuccess = await incrementUserRequestsWithCount(user.id, resultCount)
      
      if (!incrementSuccess) {
        console.error('Failed to increment user requests with count')
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
