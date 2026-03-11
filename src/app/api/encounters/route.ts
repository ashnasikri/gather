import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { formatRelativeDate, formatTime } from '@/lib/dateUtils'

export async function GET() {
  const { data: encounters, error } = await supabase
    .from('encounters')
    .select('*, people(name, city)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/encounters] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shaped = (encounters ?? []).map((enc) => ({
    id: enc.id,
    personName: (enc.people as { name: string; city: string | null } | null)?.name ?? enc.person_id,
    personId: enc.person_id,
    type: enc.type,
    date: enc.date ? formatRelativeDate(enc.date) : formatRelativeDate(enc.created_at),
    time: enc.time ?? formatTime(enc.created_at),
    summary: enc.summary,
    energy: enc.energy,
    city: (enc.people as { name: string; city: string | null } | null)?.city ?? null,
    createdAt: enc.created_at,
  }))

  return NextResponse.json(shaped)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('[POST /api/encounters] body:', JSON.stringify(body))

  const { personName, city, date, type, summary, fullText, energy, category, source, rawTranscript, actions, links } = body

  if (!personName || !type || !summary) {
    console.log('[POST /api/encounters] validation failed — missing fields:', { personName, type, summary })
    return NextResponse.json({ error: 'personName, type, and summary are required' }, { status: 400 })
  }

  // Find or create person (case-insensitive)
  const { data: existing, error: findErr } = await supabase
    .from('people')
    .select('*')
    .ilike('name', personName.trim())
    .limit(1)
    .single()

  if (findErr && findErr.code !== 'PGRST116') {
    // PGRST116 = "not found" — that's fine, we'll create; anything else is a real error
    console.error('[POST /api/encounters] find person error:', findErr)
  }

  let person = existing
  if (!person) {
    const { data: created, error: createErr } = await supabase
      .from('people')
      .insert({ name: personName.trim(), city: city ?? null })
      .select()
      .single()
    console.log('[POST /api/encounters] create person result:', { created, createErr })
    if (createErr) return NextResponse.json({ error: createErr.message, details: createErr }, { status: 500 })
    person = created
  } else if (city && !person.city) {
    await supabase.from('people').update({ city }).eq('id', person.id)
  }

  // Create encounter
  const now = new Date()
  const dateStr = date ?? now.toISOString().slice(0, 10) // use provided date or today
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const { data: encounter, error: encErr } = await supabase
    .from('encounters')
    .insert({
      person_id: person.id,
      type,
      date: dateStr,
      time: timeStr,
      summary,
      full_text: fullText ?? null,
      energy: energy ?? null,
      category: category ?? null,
      source: source ?? 'text',
      raw_transcript: rawTranscript ?? null,
    })
    .select()
    .single()

  console.log('[POST /api/encounters] create encounter result:', { encounter, encErr })
  if (encErr) return NextResponse.json({ error: encErr.message, details: encErr }, { status: 500 })

  // Create actions if provided
  if (actions && actions.length > 0) {
    const actionRows = actions.map((text: string) => ({
      person_id: person.id,
      encounter_id: encounter.id,
      text,
      done: false,
    }))
    const { error: actErr } = await supabase.from('actions').insert(actionRows)
    if (actErr) console.error('[POST /api/encounters] actions insert error:', actErr)
  }

  // Save detected links
  if (links && links.length > 0) {
    const linkRows = links.map((url: string) => ({
      person_id: person.id,
      url,
      title: null,
      source: null,
      summary: null,
    }))
    const { error: linkErr } = await supabase.from('links').insert(linkRows)
    if (linkErr) console.error('[POST /api/encounters] links insert error:', linkErr)
  }

  return NextResponse.json({ encounter, person })
}
