import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { rawVent, followUpAnswer, feelings, needs, personName } = await req.json()
  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const system = `You are a compassionate NVC guide. The user has a conflict with someone and has identified their own feelings and needs. Now generate 3-4 DIFFERENT possible stories for what the other person might be experiencing.

These are not "the answer" — they are possibilities. The goal is to help the user hold multiple interpretations before deciding what's true. Each story should be genuinely plausible, not strawmen.

User's vent: """
${rawVent}
"""
Follow-up answer: ${followUpAnswer ?? 'none'}
User's feelings: ${(feelings ?? []).join(', ')}
User's needs: ${(needs ?? []).join(', ')}
Other person: ${personName ?? 'unknown'}

Return ONLY valid JSON:
{
  "pathways": [
    {
      "title": "short 3-5 word title",
      "story": "2-3 sentence description of what might be going on for the other person. Written warmly, with genuine empathy. Start with 'maybe...' or 'it's possible that...'",
      "theirFeeling": "what they might be feeling",
      "theirNeed": "what they might need"
    }
  ]
}

Guidelines:
- Generate exactly 3-4 pathways
- Make them genuinely DIFFERENT from each other — different root causes, different emotional states
- At least one should be generous/compassionate toward the other person
- At least one should validate the user's interpretation
- None should be dismissive of the user's feelings
- Keep the language warm and exploratory, not clinical
- Use "maybe" and "it's possible" — these are not facts, they are invitations to consider`

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate the pathways.' }],
      system,
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err) {
    console.error('[POST /api/resolve/pathways]', err)
    return NextResponse.json({ error: 'pathways_failed' }, { status: 500 })
  }
}
