// app/api/wiki/route.ts (App Router style)
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Leeds'

  const sectionUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    title
  )}&format=json&prop=sections&origin=*`
  const sectionRes = await fetch(sectionUrl)
  const sectionData = await sectionRes.json()

  const demographicsSection = sectionData.parse.sections.find(
    (s: any) => s.line.toLowerCase().includes('demographics') || s.line.toLowerCase().includes('population')
  )

  if (!demographicsSection) {
    return NextResponse.json({ error: 'Demographics section not found' }, { status: 404 })
  }

  const sectionId = demographicsSection.index
  const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    title
  )}&format=json&prop=text&section=${sectionId}&origin=*`
  const contentRes = await fetch(contentUrl)
  const contentData = await contentRes.json()

  return NextResponse.json({
    html: contentData.parse.text['*'], // Wikipedia returns raw HTML
  })
}

