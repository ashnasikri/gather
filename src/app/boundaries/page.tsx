"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";

// ─── Types ──────────────────────────────────────────────────────────────────────

type Feeling = "light" | "heavy" | "numb";
type Verdict = "green" | "amber" | "rose";
type Screen = "questions" | "verdict";

// ─── Data ───────────────────────────────────────────────────────────────────────

const FEELINGS = [
  {
    key: "light" as Feeling,
    emoji: "✨",
    label: "light",
    desc: "excited, energised",
    color: "#7EA67A",
    soft: "rgba(126,166,122,0.12)",
    border: "rgba(126,166,122,0.33)",
  },
  {
    key: "heavy" as Feeling,
    emoji: "🪨",
    label: "heavy",
    desc: "dread, obligation",
    color: "#B07070",
    soft: "rgba(176,112,112,0.10)",
    border: "rgba(176,112,112,0.33)",
  },
  {
    key: "numb" as Feeling,
    emoji: "🌫️",
    label: "numb",
    desc: "just... agreeing",
    color: "#706860",
    soft: "rgba(112,104,96,0.08)",
    border: "rgba(112,104,96,0.33)",
  },
];

const REASONS = [
  "I genuinely want to",
  "I feel guilty saying no",
  "I'm afraid they'll think less of me",
  "I said yes before I thought about it",
  "I think I should",
  "I don't know how to say no",
];

// ─── Verdict logic ───────────────────────────────────────────────────────────────

function getVerdict(feeling: Feeling, reasons: string[]): Verdict {
  if (feeling === "light" && reasons.includes("I genuinely want to")) return "green";
  if (feeling === "heavy" || (!reasons.includes("I genuinely want to") && reasons.length > 0)) return "rose";
  return "amber";
}

// ─── Placeholder text renderer ───────────────────────────────────────────────────

