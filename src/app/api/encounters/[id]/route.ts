import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('encounters').delete().eq('id', params.id)
  if (error) {
    console.error('[DELETE /api/encounters/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { summary, type, energy } = body

  const updates: Record<string, unknown> = {}
  if (summary !== undefined) updates.summary = summary
  if (type !== undefined) updates.type = type
  if (energy !== undefined) updates.energy = energy

  const { data, error } = await supabase
    .from('encounters')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/encounters/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
