import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { personName, url, title, source, summary } = body

  if (!personName || !url) {
    return NextResponse.json({ error: 'personName and url are required' }, { status: 400 })
  }

  // Find or create person (case-insensitive)
  const { data: existing } = await supabase
    .from('people')
    .select('*')
    .ilike('name', personName.trim())
    .limit(1)
    .single()

  let person = existing
  if (!person) {
    const { data: created, error: createErr } = await supabase
      .from('people')
      .insert({ name: personName.trim() })
      .select()
      .single()
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    person = created
  }

  const { data: link, error: linkErr } = await supabase
    .from('links')
    .insert({
      person_id: person.id,
      url,
      title: title ?? null,
      source: source ?? null,
      summary: summary ?? null,
    })
    .select()
    .single()

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

  return NextResponse.json({ link, person })
}
