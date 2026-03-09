"use client";

import Image from "next/image";
import { BuddyMood } from "@/lib/types";

interface BonfireCharacterProps {
  mood?: BuddyMood;
}

const moodSprite: Record<BuddyMood, string> = {
  idle: "/sprites/idle-removebg-preview.png",
  listening: "/sprites/listening-removebg-preview.png",
  happy: "/sprites/happy-removebg-preview.png",
  thinking: "/sprites/thinking-removebg-preview.png",
  sleepy: "/sprites/sleepy-removebg-preview.png",
};

const moodSpeech: Record<BuddyMood, { main: string; sub: string }> = {
  idle: {
    main: "who'd you gather with today?",
    sub: "i'm here whenever you're ready",
  },
  listening: {
    main: "i'm listening...",
    sub: "take your time",
  },
  happy: {
    main: "love that, tell me more",
    sub: "sounds like a real connection",
  },
  thinking: {
    main: "let me think on that...",
    sub: "pulling it together",
  },
  sleepy: {
    main: "still here with you",
    sub: "even the fire rests sometimes",
  },
};

export default function BonfireCharacter({ mood = "idle" }: BonfireCharacterProps) {
  const speech = moodSpeech[mood];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "24px 0 8px",
      }}
    >
      {/* Glow + character container */}
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {/* Radial glow behind character */}
        <div
          style={{
            position: "absolute",
            inset: "-40px",
            background:
              "radial-gradient(ellipse at center, rgba(224,120,64,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        {/* Character */}
        <div className="animate-float" style={{ position: "relative", zIndex: 1 }}>
          <Image
            src={moodSprite[mood]}
            alt={`Bonfire — ${mood}`}
            width={319}
            height={782}
            style={{ height: "160px", width: "auto", mixBlendMode: "multiply" }}
            priority
          />
        </div>
      </div>

      {/* Speech */}
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <p
          style={{
            fontFamily: "var(--font-newsreader), Georgia, serif",
            fontSize: "17px",
            fontWeight: 300,
            color: "var(--text)",
            margin: "0 0 6px",
            lineHeight: 1.4,
          }}
        >
          {speech.main}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12.5px",
            fontWeight: 300,
            color: "var(--text-quiet)",
            margin: 0,
          }}
        >
          {speech.sub}
        </p>
      </div>
    </div>
  );
}
