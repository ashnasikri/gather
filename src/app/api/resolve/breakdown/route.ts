import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const {
    rawVent, followUpAnswer, feelings, bodySensations, needs,
    myStory, selectedPathway, personName, disturbance, responsePattern,
  } = await req.json()
  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const system = `You are a compassionate NVC guide. Generate the full NVC breakdown and multiple action options.

User's vent: """
${rawVent}
"""
Follow-up answer: ${followUpAnswer ?? 'none'}
Their feelings: ${(feelings ?? []).join(', ')}
Their body sensations: ${(bodySensations ?? []).join(', ')}
Their needs: ${(needs ?? []).join(', ')}
The story in their head: "${myStory ?? 'not provided'}"
Pathway they resonated with: "${selectedPathway ?? 'none selected'}"
Person: ${personName ?? 'unknown'}
Disturbance level: ${disturbance ?? 50}/100
Their response pattern: ${responsePattern ?? 'unknown'}

Adapt the draft messages based on their pattern:
- If "quiet" (tends to go quiet): make messages extra gentle, acknowledge the difficulty of reaching out
- If "please" (tends to try to make it okay): make messages boundaried, not overly accommodating — help them stand firm
- If "react" (tends to react immediately): make messages measured, add a beat of pause — help them slow down
- If "avoid" (tends to pull away): make messages grounding — help them stay present with this

Return ONLY valid JSON:
{
  "observation": "What happened, no judgment. 1-2 sentences.",
  "feeling": "Warm validation using their feelings. 1-2 sentences.",
  "need": "Unmet needs connected to feelings. 1-2 sentences.",
  "request": "Specific request. 'Would you be willing to...'",
  "empathyMap": "Other person's possible experience, informed by selected pathway. 2-3 sentences.",
  "beforeAfter": {
    "before": "Paraphrase from vent — reactive version",
    "after": "Same sentiment in NVC"
  },
  "draftMessage": "Ready to send. Warm, honest, under 100 words. Starts with name. Ends with invitation.",
  "checkInMessage": "Hey [name or 'hey'], I wanted to check in. When [observation], I felt [feelings from their list]. What I needed was [needs from their list]. The story in my head was [myStory if provided, else honest framing]. I'd love to hear how you experienced it — can we talk?",
  "freezeMessage": "A gentle 'I need more time' message: Hey [name], I've been thinking about [brief context] and need a bit more time to gather my thoughts. It matters to me — I'll come back to this.",
  "conflictType": "unmet_expectation or boundary_crossed or feeling_unseen or miscommunication or values_clash or recurring_pattern"
}

Draft/check-in guidelines: human, I-statements, conversational not clinical, invitation not demand.
Check-in must follow Juan's framework exactly: when/felt/needed/story/curiosity.
Freeze message: honest about needing time, affirm the relationship matters.`

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1536,
      messages: [{ role: 'user', content: 'Generate the NVC breakdown.' }],
      system,
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err) {
    console.error('[POST /api/resolve/breakdown]', err)
    return NextResponse.json({ error: 'breakdown_failed' }, { status: 500 })
  }
}
