import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('appreciations')
    .select('id, storage_path, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const appreciations = (data ?? []).map((row) => ({
    id: row.id,
    url: `${base}/storage/v1/object/public/appreciations/${row.storage_path}`,
    created_at: row.created_at,
  }))

  return NextResponse.json({ appreciations })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const contentType = file.type || 'image/jpeg'
  const { error: uploadError } = await supabase.storage
    .from('appreciations')
    .upload(filename, uint8, { contentType, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error: dbError } = await supabase
    .from('appreciations')
    .insert({ storage_path: filename })
    .select('id, storage_path, created_at')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return NextResponse.json({
    id: data.id,
    url: `${base}/storage/v1/object/public/appreciations/${data.storage_path}`,
    created_at: data.created_at,
  })
}
