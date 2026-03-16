import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { rawVent, personName, intent, responsePattern, previousReflection, feedback } = await req.json()
  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const system = `You are a compassionate NVC guide inside an app called Gather. Someone is sharing something that's weighing on them.

Context (may be partial or empty):
- Person involved: ${personName ?? 'unknown'}
- What they need: ${intent ?? 'not specified'}
- Their usual pattern: ${responsePattern ?? 'not specified'}

Their words:
"""
${rawVent}
"""

Previous reflection attempt:
"${previousReflection ?? ''}"

User's feedback: "${feedback ?? ''}"

Please try again with this feedback in mind. Keep what was right, fix what was off.

Your job:
1. Reflect back what you heard — 1-2 sentences, warm, non-judgmental.
2. Suggest 3-5 feelings they might be experiencing
3. Suggest 2-4 body sensations they might notice
4. Suggest 3-5 unmet needs
5. Ask ONE follow-up question if the vent is vague. Null if clear enough.
6. Extract the person's name if mentioned in the vent
7. Write a brief acknowledgment — 1-2 sentences of pure validation. No advice, no reframing.

Return ONLY valid JSON:
{
  "reflection": "what you heard, briefly",
  "acknowledgment": "pure validation — no advice, no fixing",
  "suggestedFeelings": ["feeling1", "feeling2"],
  "suggestedBodySensations": ["sensation1", "sensation2"],
  "suggestedNeeds": ["need1", "need2"],
  "followUp": "question or null",
  "personName": "name or null"
}

Feelings vocabulary: frustrated, resentful, irritated, angry, annoyed, bitter, hurt, disappointed, lonely, sad, neglected, unappreciated, anxious, insecure, overwhelmed, vulnerable, worried, scared, exhausted, drained, burnt out, numb, depleted, heavy, confused, torn, lost, unsure, conflicted, stuck, embarrassed, guilty, ashamed, unworthy, inadequate, exposed

Needs vocabulary: belonging, closeness, trust, understanding, empathy, acceptance, freedom, independence, space, choice, self-expression, privacy, acknowledgment, appreciation, recognition, being seen, being heard, equality, consistency, follow-through, reciprocity, accountability, honesty, dependability, security, stability, predictability, protection, comfort, peace, purpose, growth, contribution, creativity, integrity, authenticity

Body sensations: tight chest, racing heart, shallow breathing, clenched jaw, knot in stomach, lump in throat, tension in shoulders, heaviness, heat in face, cold hands, restless legs, headache, shaky, teary eyes, nausea`

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate the revised reflection.' }],
      system,
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err) {
    console.error('[POST /api/resolve/reflect-retry]', err)
    return NextResponse.json({ error: 'reflect_retry_failed' }, { status: 500 })
  }
}
