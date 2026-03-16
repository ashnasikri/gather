import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { rawVent, followUpAnswer, feelings, needs, personName, previousPathways, feedback } = await req.json()
  if (!rawVent?.trim()) return NextResponse.json({ error: 'rawVent is required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })

  const system = `You are a compassionate NVC guide. Generate 3-4 genuinely DIFFERENT possible stories for what the other person might be experiencing.

User's vent: """
${rawVent}
"""
Follow-up answer: ${followUpAnswer ?? 'none'}
Their feelings: ${(feelings ?? []).join(', ')}
Their needs: ${(needs ?? []).join(', ')}
Other person: ${personName ?? 'unknown'}

Previous pathways attempt:
${JSON.stringify(previousPathways ?? [], null, 2)}

User's feedback: "${feedback ?? ''}"

Please generate new pathways that address this feedback. Make them meaningfully different from the previous attempt.

Return ONLY valid JSON:
{
  "pathways": [
    {
      "title": "3-5 word title, lowercase",
      "story": "2-3 sentences starting with 'maybe...' or 'it's possible...'. Genuinely empathetic, not performative.",
      "theirFeeling": "one word",
      "theirNeed": "one word"
    }
  ]
}

Rules:
- Exactly 3-4 pathways
- Genuinely different root causes — not variations of the same idea
- At least one generous toward the other person
- At least one that validates the user's read of the situation
- None dismissive of the user's experience
- Language: warm, exploratory, human`

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate revised pathways.' }],
      system,
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err) {
    console.error('[POST /api/resolve/pathways-retry]', err)
    return NextResponse.json({ error: 'pathways_retry_failed' }, { status: 500 })
  }
}
