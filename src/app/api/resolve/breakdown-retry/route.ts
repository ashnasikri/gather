import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// target: which section(s) to regenerate
// "nvc" → regenerate observation, feeling, need, request, empathyMap
// "checkin" → regenerate checkInMessage
// "draft" → regenerate draftMessage
// "freeze" → regenerate freezeMessage

export async function POST(req: NextRequest) {
  const {
    target, feedback,
    rawVent, followUpAnswer, feelings, bodySensations, needs,
    myStory, selectedPathway, personName, disturbance, responsePattern,
    previousContent,
  } = await req.json()
  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const context = `User's vent: """${rawVent}"""
Follow-up: ${followUpAnswer ?? 'none'}
Feelings: ${(feelings ?? []).join(', ')}
Body sensations: ${(bodySensations ?? []).join(', ')}
Needs: ${(needs ?? []).join(', ')}
Their story: "${myStory ?? 'not provided'}"
Pathway resonated with: "${selectedPathway ?? 'none'}"
Person: ${personName ?? 'unknown'}
Disturbance: ${disturbance ?? 50}/100
Response pattern: ${responsePattern ?? 'unknown'}`

  const targetInstructions: Record<string, { returnShape: string; instructions: string }> = {
    nvc: {
      instructions: 'Regenerate the NVC breakdown (observation, feeling, need, request, empathyMap).',
      returnShape: `{
  "observation": "...",
  "feeling": "...",
  "need": "...",
  "request": "...",
  "empathyMap": "..."
}`,
    },
    checkin: {
      instructions: "Regenerate the check-in message using Juan's framework: when/felt/needed/story/curiosity.",
      returnShape: `{ "checkInMessage": "..." }`,
    },
    draft: {
      instructions: 'Regenerate the draft message. Warm, honest, under 100 words, ends with invitation.',
      returnShape: `{ "draftMessage": "..." }`,
    },
    freeze: {
      instructions: "Regenerate the 'I need more time' freeze message. Gentle, honest, affirms relationship matters.",
      returnShape: `{ "freezeMessage": "..." }`,
    },
  }

  const t = targetInstructions[target ?? 'nvc'] ?? targetInstructions.nvc

  const system = `You are a compassionate NVC guide.

${context}

Previous content:
${JSON.stringify(previousContent ?? {}, null, 2)}

User's feedback: "${feedback ?? ''}"

${t.instructions}

Address the feedback specifically. Return ONLY valid JSON:
${t.returnShape}`

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 768,
      messages: [{ role: 'user', content: 'Regenerate the section.' }],
      system,
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err) {
    console.error('[POST /api/resolve/breakdown-retry]', err)
    return NextResponse.json({ error: 'breakdown_retry_failed' }, { status: 500 })
  }
}
