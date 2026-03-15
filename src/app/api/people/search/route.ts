import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { formatRelativeDate } from '@/lib/dateUtils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const { data: people, error } = await supabase
    .from('people')
    .select('id, name, city, encounters(id, created_at)')
    .ilike('name', `%${q}%`)
    .limit(5)

  if (error) {
    console.error('[GET /api/people/search] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = (people ?? [])
    .map((p) => {
      const enc = (p.encounters as { id: string; created_at: string }[]) ?? []
      const sorted = [...enc].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      return {
        id: p.id,
        name: p.name,
        city: p.city ?? null,
        encounterCount: enc.length,
        lastSeen: sorted[0] ? formatRelativeDate(sorted[0].created_at) : null,
      }
    })
    .sort((a, b) => b.encounterCount - a.encounterCount)

  return NextResponse.json(results)
}
