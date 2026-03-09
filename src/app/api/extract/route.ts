import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { rawText } = await req.json()
  if (!rawText?.trim()) {
    return NextResponse.json({ error: 'rawText is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no_api_key' }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an AI assistant for a personal people journal app called "Gather".

The user has just logged an encounter — a meeting, call, chat, or moment with someone. Parse their raw input and extract structured data.

Raw input:
"""
${rawText}
"""

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):
{
  "personName": "the person's name (first name, or full name if mentioned)",
  "city": "city/location if mentioned, or null",
  "category": "work" or "personal" or "social",
  "encounterType": "coffee" or "call" or "event" or "dm" or "bumped",
  "summary": "a clean 1-2 sentence summary of the encounter, written in lowercase casual tone, from the user's perspective. Keep it personal and warm, not clinical.",
  "fullText": "the original text, cleaned up slightly for readability but preserving the user's voice",
  "links": ["any URLs found in the text"],
  "actions": ["any action items, promises, or follow-ups mentioned or implied. Be conservative — only include clear commitments."],
  "confidence": "high" or "medium" or "low"
}

Guidelines:
- If no person name is clearly stated, use "someone" and set confidence to "low"
- Prefer first names unless a full name is clearly given
- For encounterType: "coffee" for in-person casual, "call" for phone/video, "event" for meetups/conferences, "dm" for messages/DMs/email, "bumped" for unexpected run-ins
- For category: "work" if it involves business/partnerships/projects, "personal" for friends/family, "social" for events/meetups/networking
- Keep the summary warm and personal — this is a journal, not a CRM
- Only extract action items that are real commitments, not vague intentions
- If a LinkedIn URL is found, try to infer the person's name from the URL path`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted = JSON.parse(cleaned)
    return NextResponse.json(extracted)
  } catch (err) {
    console.error('[POST /api/extract] error:', err)
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
