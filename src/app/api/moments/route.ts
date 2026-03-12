import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { formatRelativeDate, formatTime } from '@/lib/dateUtils'

export async function GET() {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .order('moment_date', { ascending: false })

  if (error) {
    console.error('[GET /api/moments] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const moments = (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    text: m.text ?? null,
    feeling: m.feeling ?? null,
    location: m.location ?? null,
    date: formatRelativeDate(m.moment_date),
    time: formatTime(m.moment_date),
    momentDate: m.moment_date,
    createdAt: m.created_at,
  }))

  return NextResponse.json({ moments })
}

export async function POST(req: NextRequest) {
  const { title, text, feeling, location } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('moments')
    .insert({
      title: title.trim(),
      text: text?.trim() ?? null,
      feeling: feeling ?? null,
      location: location?.trim() ?? null,
      moment_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/moments] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    text: data.text ?? null,
    feeling: data.feeling ?? null,
    location: data.location ?? null,
    date: formatRelativeDate(data.moment_date),
    time: formatTime(data.moment_date),
    momentDate: data.moment_date,
    createdAt: data.created_at,
  })
}
