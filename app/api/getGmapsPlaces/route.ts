// app/api/getGmapsPlaces/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  console.log(apiKey)
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key is missing' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { type, city, country, postCode } = body

    const textQuery = `${type} in ${city}, ${country}, ${postCode}`

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
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
