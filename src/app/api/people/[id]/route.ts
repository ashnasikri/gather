import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { formatRelativeDate } from '@/lib/dateUtils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  const [
    { data: person, error: personErr },
    { data: encounters },
    { data: notes },
    { data: actions },
    { data: links },
  ] = await Promise.all([
    supabase.from('people').select('*').eq('id', id).single(),
    supabase.from('encounters').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    supabase.from('notes').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    supabase.from('actions').select('*').eq('person_id', id).order('done', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('links').select('*').eq('person_id', id).order('created_at', { ascending: false }),
  ])

  if (personErr || !person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  const shapedEncounters = (encounters ?? []).map((enc) => ({
    id: enc.id,
    type: enc.type,
    date: enc.date ? formatRelativeDate(enc.date) : formatRelativeDate(enc.created_at),
    time: enc.time ?? '',
    summary: enc.summary,
    full_text: enc.full_text,
    energy: enc.energy,
    category: enc.category,
    created_at: enc.created_at,
  }))

  return NextResponse.json({
    person,
    encounters: shapedEncounters,
    notes: notes ?? [],
    actions: actions ?? [],
    links: links ?? [],
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.city !== undefined) updates.city = body.city
  if (body.context !== undefined) updates.context = body.context
  if (body.first_met_date !== undefined) updates.first_met_date = body.first_met_date
  if (body.next_meeting_date !== undefined) updates.next_meeting_date = body.next_meeting_date

  const { data, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
