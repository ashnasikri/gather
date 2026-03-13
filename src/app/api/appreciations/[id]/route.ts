import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error: fetchError } = await supabase
    .from('appreciations')
    .select('storage_path')
    .eq('id', params.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const { error: storageError } = await supabase.storage
    .from('appreciations')
    .remove([data.storage_path])

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { error: dbError } = await supabase
    .from('appreciations')
    .delete()
    .eq('id', params.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
