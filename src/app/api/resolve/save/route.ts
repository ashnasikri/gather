import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    personName, personId: providedPersonId,
    rawVent, feelings, bodySensations, needs, conflictType,
    nvcObservation, nvcFeeling, nvcNeed, nvcRequest,
    empathyMap, draftMessage,
  } = body

  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })

  // Resolve person
  let personId = providedPersonId ?? null
  if (!personId && personName?.trim()) {
    const { data: existing } = await supabase
      .from('people')
      .select('id')
      .ilike('name', personName.trim())
      .limit(1)
      .single()
    if (existing) personId = existing.id
  }

  // Save resolution
  const { data: resolution, error: resErr } = await supabase
    .from('resolutions')
    .insert({
      person_id: personId,
      person_name: personName?.trim() ?? null,
      raw_vent: rawVent.trim(),
      feelings: feelings ?? [],
      body_sensations: bodySensations ?? [],
      needs: needs ?? [],
      conflict_type: conflictType ?? null,
      nvc_observation: nvcObservation ?? null,
      nvc_feeling: nvcFeeling ?? null,
      nvc_need: nvcNeed ?? null,
      nvc_request: nvcRequest ?? null,
      empathy_map: empathyMap ?? null,
      draft_message: draftMessage ?? null,
    })
    .select()
    .single()

  if (resErr) {
    console.error('[POST /api/resolve/save] resolution insert:', resErr)
    return NextResponse.json({ error: resErr.message }, { status: 500 })
  }

  // If linked to a person, create a resolve encounter
  if (personId) {
    const topFeelings = (feelings ?? []).slice(0, 2).join(', ')
    const topNeeds = (needs ?? []).slice(0, 2).join(', ')
    const summary = `processed tension${topFeelings ? ` — feeling ${topFeelings}` : ''}${topNeeds ? `. needing ${topNeeds}` : ''}.`
    const now = new Date()
    await supabase.from('encounters').insert({
      person_id: personId,
      type: 'resolve',
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      summary,
      energy: 50,
      category: 'personal',
      source: 'text',
    })
  }

  return NextResponse.json({ resolution })
}
