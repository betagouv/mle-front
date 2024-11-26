import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')

  const response = await fetch(`${process.env.API_URL}/territories?q=${q}`)

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to retrieve territories' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
