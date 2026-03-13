import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const update: Record<string, unknown> = {}

  if ('text' in body) update.text = body.text
  if ('person_name' in body) update.person_name = body.person_name
  if ('priority' in body) update.priority = body.priority
  if ('due_text' in body) update.due_text = body.due_text
  if ('completed' in body) {
    update.completed = body.completed
    update.completed_at = body.completed ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from('commitments')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('commitments').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
