import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.PASSPORT_API_KEY || process.env.NEXT_PUBLIC_PASSPORT_API_KEY
    const scorerId = process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID

    if (!apiKey || !scorerId) {
      console.error('Missing Passport API credentials')
      return NextResponse.json(
        { error: 'Passport API not configured' },
        { status: 500 }
      )
    }

    // Call Passport API to verify score
    const passportResponse = await fetch(
      `https://api.scorer.gitcoin.co/registry/score/${scorerId}/${address}`,
      {
        headers: {
          // Gitcoin Passport Scorer expects X-API-Key header
          'X-API-Key': `${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!passportResponse.ok) {
      let errorBody: unknown = undefined
      try { errorBody = await passportResponse.json() } catch {}
      console.error('Passport API error:', passportResponse.status, passportResponse.statusText, errorBody)
      return NextResponse.json(
        { error: 'Failed to verify score with Passport API', details: errorBody },
        { status: passportResponse.status }
      )
    }

    const passportData = await passportResponse.json()
    
    // Extract score and determine if passing
    const score = passportData.score || 0
    const isPassing = score >= 1

    return NextResponse.json({
      verified: true,
      score: score.toString(),
      isPassing,
      rawData: passportData
    })

  } catch (error) {
    console.error('Server-side verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
