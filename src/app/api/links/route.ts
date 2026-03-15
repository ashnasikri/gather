import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { personId, personName, url, title, source, summary } = body

  if (!url || (!personId && !personName)) {
    return NextResponse.json({ error: 'url and either personId or personName are required' }, { status: 400 })
  }

  let person = null

  if (personId) {
    const { data: existing, error } = await supabase.from('people').select('*').eq('id', personId).single()
    if (error || !existing) return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    person = existing
  } else {
    // Find or create person (case-insensitive)
    const { data: existing } = await supabase
      .from('people')
      .select('*')
      .ilike('name', personName.trim())
      .limit(1)
      .single()

    person = existing
    if (!person) {
      const { data: created, error: createErr } = await supabase
        .from('people')
        .insert({ name: personName.trim() })
        .select()
        .single()
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
      person = created
    }
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
