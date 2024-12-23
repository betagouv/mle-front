import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = new URLSearchParams()

  const bbox = url.searchParams.get('bbox')
  const page = url.searchParams.get('page')

  if (bbox) params.append('bbox', bbox)
  if (page) params.append('page', page)

  const response = await fetch(`${process.env.API_URL}/accommodations${params.size > 0 ? `?${params.toString()}` : ''}`)
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to retrieve accomodations' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
