import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const response = await fetch(`${process.env.API_URL}/accommodations/${params.slug}/`)
  if (!response.ok) {
    return NextResponse.json({ error: `Failed to retrieve accomodation with slug: ${params.slug}` }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
