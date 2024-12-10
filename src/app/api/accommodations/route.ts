import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const bbox = url.searchParams.get('bbox')

  const response = await fetch(`${process.env.API_URL}/accommodations${bbox ? `?bbox=${bbox}` : ''}`)
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to retrieve accomodations' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
