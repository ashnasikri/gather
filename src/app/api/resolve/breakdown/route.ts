import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { rawVent, followUpAnswer, feelings, bodySensations, needs, personName, myStory, selectedPathway } = await req.json()
  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const system = `You are a compassionate NVC guide. The user has vented about a conflict and identified their feelings, body sensations, and needs. Generate the full NVC breakdown.

User's vent: """
${rawVent}
"""
Follow-up answer: ${followUpAnswer ?? 'none'}
Their chosen feelings: ${(feelings ?? []).join(', ')}
Their body sensations: ${(bodySensations ?? []).join(', ')}
Their chosen needs: ${(needs ?? []).join(', ')}
Person involved: ${personName ?? 'unknown'}
The story in the user's head: ${myStory ?? 'not provided'}
The perspective they resonated with: ${selectedPathway ?? 'none selected'}

Return ONLY valid JSON:
{
  "observation": "What actually happened, stated without judgment or evaluation. Be specific and factual. 1-2 sentences.",
  "feeling": "A warm, validating description of what the user is feeling, using their selected feelings. Connect the body sensations too. 1-2 sentences.",
  "need": "The unmet needs underneath, explained warmly. Connect the feelings to the needs. 1-2 sentences.",
  "request": "A specific, doable request. Frame as 'would you be willing to...' — positive action language.",
  "empathyMap": "What the other person might be feeling and needing. Be generous — help the user see their humanity. 2-3 sentences.",
  "beforeAfter": {
    "before": "A representative quote or paraphrase from the raw vent — the reactive version",
    "after": "The same sentiment in clean NVC language"
  },
  "draftMessage": "A ready-to-send message to the other person. Warm, honest, non-blaming. Uses NVC structure but sounds natural. Under 100 words. Starts with their name. Ends with invitation to talk.",
  "checkInMessage": "A gentle check-in message using this exact structure: 'Hey [person's name or 'hey'], I wanted to check in with you about something. When [observation — what factually happened], I felt [feelings from their list]. What I needed was [needs from their list]. The story in my head was [myStory if provided, else a brief honest framing of user's perspective]. I'd love to hear how you experienced it — can we talk?' Keep it warm and conversational, not clinical.",
  "conflictType": "unmet_expectation" or "boundary_crossed" or "feeling_unseen" or "miscommunication" or "values_clash" or "recurring_pattern"
}

Guidelines for draft message and check-in message:
- Sound human, not therapeutic
- Use "I" statements, not "you always..."
- Keep it conversational — this is a text/DM, not a letter
- End with an invitation, not a demand`

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
