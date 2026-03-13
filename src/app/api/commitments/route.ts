import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 0, important: 1, whenever: 2 }

export async function GET() {
  const { data, error } = await supabase
    .from('commitments')
    .select('*')
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sorted = (data ?? []).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const pa = PRIORITY_WEIGHT[a.priority] ?? 2
    const pb = PRIORITY_WEIGHT[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return NextResponse.json({ commitments: sorted })
}

export async function POST(req: NextRequest) {
  const { text, person_name, source_type, source_id, priority, due_text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('commitments')
    .insert({
      text: text.trim(),
      person_name: person_name?.trim() || null,
      source_type: source_type ?? 'manual',
      source_id: source_id ?? null,
      priority: priority ?? 'whenever',
      due_text: due_text?.trim() || null,
      completed: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
