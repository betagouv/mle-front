import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams.toString()
  const response = await fetch(`${process.env.API_URL}/territories/cities/${searchParams ? `?${searchParams}` : ''}`)

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to retrieve cities using department code' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
