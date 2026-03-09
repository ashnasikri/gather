import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { personId, text } = await req.json()
  if (!personId || !text?.trim()) {
    return NextResponse.json({ error: 'personId and text are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ person_id: personId, text: text.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
