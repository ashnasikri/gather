import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ exists: false })

  const { data, error } = await supabase
    .from('people')
    .select('id, name, city')
    .ilike('name', name.trim())
    .limit(1)
    .single()

  if (error || !data) return NextResponse.json({ exists: false })
  return NextResponse.json({ exists: true, person: data })
}
