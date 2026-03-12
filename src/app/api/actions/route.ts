import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const all = new URL(req.url).searchParams.get('all') === 'true'
  let query = supabase.from('actions').select('*, people(name)').order('created_at', { ascending: true })
  if (!all) query = query.eq('done', false)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shaped = (data ?? []).map((a) => ({
    id: a.id,
    text: a.text,
    done: a.done,
    personId: a.person_id,
    personName: (a.people as { name: string } | null)?.name ?? null,
    encounterId: a.encounter_id ?? null,
    createdAt: a.created_at,
  }))

  return NextResponse.json(shaped)
}

export async function POST(req: NextRequest) {
  const { text, personId } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('actions')
    .insert({ text: text.trim(), person_id: personId ?? null, done: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
