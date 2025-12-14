import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import { checkDailyRequestLimitServer, incrementUserRequestsWithCount } from '../../../utils/request-tracker-server'

export async function POST(req: NextRequest) {
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google Custom Search API key is missing' },
            { status: 500 }
        )
    }
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
    if (!searchEngineId) {
        return NextResponse.json(
            { error: 'Google Custom Search Engine ID is missing' },
            { status: 500 }
        )   
    }
    try {
        const supabase = await createClient()
        let { data: { user }, error: authError } = await supabase.auth.getUser()
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
        const body = await req.json()
        const { query } = body
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}`)
        const data = await response.json()

        if (data.items && data.items.length >= 0) {
            const resultCount = data.items.length
            const incrementSuccess = await incrementUserRequestsWithCount(user.id, 1)
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