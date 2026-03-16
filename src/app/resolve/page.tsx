"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase =
  | "vent"
  | "reflecting"
  | "reflection"
  | "picker"
  | "pathways_loading"
  | "pathways"
  | "breakdown_loading"
  | "breakdown"
  | "done";

interface ReflectResult {
  reflection: string;
  suggestedFeelings: string[];
  suggestedBodySensations: string[];
  suggestedNeeds: string[];
  followUp: string | null;
  personName: string | null;
}

interface Pathway {
  title: string;
  story: string;
  theirFeeling: string;
  theirNeed: string;
}

interface BreakdownResult {
  observation: string;
  feeling: string;
  need: string;
  request: string;
  empathyMap: string;
  beforeAfter: { before: string; after: string };
  draftMessage: string;
  checkInMessage: string;
  conflictType: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEELING_FAMILIES = [
  {
    key: "anger", label: "anger", color: "#B07070",
    soft: "rgba(176,112,112,0.10)", border: "rgba(176,112,112,0.44)",
    items: ["frustrated", "resentful", "irritated", "angry", "annoyed", "bitter"],
  },
  {
    key: "sadness", label: "sadness", color: "#7A8BA6",
    soft: "rgba(122,139,166,0.10)", border: "rgba(122,139,166,0.44)",
    items: ["hurt", "disappointed", "lonely", "sad", "neglected", "unappreciated"],
  },
  {
    key: "fear", label: "fear", color: "#C49860",
    soft: "rgba(240,192,96,0.08)", border: "rgba(240,192,96,0.44)",
    items: ["anxious", "insecure", "overwhelmed", "vulnerable", "worried", "scared"],
  },
  {
    key: "fatigue", label: "fatigue", color: "var(--text-soft)",
    soft: "rgba(166,158,144,0.08)", border: "rgba(166,158,144,0.44)",
    items: ["exhausted", "drained", "burnt out", "numb", "depleted", "heavy"],
  },
  {
    key: "confusion", label: "confusion", color: "#8B7EA6",
    soft: "rgba(139,126,166,0.10)", border: "rgba(139,126,166,0.44)",
    items: ["confused", "torn", "lost", "unsure", "conflicted", "stuck"],
  },
  {
    key: "shame", label: "shame", color: "#A67A7A",
    soft: "rgba(166,122,122,0.08)", border: "rgba(166,122,122,0.44)",
    items: ["embarrassed", "guilty", "ashamed", "unworthy", "inadequate", "exposed"],
  },
];

const BODY_SENSATIONS = [
  "tight chest", "racing heart", "shallow breathing", "clenched jaw",
  "knot in stomach", "lump in throat", "tension in shoulders", "heaviness",
  "heat in face", "cold hands", "restless legs", "headache", "shaky", "teary eyes", "nausea",
];

const NEED_FAMILIES = [
  {
    key: "connection", label: "connection", color: "var(--ember)",
    soft: "var(--ember-soft)", border: "rgba(224,120,64,0.44)",
    items: ["belonging", "closeness", "trust", "understanding", "empathy", "acceptance"],
  },
  {
    key: "autonomy", label: "autonomy", color: "var(--sage)",
    soft: "var(--sage-soft)", border: "rgba(122,173,122,0.44)",
    items: ["freedom", "independence", "space", "choice", "self-expression", "privacy"],
  },
  {
    key: "respect", label: "respect", color: "#C49860",
    soft: "rgba(240,192,96,0.08)", border: "rgba(240,192,96,0.44)",
    items: ["acknowledgment", "appreciation", "recognition", "being seen", "being heard", "equality"],
  },
  {
    key: "reliability", label: "reliability", color: "#6B9EB0",
    soft: "rgba(107,158,176,0.10)", border: "rgba(107,158,176,0.44)",
    items: ["consistency", "follow-through", "reciprocity", "accountability", "honesty", "dependability"],
  },
  {
    key: "safety", label: "safety", color: "#8B7EA6",
    soft: "rgba(139,126,166,0.10)", border: "rgba(139,126,166,0.44)",
    items: ["security", "stability", "predictability", "protection", "comfort", "peace"],
  },
  {
    key: "meaning", label: "meaning", color: "#B09A6B",
    soft: "rgba(176,154,107,0.08)", border: "rgba(176,154,107,0.44)",
    items: ["purpose", "growth", "contribution", "creativity", "integrity", "authenticity"],
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function Sprite({ src, size = 60 }: { src: string; size?: number }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ position: "absolute", inset: "-30px", background: "radial-gradient(ellipse at center, rgba(224,120,64,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div className="animate-float">
        <Image src={src} alt="" width={319} height={782} style={{ height: `${size}px`, width: "auto" }} priority />
      </div>
    </div>
  );
}

function PillGroup({
  items, selected, onToggle, color, soft, border,
}: {
  items: string[]; selected: string[]; onToggle: (v: string) => void;
  color: string; soft: string; border: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {items.map((item) => {
        const on = selected.includes(item);
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            style={{
              padding: "8px 15px", borderRadius: "22px", cursor: "pointer",
              backgroundColor: on ? soft : "var(--surface)",
              border: `1px solid ${on ? border : "var(--border)"}`,
              color: on ? color : "var(--text-quiet)",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "13px", fontWeight: on ? 500 : 300,
              transition: "all 0.15s ease",
            }}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function NvcRow({
  emoji, label, text, bg, borderColor, topRadius, bottomRadius,
}: {
  emoji: string; label: string; text: string;
  bg: string; borderColor: string;
  topRadius?: boolean; bottomRadius?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: bg,
      borderLeft: `2px solid ${borderColor}`,
      borderRadius: `${topRadius ? "12px 12px" : "0 0"} ${bottomRadius ? "12px 12px" : "0 0"}`,
      padding: "14px 16px",
      borderBottom: bottomRadius ? "none" : "1px solid var(--border)",
    }}>
      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: borderColor, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
        {emoji} {label}
      </div>
      <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, fontStyle: "italic", color: "var(--text)", lineHeight: 1.6, margin: 0, paddingLeft: "21px" }}>
        {text}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
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
    <button
      onClick={copy}
      style={{
        background: copied ? "var(--ember)" : "none",
        border: `1px solid ${copied ? "var(--ember)" : "var(--border-light)"}`,
        borderRadius: "8px", padding: "6px 14px",
        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
        fontSize: "12px", color: copied ? "white" : "var(--text-quiet)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

function LoadingDots() {
  return (
    <>
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "24px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ember)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ResolvePage() {
  const [phase, setPhase] = useState<Phase>("vent");
  const [rawVent, setRawVent] = useState("");
  const [reflect, setReflect] = useState<ReflectResult | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [feelings, setFeelings] = useState<string[]>([]);
  const [bodySensations, setBodySensations] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [myStory, setMyStory] = useState("");
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  // Phase 1 → 2: call reflect API
  const handleVentSubmit = async () => {
    if (!rawVent.trim()) return;
    setError(null);
    setPhase("reflecting");
    scrollTop();
    try {
      const res = await fetch("/api/resolve/reflect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawVent: rawVent.trim() }),
      });
      if (!res.ok) throw new Error();
      const data: ReflectResult = await res.json();
      setReflect(data);
      setFeelings(data.suggestedFeelings ?? []);
      setBodySensations(data.suggestedBodySensations ?? []);
      setNeeds(data.suggestedNeeds ?? []);
      setPhase("reflection");
      scrollTop();
    } catch {
      setError("the fire flickered — try again?");
      setPhase("vent");
    }
  };

  // Phase 3 → 4
  const handleReflectionNext = () => { setPhase("picker"); scrollTop(); };

  // Phase 4 → 5: call pathways API
  const handlePickerSubmit = async () => {
    if (feelings.length === 0 || needs.length === 0) return;
    setError(null);
    setPhase("pathways_loading");
    scrollTop();
    try {
      const res = await fetch("/api/resolve/pathways", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawVent: rawVent.trim(),
          followUpAnswer: followUpAnswer.trim() || null,
          feelings, needs,
          personName: reflect?.personName ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      const data: { pathways: Pathway[] } = await res.json();
      setPathways(data.pathways ?? []);
      setPhase("pathways");
      scrollTop();
    } catch {
      setError("the fire flickered — try again?");
      setPhase("picker");
    }
  };

  // Phase 5 → 6: call breakdown API
  const handlePathwaysSubmit = async () => {
    setError(null);
    setPhase("breakdown_loading");
    scrollTop();
    try {
      const res = await fetch("/api/resolve/breakdown", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawVent: rawVent.trim(),
          followUpAnswer: followUpAnswer.trim() || null,
          feelings, bodySensations, needs,
          personName: reflect?.personName ?? null,
          myStory: myStory.trim() || null,
          selectedPathway: selectedPathway ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      const data: BreakdownResult = await res.json();
      setBreakdown(data);
      setPhase("breakdown");
      scrollTop();
    } catch {
      setError("the fire flickered — try again?");
      setPhase("pathways");
    }
  };

  // Save
  const handleSave = async () => {
    if (!breakdown) return;
    await fetch("/api/resolve/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personName: reflect?.personName ?? null,
        personId: null,
        rawVent: rawVent.trim(),
        feelings, bodySensations, needs,
        conflictType: breakdown.conflictType,
        nvcObservation: breakdown.observation,
        nvcFeeling: breakdown.feeling,
        nvcNeed: breakdown.need,
        nvcRequest: breakdown.request,
        empathyMap: breakdown.empathyMap,
        draftMessage: breakdown.draftMessage,
      }),
    });
    setSaved(true);
    setPhase("done");
    scrollTop();
  };

  const handleReset = () => {
    setPhase("vent"); setRawVent(""); setReflect(null);
    setFollowUpAnswer(""); setFeelings([]); setBodySensations([]);
    setNeeds([]); setPathways([]); setSelectedPathway(null); setMyStory("");
    setBreakdown(null); setExpandedAction(null); setSaved(false); setError(null);
    scrollTop();
  };

  const personName = reflect?.personName ?? null;

  const sectionLabel = (text: string, count?: number) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
      <h3 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: 0 }}>
        {text}
      </h3>
      {count !== undefined && (
        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>
          {count} selected
        </span>
      )}
    </div>
  );

  const upperLabel = (text: string, color = "var(--text-faint)") => (
    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 400, color, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
      {text}
    </div>
  );

  return (
    <PasswordGate>
      <main style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", backgroundColor: "var(--bg)" }}>
        <div ref={scrollRef} style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "60px" }}>

          {/* Back */}
          <div style={{ padding: "20px 20px 0" }}>
            <Link href="/" style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-soft)", textDecoration: "none" }}>
              ← back to the fire
            </Link>
          </div>

          {/* ── PHASE 1: VENT ── */}
          {phase === "vent" && (
            <div className="animate-fade-in" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                  <Sprite src="/sprites/listening-removebg-preview.png" size={60} />
                </div>
                <h1 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "24px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.3 }}>
                  what&apos;s going on?
                </h1>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0, lineHeight: 1.5 }}>
                  just vent. don&apos;t filter. i&apos;ll help you find the clarity underneath.
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "#B07070", margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              <textarea
                autoFocus
                value={rawVent}
                onChange={(e) => setRawVent(e.target.value)}
                placeholder="I'm frustrated because..."
                style={{
                  width: "100%", minHeight: "160px", padding: "18px",
                  backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                  borderRadius: "16px", color: "var(--text)",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "15px", fontWeight: 300, lineHeight: 1.65,
                  resize: "none", outline: "none", boxSizing: "border-box",
                }}
              />

              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontStyle: "italic", fontWeight: 300, color: "var(--text-faint)", textAlign: "center", margin: "10px 0 20px" }}>
                names, feelings, what happened — put it all here
              </p>

              <button
                onClick={handleVentSubmit}
                disabled={!rawVent.trim()}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: "14px",
                  backgroundColor: rawVent.trim() ? "var(--ember)" : "var(--surface)",
                  border: "none", cursor: rawVent.trim() ? "pointer" : "not-allowed",
                  color: rawVent.trim() ? "white" : "var(--text-faint)",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "14px", fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
              >
                help me understand this
              </button>
            </div>
          )}

          {/* ── PHASE 2: REFLECTING ── */}
          {phase === "reflecting" && (
            <div className="animate-fade-in" style={{ padding: "60px 20px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <Sprite src="/sprites/thinking-removebg-preview.png" size={60} />
              </div>
              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px" }}>
                sitting with what you shared...
              </h2>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                finding the feelings, needs, and clarity
              </p>
              <LoadingDots />
            </div>
          )}

          {/* ── PHASE 3: REFLECTION + FOLLOW-UP ── */}
          {phase === "reflection" && reflect && (
            <div className="animate-fade-in" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <Sprite src="/sprites/listening-removebg-preview.png" size={52} />
                </div>
              </div>

              <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", padding: "14px 16px", marginBottom: "20px" }}>
                {upperLabel("I hear you saying")}
                <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontStyle: "italic", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>
                  {reflect.reflection}
                </p>
              </div>

              {reflect.followUp ? (
                <div>
                  <div style={{ backgroundColor: "rgba(240,192,96,0.08)", borderLeft: "2px solid rgba(240,192,96,0.22)", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px" }}>
                    <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.55, margin: 0 }}>
                      🔥 {reflect.followUp}
                    </p>
                  </div>
                  <textarea
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="add anything that feels important..."
                    autoFocus
                    style={{
                      width: "100%", minHeight: "80px", padding: "14px",
                      backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                      borderRadius: "12px", color: "var(--text)",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "14px", fontWeight: 300, lineHeight: 1.55,
                      resize: "none", outline: "none", boxSizing: "border-box",
                      marginBottom: "16px",
                    }}
                  />
                  <button
                    onClick={handleReflectionNext}
                    disabled={!followUpAnswer.trim()}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: "14px",
                      backgroundColor: followUpAnswer.trim() ? "var(--ember)" : "var(--surface)",
                      border: "none", cursor: followUpAnswer.trim() ? "pointer" : "not-allowed",
                      color: followUpAnswer.trim() ? "white" : "var(--text-faint)",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "14px", fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                  >
                    continue →
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleReflectionNext}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: "14px",
                    backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
                    color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "14px", fontWeight: 500,
                  }}
                >
                  that&apos;s clear — let&apos;s name what you&apos;re feeling →
                </button>
              )}
            </div>
          )}

          {/* ── PHASE 4: PICKER ── */}
          {phase === "picker" && reflect && (
            <div className="animate-fade-in" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                  <Sprite src="/sprites/thinking-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "21px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>
                  let&apos;s name it together
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  i&apos;ve highlighted what i think — adjust what doesn&apos;t fit
                </p>
              </div>

              <div style={{ backgroundColor: "var(--surface)", borderRadius: "12px", padding: "11px 14px", marginBottom: "24px" }}>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  about:{" "}
                  {personName ? <strong style={{ fontWeight: 500, color: "var(--text)" }}>{personName}</strong> : null}
                  {personName ? " — " : ""}{reflect.reflection.slice(0, 80)}{reflect.reflection.length > 80 ? "…" : ""}
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "#B07070", margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                {sectionLabel("what are you feeling?", feelings.length)}
                {FEELING_FAMILIES.map((fam) => (
                  <div key={fam.key} style={{ marginBottom: "14px" }}>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: fam.color, opacity: 0.7, marginBottom: "7px" }}>
                      {fam.label}
                    </div>
                    <PillGroup
                      items={fam.items} selected={feelings}
                      onToggle={(v) => toggle(feelings, setFeelings, v)}
                      color={fam.color} soft={fam.soft} border={fam.border}
                    />
                  </div>
                ))}
              </div>

              <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "0 0 24px" }} />

              <div style={{ marginBottom: "24px" }}>
                {sectionLabel("where do you feel it in your body?", bodySensations.length)}
                <PillGroup
                  items={BODY_SENSATIONS} selected={bodySensations}
                  onToggle={(v) => toggle(bodySensations, setBodySensations, v)}
                  color="#C49860" soft="rgba(240,192,96,0.08)" border="rgba(240,192,96,0.44)"
                />
              </div>

              <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "0 0 24px" }} />

              <div style={{ marginBottom: "24px" }}>
                {sectionLabel("what do you need?", needs.length)}
                {NEED_FAMILIES.map((fam) => (
                  <div key={fam.key} style={{ marginBottom: "14px" }}>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: fam.color, opacity: 0.7, marginBottom: "7px" }}>
                      {fam.label}
                    </div>
                    <PillGroup
                      items={fam.items} selected={needs}
                      onToggle={(v) => toggle(needs, setNeeds, v)}
                      color={fam.color} soft={fam.soft} border={fam.border}
                    />
                  </div>
                ))}
              </div>

              <div style={{ height: "80px" }} />

              {feelings.length > 0 && needs.length > 0 && (
                <div style={{ position: "sticky", bottom: "16px" }}>
                  <button
                    onClick={handlePickerSubmit}
                    style={{
                      width: "100%", padding: "14px 0", borderRadius: "14px",
                      backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
                      color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "14px", fontWeight: 500,
                      boxShadow: "0 4px 20px rgba(224,120,64,0.3)",
                    }}
                  >
                    explore what&apos;s going on for them →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PHASE 5a: PATHWAYS LOADING ── */}
          {phase === "pathways_loading" && (
            <div className="animate-fade-in" style={{ padding: "60px 20px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <Sprite src="/sprites/thinking-removebg-preview.png" size={60} />
              </div>
              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px" }}>
                imagining their world...
              </h2>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                what might be going on for {personName ?? "them"}?
              </p>
              <LoadingDots />
            </div>
          )}

          {/* ── PHASE 5b: PATHWAYS ── */}
          {phase === "pathways" && (
            <div className="animate-fade-in" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                  <Sprite src="/sprites/listening-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "20px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px", lineHeight: 1.3 }}>
                  what might be going on for {personName ?? "them"}?
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0, lineHeight: 1.5 }}>
                  these are possibilities, not answers — tap one if it resonates
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "#B07070", margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Pathway cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                {pathways.map((p, i) => {
                  const isSelected = selectedPathway === p.story;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedPathway(isSelected ? null : p.story)}
                      style={{
                        textAlign: "left", padding: "16px", borderRadius: "14px", cursor: "pointer",
                        backgroundColor: isSelected ? "rgba(122,173,122,0.10)" : "var(--surface)",
                        border: `1.5px solid ${isSelected ? "rgba(122,173,122,0.44)" : "var(--border)"}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 500, color: isSelected ? "var(--sage)" : "var(--text-quiet)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "6px" }}>
                        {p.title}
                        {isSelected && " ✓"}
                      </div>
                      <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14.5px", fontWeight: 300, fontStyle: "italic", color: "var(--text)", lineHeight: 1.6, margin: "0 0 8px" }}>
                        {p.story}
                      </p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11.5px", fontWeight: 300, color: "var(--text-quiet)", backgroundColor: "var(--bg)", borderRadius: "20px", padding: "3px 10px", border: "1px solid var(--border-light)" }}>
                          feeling: {p.theirFeeling}
                        </span>
                        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11.5px", fontWeight: 300, color: "var(--text-quiet)", backgroundColor: "var(--bg)", borderRadius: "20px", padding: "3px 10px", border: "1px solid var(--border-light)" }}>
                          needing: {p.theirNeed}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Story in your head */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "16px", fontWeight: 300, color: "var(--text)", marginBottom: "8px", lineHeight: 1.4 }}>
                  what&apos;s the story in your head?
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  in one line — what do you think is really going on? (e.g. &ldquo;he doesn&apos;t respect my time&rdquo;)
                </p>
                <textarea
                  value={myStory}
                  onChange={(e) => setMyStory(e.target.value)}
                  placeholder="the story in my head is..."
                  rows={2}
                  style={{
                    width: "100%", padding: "14px",
                    backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                    borderRadius: "12px", color: "var(--text)",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "14px", fontWeight: 300, lineHeight: 1.55,
                    resize: "none", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={handlePathwaysSubmit}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: "14px",
                  backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
                  color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "14px", fontWeight: 500,
                  boxShadow: "0 4px 20px rgba(224,120,64,0.3)",
                }}
              >
                show me the clarity →
              </button>
            </div>
          )}

          {/* ── PHASE 6a: BREAKDOWN LOADING ── */}
          {phase === "breakdown_loading" && (
            <div className="animate-fade-in" style={{ padding: "60px 20px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <Sprite src="/sprites/thinking-removebg-preview.png" size={60} />
              </div>
              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px" }}>
                reflecting deeper...
              </h2>
              <LoadingDots />
            </div>
          )}

          {/* ── PHASE 6b: FULL BREAKDOWN ── */}
          {phase === "breakdown" && breakdown && (
            <div className="animate-fade-in" style={{ padding: "28px 20px 0" }}>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                  <Sprite src="/sprites/happy-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>
                  here&apos;s what i see
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  your feelings are valid. let&apos;s give them structure.
                </p>
              </div>

              {/* NVC Breakdown card */}
              <div style={{ marginBottom: "20px" }}>
                {upperLabel("your NVC breakdown")}
                <div style={{ borderRadius: "12px", overflow: "hidden" }}>
                  <NvcRow emoji="🔍" label="when" text={breakdown.observation}
                    bg="var(--surface)" borderColor="rgba(166,158,144,0.33)"
                    topRadius bottomRadius={false} />
                  <NvcRow emoji="💛" label="I felt" text={breakdown.feeling}
                    bg="rgba(240,192,96,0.08)" borderColor="rgba(240,192,96,0.33)" />
                  <NvcRow emoji="🌱" label="because I need" text={breakdown.need}
                    bg="var(--sage-soft, rgba(122,173,122,0.08))" borderColor="rgba(122,173,122,0.33)" />
                  <NvcRow emoji="🤝" label="would you be willing to" text={breakdown.request}
                    bg="var(--ember-soft)" borderColor="rgba(224,120,64,0.33)"
                    topRadius={false} bottomRadius />
                </div>
              </div>

              {/* Empathy map */}
              <div style={{ backgroundColor: "rgba(139,126,166,0.10)", borderLeft: "2px solid rgba(139,126,166,0.33)", borderRadius: "14px", padding: "16px 18px", marginBottom: "24px" }}>
                {upperLabel(`what ${personName ?? "they"} might be experiencing`, "#8B7EA6")}
                <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14.5px", fontWeight: 300, fontStyle: "italic", color: "var(--text-soft)", lineHeight: 1.65, margin: 0 }}>
                  {breakdown.empathyMap}
                </p>
              </div>

              {/* Action cards */}
              <div style={{ marginBottom: "8px" }}>
                {upperLabel("what do you want to do?")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>

                {/* Card 1: Juan's check-in */}
                <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setExpandedAction(expandedAction === "checkin" ? null : "checkin")}
                    style={{
                      width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer",
                      background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                        send a check-in
                      </div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                        a gentle opener — share your experience &amp; invite theirs
                      </div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "16px", marginLeft: "12px" }}>{expandedAction === "checkin" ? "↑" : "↓"}</span>
                  </button>
                  {expandedAction === "checkin" && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border-light)" }}>
                      <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.65, margin: "14px 0 12px" }}>
                        {breakdown.checkInMessage}
                      </p>
                      <CopyButton text={breakdown.checkInMessage} />
                    </div>
                  )}
                </div>

                {/* Card 2: Draft message */}
                <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setExpandedAction(expandedAction === "draft" ? null : "draft")}
                    style={{
                      width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer",
                      background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                        send the full message
                      </div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                        a complete NVC message with observation, feelings &amp; request
                      </div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "16px", marginLeft: "12px" }}>{expandedAction === "draft" ? "↑" : "↓"}</span>
                  </button>
                  {expandedAction === "draft" && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border-light)" }}>
                      <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.65, margin: "14px 0 12px" }}>
                        {breakdown.draftMessage}
                      </p>
                      <CopyButton text={breakdown.draftMessage} />
                    </div>
                  )}
                </div>

                {/* Card 3: Freeze message */}
                <Link href="/freeze" style={{ textDecoration: "none" }}>
                  <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", padding: "16px 18px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                        not ready to reach out
                      </div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                        frozen? need space first? get help with that
                      </div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "16px", marginLeft: "12px" }}>→</span>
                  </div>
                </Link>

                {/* Card 4: Just save it */}
                <button
                  onClick={handleSave}
                  style={{
                    width: "100%", backgroundColor: "var(--surface)", borderRadius: "14px",
                    padding: "16px 18px", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                      just save it
                    </div>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                      {personName ? `add to ${personName}'s story` : "save this resolution"} — no action needed right now
                    </div>
                  </div>
                  <span style={{ color: "var(--text-faint)", fontSize: "16px", marginLeft: "12px" }}>↓</span>
                </button>

              </div>
            </div>
          )}

          {/* ── PHASE 7: DONE ── */}
          {phase === "done" && (
            <div className="animate-fade-in" style={{ padding: "60px 20px 0", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "20px" }}>
                <span className="animate-float" style={{ display: "inline-block" }}>🔥</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px" }}>
                you showed up for yourself
              </h2>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 32px", lineHeight: 1.5 }}>
                {saved ? `saved to ${personName ? `${personName}'s story` : "your resolutions"}.` : "that takes courage."}{" "}the clarity is yours now.
              </p>
              <button
                onClick={handleReset}
                style={{ background: "none", border: "1px solid var(--border-light)", borderRadius: "20px", padding: "8px 22px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", cursor: "pointer" }}
              >
                start over
              </button>
            </div>
          )}

        </div>
      </main>
    </PasswordGate>
  );
}