function MsgText({ text }: { text: string }) {
  const parts = text.split(/(\[day\]|\[timeframe\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[.+\]$/.test(p)
          ? <span key={i} style={{ color: "var(--text-quiet)" }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ─── Copy card ───────────────────────────────────────────────────────────────────

function CopyCard({
  msgLabel,
  labelColor,
  text,
  accentColor,
}: {
  msgLabel: string;
  labelColor: string;
  text: string;
  accentColor: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", padding: "16px 18px", marginBottom: "10px" }}>
      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: labelColor, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
        {msgLabel}
      </div>
      <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, fontStyle: "italic", color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
        <MsgText text={text} />
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
        <button
          onClick={handleCopy}
          style={{ background: copied ? accentColor : "none", border: `1px solid ${copied ? accentColor : "var(--border-light)"}`, borderRadius: "8px", padding: "6px 14px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: copied ? "white" : "var(--text-quiet)", cursor: "pointer", transition: "all 0.15s" }}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Verdict screen ──────────────────────────────────────────────────────────────

function VerdictScreen({ verdict, onReset }: { verdict: Verdict; onReset: () => void }) {
  const configs = {
    green: {
      sprite: "/sprites/happy-removebg-preview.png",
      title: "this yes is really yours",
      titleColor: "#7EA67A",
      body: "you want this and it feels right. trust that.",
    },
    amber: {
      sprite: "/sprites/thinking-removebg-preview.png",
      title: "this needs a slower yes",
      titleColor: "#C49860",
      body: "something's pulling you toward it, but something's also pulling back. buy yourself time.",
    },
    rose: {
      sprite: "/sprites/sleepy-removebg-preview.png",
      title: "you already know",
      titleColor: "#B07070",
      body: "you're saying yes for them, not for you. that's okay to notice. here's help saying no.",
    },
  };

  const c = configs[verdict];

  return (
    <div className="animate-fade-in" style={{ padding: "32px 16px 0" }}>
      {/* Character */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: "-30px", background: "radial-gradient(ellipse at center, rgba(224,120,64,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div className="animate-float">
            <Image src={c.sprite} alt="" width={319} height={782} style={{ height: "60px", width: "auto" }} />
          </div>
        </div>
      </div>

      {/* Title + body */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "21px", fontWeight: 300, color: c.titleColor, margin: "0 0 12px", lineHeight: 1.3 }}>
          {c.title}
        </h2>
        <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
          {c.body}
        </p>
      </div>

      {/* Amber: one message */}
      {verdict === "amber" && (
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
            say this instead
          </div>
          <CopyCard
            msgLabel=""
            labelColor="#C49860"
            text="I'm interested but I need to check my capacity before I commit. Can I get back to you by [day]?"
            accentColor="#C49860"
          />
        </div>
      )}

      {/* Rose: three messages */}
      {verdict === "rose" && (
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>
            ways to say no
          </div>
          <CopyCard msgLabel="the kind no" labelColor="#B07070" text="I appreciate you thinking of me, but I need to pass on this one. My plate is genuinely full right now." accentColor="#B07070" />
          <CopyCard msgLabel="the honest no" labelColor="#B07070" text="I want to be upfront — I don't have the capacity to do this well, and I'd rather say no now than let you down later." accentColor="#B07070" />
          <CopyCard msgLabel="the rain check" labelColor="#B07070" text="I can't right now, but I don't want to lose this. Can we revisit in [timeframe]?" accentColor="#B07070" />
        </div>
      )}

      {/* Footer reminder */}
      <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", padding: "16px 20px", textAlign: "center", marginBottom: "16px" }}>
        <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "13.5px", fontWeight: 300, fontStyle: "italic", color: "var(--text-faint)", lineHeight: 1.6, margin: 0 }}>
          saying no to this is saying yes to your peace, your rest, the things already on your plate.
        </p>
      </div>

      {/* Start over */}
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: "52px" }}>
        <button
          onClick={onReset}
          style={{ background: "none", border: "1px solid var(--border-light)", borderRadius: "20px", padding: "8px 22px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", cursor: "pointer" }}
        >
          start over
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────────

export default function BoundariesPage() {
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>("questions");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when verdict shows
  useEffect(() => {
    if (screen === "verdict") scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  const toggleReason = (r: string) => {
    setReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmit = () => {
    if (!feeling || reasons.length === 0) return;
    setVerdict(getVerdict(feeling, reasons));
    setScreen("verdict");
  };

  const handleReset = () => {
    setFeeling(null);
    setReasons([]);
    setVerdict(null);
    setScreen("questions");
  };

  const canSubmit = feeling !== null && reasons.length > 0;

  return (
    <PasswordGate>
      <main style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", backgroundColor: "var(--bg)" }}>
        <div ref={scrollRef} style={{ overflowY: "auto", minHeight: "100dvh" }}>

          {/* Back */}
          <div style={{ padding: "20px 20px 0" }}>
            <Link href="/" style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-soft)", textDecoration: "none" }}>
              ← back to the fire
            </Link>
          </div>

          {screen === "verdict" && verdict ? (
            <VerdictScreen verdict={verdict} onReset={handleReset} />
          ) : (
            <div style={{ padding: "28px 16px 52px" }}>

              {/* Header */}
              <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", inset: "-30px", background: "radial-gradient(ellipse at center, rgba(224,120,64,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                    <div className="animate-float">
                      <Image src="/sprites/thinking-removebg-preview.png" alt="" width={319} height={782} style={{ height: "60px", width: "auto" }} priority />
                    </div>
                  </div>
                </div>
                <h1 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "24px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.3 }}>
                  before you say yes
                </h1>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  two honest questions. that&apos;s it.
                </p>
              </div>

              {/* Q1 */}
              <div style={{ marginBottom: "32px" }}>
                <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "19px", fontWeight: 300, color: "var(--text)", margin: "0 0 16px" }}>
                  how does this yes feel?
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {FEELINGS.map((f) => {
                    const selected = feeling === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setFeeling(f.key)}
                        style={{
                          flex: 1, padding: "16px 10px", borderRadius: "14px", textAlign: "center", cursor: "pointer",
                          backgroundColor: selected ? f.soft : "var(--surface)",
                          border: `1.5px solid ${selected ? f.border : "var(--border)"}`,
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ fontSize: "22px", marginBottom: "6px" }}>{f.emoji}</div>
                        <div style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 400, color: selected ? f.color : "var(--text)", marginBottom: "4px" }}>
                          {f.label}
                        </div>
                        <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 300, color: "var(--text-quiet)", lineHeight: 1.4 }}>
                          {f.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q2 — reveals after Q1 */}
              {feeling && (
                <div className="animate-fade-in" style={{ marginBottom: "32px" }}>
                  <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "19px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>
                    why are you saying yes?
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-faint)", margin: "0 0 14px" }}>
                    pick all that are true — be honest
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {REASONS.map((r) => {
                      const selected = reasons.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => toggleReason(r)}
                          style={{
                            padding: "9px 16px", borderRadius: "22px", cursor: "pointer",
                            backgroundColor: selected ? "var(--ember-soft)" : "var(--surface)",
                            border: `1px solid ${selected ? "rgba(224,120,64,0.30)" : "var(--border)"}`,
                            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                            fontSize: "12.5px", fontWeight: selected ? 500 : 300,
                            color: selected ? "var(--ember)" : "var(--text-soft)",
                            transition: "all 0.18s",
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit — reveals when both answered */}
              {canSubmit && (
                <div className="animate-fade-in">
                  <button
                    onClick={handleSubmit}
                    style={{ width: "100%", padding: "14px 0", borderRadius: "14px", backgroundColor: "var(--ember)", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 500, color: "white", transition: "opacity 0.2s" }}
                  >
                    check in with myself
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </PasswordGate>
  );
}
