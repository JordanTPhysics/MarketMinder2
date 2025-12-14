import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import { checkDailyRequestLimitServer, incrementUserRequestsWithCount } from '../../../utils/request-tracker-server'

export async function POST(req: NextRequest) {
  // Prefer non-prefixed key for server-side (more secure), fall back to prefixed for backward compatibility
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

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
    const { type, lat, lng } = body
    const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('Google Places API error:', response.statusText)
      return NextResponse.json(
        { error: `Google Places API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // If the API call was successful, increment the request count with result count
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      const resultCount = data.results ? data.results.length : 0
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