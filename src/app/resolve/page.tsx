"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase =
  | "vent"
  | "reflecting"
  | "reflection"
  | "picker"
  | "acknowledgment"
  | "disturbance"
  | "pathways_loading"
  | "pathways"
  | "breakdown_loading"
  | "breakdown"
  | "closing_breathe"
  | "done";

type Intent = "process" | "talk" | "understand";
type ResponsePattern = "quiet" | "please" | "react" | "avoid";
type BreathPatternKey = "5-5" | "4-4-4-4" | "4-7-8";

interface ReflectResult {
  reflection: string;
  acknowledgment: string;
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
  freezeMessage: string;
  conflictType: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEELING_FAMILIES = [
  { key: "anger", label: "anger", color: "#B07070", soft: "rgba(176,112,112,0.10)", border: "rgba(176,112,112,0.44)", items: ["frustrated", "resentful", "irritated", "angry", "annoyed", "bitter"] },
  { key: "sadness", label: "sadness", color: "#7A8BA6", soft: "rgba(122,139,166,0.10)", border: "rgba(122,139,166,0.44)", items: ["hurt", "disappointed", "lonely", "sad", "neglected", "unappreciated"] },
  { key: "fear", label: "fear", color: "#C49860", soft: "rgba(240,192,96,0.08)", border: "rgba(240,192,96,0.44)", items: ["anxious", "insecure", "overwhelmed", "vulnerable", "worried", "scared"] },
  { key: "fatigue", label: "fatigue", color: "var(--text-soft)", soft: "rgba(166,158,144,0.08)", border: "rgba(166,158,144,0.44)", items: ["exhausted", "drained", "burnt out", "numb", "depleted", "heavy"] },
  { key: "confusion", label: "confusion", color: "#8B7EA6", soft: "rgba(139,126,166,0.10)", border: "rgba(139,126,166,0.44)", items: ["confused", "torn", "lost", "unsure", "conflicted", "stuck"] },
  { key: "shame", label: "shame", color: "#A67A7A", soft: "rgba(166,122,122,0.08)", border: "rgba(166,122,122,0.44)", items: ["embarrassed", "guilty", "ashamed", "unworthy", "inadequate", "exposed"] },
];

const BODY_SENSATIONS = [
  "tight chest", "racing heart", "shallow breathing", "clenched jaw", "knot in stomach",
  "lump in throat", "tension in shoulders", "heaviness", "heat in face", "cold hands",
  "restless legs", "headache", "shaky", "teary eyes", "nausea",
];

const NEED_FAMILIES = [
  { key: "connection", label: "connection", color: "var(--ember)", soft: "var(--ember-soft)", border: "rgba(224,120,64,0.44)", items: ["belonging", "closeness", "trust", "understanding", "empathy", "acceptance"] },
  { key: "autonomy", label: "autonomy", color: "var(--sage)", soft: "var(--sage-soft)", border: "rgba(122,173,122,0.44)", items: ["freedom", "independence", "space", "choice", "self-expression", "privacy"] },
  { key: "respect", label: "respect", color: "#C49860", soft: "rgba(240,192,96,0.08)", border: "rgba(240,192,96,0.44)", items: ["acknowledgment", "appreciation", "recognition", "being seen", "being heard", "equality"] },
  { key: "reliability", label: "reliability", color: "#6B9EB0", soft: "rgba(107,158,176,0.10)", border: "rgba(107,158,176,0.44)", items: ["consistency", "follow-through", "reciprocity", "accountability", "honesty", "dependability"] },
  { key: "safety", label: "safety", color: "#8B7EA6", soft: "rgba(139,126,166,0.10)", border: "rgba(139,126,166,0.44)", items: ["security", "stability", "predictability", "protection", "comfort", "peace"] },
  { key: "meaning", label: "meaning", color: "#B09A6B", soft: "rgba(176,154,107,0.08)", border: "rgba(176,154,107,0.44)", items: ["purpose", "growth", "contribution", "creativity", "integrity", "authenticity"] },
];

const BREATH_PATTERNS: Record<BreathPatternKey, { inhale: number; hold1: number; exhale: number; hold2: number; label: string }> = {
  "5-5": { inhale: 5000, hold1: 0, exhale: 5000, hold2: 0, label: "5 · 5" },
  "4-4-4-4": { inhale: 4000, hold1: 4000, exhale: 4000, hold2: 4000, label: "4 · 4 · 4 · 4" },
  "4-7-8": { inhale: 4000, hold1: 7000, exhale: 8000, hold2: 0, label: "4 · 7 · 8" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Sprite({ src, size = 60, style }: { src: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      <div style={{ position: "absolute", inset: "-30px", background: "radial-gradient(ellipse at center, rgba(224,120,64,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div className="animate-float">
        <Image src={src} alt="" width={319} height={782} style={{ height: `${size}px`, width: "auto" }} priority />
      </div>
    </div>
  );
}

function PillGroup({ items, selected, onToggle, color, soft, border }: {
  items: string[]; selected: string[]; onToggle: (v: string) => void;
  color: string; soft: string; border: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
      {items.map((item) => {
        const on = selected.includes(item);
        return (
          <button key={item} onClick={() => onToggle(item)} style={{
            padding: "7px 14px", borderRadius: "22px", cursor: "pointer",
            backgroundColor: on ? soft : "var(--surface)",
            border: `1px solid ${on ? border : "var(--border)"}`,
            color: on ? color : "var(--text-quiet)",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12.5px", fontWeight: on ? 500 : 300,
            transition: "all 0.15s ease",
          }}>
            {item}
          </button>
        );
      })}
    </div>
  );
}

function CopyButton({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? "var(--ember)" : "none",
      border: `1px solid ${copied ? "var(--ember)" : "var(--border-light)"}`,
      borderRadius: "8px", padding: "6px 14px",
      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
      fontSize: "12px", color: copied ? "white" : "var(--text-quiet)",
      cursor: "pointer", transition: "all 0.15s",
    }}>
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

function LoadingDots() {
  return (
    <>
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "24px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ember)", animation: `rl-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </>
  );
}

function FeedbackCheckpoint({ onConfirm, onRetry, loading = false }: {
  onConfirm: () => void;
  onRetry: (feedback: string) => void;
  loading?: boolean;
}) {
  const [mode, setMode] = useState<"default" | "retry">("default");
  const [feedback, setFeedback] = useState("");

  if (mode === "retry") {
    return (
      <div style={{ marginTop: "12px" }}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="what's off? i'll try again..."
          autoFocus
          rows={2}
          style={{
            width: "100%", padding: "12px", borderRadius: "10px",
            backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
            color: "var(--text)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "13px", fontWeight: 300, lineHeight: 1.5,
            resize: "none", outline: "none", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button onClick={() => { setMode("default"); setFeedback(""); }} style={{
            padding: "7px 14px", borderRadius: "10px", cursor: "pointer",
            background: "none", border: "1px solid var(--border-light)",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12px", color: "var(--text-quiet)",
          }}>
            never mind
          </button>
          <button
            onClick={() => { if (feedback.trim()) { onRetry(feedback.trim()); setMode("default"); setFeedback(""); } }}
            disabled={!feedback.trim()}
            style={{
              padding: "7px 16px", borderRadius: "10px", cursor: feedback.trim() ? "pointer" : "not-allowed",
              background: feedback.trim() ? "var(--sage-soft)" : "var(--surface)",
              border: `1px solid ${feedback.trim() ? "rgba(122,173,122,0.44)" : "var(--border)"}`,
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "12px", color: feedback.trim() ? "var(--sage)" : "var(--text-faint)",
            }}
          >
            try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px" }}>
      <button onClick={() => setMode("retry")} style={{
        padding: "7px 14px", borderRadius: "10px", cursor: "pointer",
        background: "none", border: "1px solid var(--border-light)",
        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
        fontSize: "12px", color: "var(--text-quiet)",
      }}>
        not quite
      </button>
      <button onClick={onConfirm} disabled={loading} style={{
        padding: "7px 16px", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
        background: "var(--sage-soft)", border: "1px solid rgba(122,173,122,0.44)",
        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
        fontSize: "12px", color: "var(--sage)", fontWeight: 500,
        opacity: loading ? 0.5 : 1,
      }}>
        that&apos;s right
      </button>
    </div>
  );
}

function EditableText({ value, onChange, textStyle }: {
  value: string;
  onChange: (val: string) => void;
  textStyle?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            backgroundColor: "var(--bg)", border: "1px solid var(--border-light)",
            color: "var(--text)", fontFamily: "var(--font-newsreader), Georgia, serif",
            fontSize: "14.5px", fontWeight: 300, fontStyle: "italic", lineHeight: 1.6,
            resize: "vertical", outline: "none", boxSizing: "border-box", minHeight: "80px",
          }}
        />
        <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
          <button onClick={() => { onChange(draft); setEditing(false); }} style={{
            padding: "5px 12px", borderRadius: "8px", cursor: "pointer",
            background: "var(--sage-soft)", border: "1px solid rgba(122,173,122,0.44)",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "11px", color: "var(--sage)",
          }}>save</button>
          <button onClick={() => { setDraft(value); setEditing(false); }} style={{
            padding: "5px 12px", borderRadius: "8px", cursor: "pointer",
            background: "none", border: "1px solid var(--border-light)",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "11px", color: "var(--text-quiet)",
          }}>cancel</button>
        </div>
      </div>
    );
  }

  return (
    <p
      onClick={() => { setDraft(value); setEditing(true); }}
      title="tap to edit"
      style={{ cursor: "text", margin: 0, ...textStyle }}
    >
      {value}
    </p>
  );
}

// ─── Acknowledgment helpers ──────────────────────────────────────────────────

const BODY_SENSATION_PHRASES: Record<string, string> = {
  "tight chest": "a tightness in your chest",
  "racing heart": "a racing heart",
  "shallow breathing": "shallow breathing",
  "clenched jaw": "a clenched jaw",
  "knot in stomach": "a knot in your stomach",
  "lump in throat": "a lump in your throat",
  "tension in shoulders": "tension in your shoulders",
  "heaviness": "a heaviness",
  "heat in face": "heat in your face",
  "cold hands": "cold hands",
  "restless legs": "restless legs",
  "headache": "a headache",
  "shaky": "shakiness",
  "teary eyes": "teary eyes",
  "nausea": "nausea",
};

function buildAckMessage(f: string[], b: string[]): string {
  const bFormatted = b.map((s) => BODY_SENSATION_PHRASES[s] ?? s);
  const allParts = [...f, ...bFormatted];
  if (allParts.length === 0) return "that's a lot to carry. i'm glad you named it.";
  return allParts.join(". ") + ". that's a lot to carry. i'm glad you named it.";
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ResolvePage() {
  // ── Phase ──
  const [phase, setPhase] = useState<Phase>("vent");

  // ── Phase 1: Vent ──
  const [rawVent, setRawVent] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [ventPersonName, setVentPersonName] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [responsePattern, setResponsePattern] = useState<ResponsePattern | null>(null);

  // ── Phase 3: Reflection ──
  const [reflect, setReflect] = useState<ReflectResult | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  // ── Phase 5: Acknowledgment ──
  const [showAckButtons, setShowAckButtons] = useState(false);
  const [ackBreathing, setAckBreathing] = useState(false);

  // ── Breathing (shared between acknowledgment and closing_breathe) ──
  const [breathPatternKey, setBreathPatternKey] = useState<BreathPatternKey>("5-5");
  const [breathT, setBreathT] = useState(0);

  // ── Phase 6: Picker ──
  const [feelings, setFeelings] = useState<string[]>([]);
  const [bodySensations, setBodySensations] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);

  // ── Phase 7: Disturbance (pathways loads in background) ──
  const [disturbance, setDisturbance] = useState(50);
  const [pathwaysReady, setPathwaysReady] = useState<Pathway[] | null>(null);
  const [pathwaysFetchError, setPathwaysFetchError] = useState(false);

  // ── Phase 8: Pathways ──
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [myStory, setMyStory] = useState("");

  // ── Phase 9: Breakdown ──
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [bObs, setBObs] = useState("");
  const [bFeel, setBFeel] = useState("");
  const [bNeed, setBNeed] = useState("");
  const [bReq, setBReq] = useState("");
  const [bEmpathy, setBEmpathy] = useState("");
  const [bCheckin, setBCheckin] = useState("");
  const [bDraft, setBDraft] = useState("");
  const [bFreeze, setBFreeze] = useState("");
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // ── Global ──
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTop = useCallback(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), []);

  // ── Acknowledgment 3-second delay ──
  useEffect(() => {
    if (phase !== "acknowledgment") { setShowAckButtons(false); return; }
    const t = setTimeout(() => setShowAckButtons(true), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Breathing interval (acknowledgment inline + closing_breathe) ──
  useEffect(() => {
    const active = (phase === "acknowledgment" && ackBreathing) || phase === "closing_breathe";
    if (!active) { setBreathT(0); return; }
    const t = setInterval(() => setBreathT((prev) => prev + 50), 50);
    return () => clearInterval(t);
  }, [phase, ackBreathing]);

  // ── Auto-advance from pathways_loading when ready ──
  useEffect(() => {
    if (phase === "pathways_loading" && pathwaysReady !== null) {
      setPathways(pathwaysReady);
      setPhase("pathways");
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (phase === "pathways_loading" && pathwaysFetchError) {
      setError("the fire flickered — try again?");
      setPhase("disturbance");
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [phase, pathwaysReady, pathwaysFetchError]);

  // ── Sync breakdown fields when breakdown changes ──
  useEffect(() => {
    if (!breakdown) return;
    setBObs(breakdown.observation);
    setBFeel(breakdown.feeling);
    setBNeed(breakdown.need);
    setBReq(breakdown.request);
    setBEmpathy(breakdown.empathyMap);
    setBCheckin(breakdown.checkInMessage);
    setBDraft(breakdown.draftMessage);
    setBFreeze(breakdown.freezeMessage);
  }, [breakdown]);

  // ── Computed breath state ──
  const bPattern = BREATH_PATTERNS[breathPatternKey];
  const bCycleLen = bPattern.inhale + bPattern.hold1 + bPattern.exhale + bPattern.hold2;
  const bCycles = Math.floor(breathT / bCycleLen);
  const bWithin = breathT % bCycleLen;
  let breathScale = 1, breathOpacity = 1, breathLabel = "breathe in...", breathLabelColor = "#F0C060";
  if (bWithin < bPattern.inhale) {
    const p = bWithin / bPattern.inhale;
    breathScale = 0.85 + p * 0.2; breathOpacity = 0.85 + p * 0.15;
    breathLabel = "breathe in..."; breathLabelColor = "#F0C060";
  } else if (bWithin < bPattern.inhale + bPattern.hold1) {
    breathScale = 1.05; breathOpacity = 1;
    breathLabel = "hold..."; breathLabelColor = "var(--text-quiet)";
  } else if (bWithin < bPattern.inhale + bPattern.hold1 + bPattern.exhale) {
    const p = (bWithin - bPattern.inhale - bPattern.hold1) / bPattern.exhale;
    breathScale = 1.05 - p * 0.2; breathOpacity = 1 - p * 0.15;
    breathLabel = "breathe out..."; breathLabelColor = "var(--text-soft)";
  } else {
    breathScale = 0.85; breathOpacity = 0.85;
    breathLabel = bPattern.hold2 > 0 ? "hold..." : "breathe in..."; breathLabelColor = "var(--text-quiet)";
  }
  const breathGuidance = bCycles < 3 ? "just follow the fire" : bCycles < 6 ? "you're doing good" : "stay as long as you need";
  const breathReadyCycles = phase === "closing_breathe" ? 2 : 3;
  const showBreathReady = bCycles >= breathReadyCycles;

  // ── Disturbance helpers ──
  function disturbanceLabel(d: number) {
    if (d < 15) return { text: "i'm okay", color: "var(--sage)" };
    if (d < 30) return { text: "a little off", color: "var(--sage)" };
    if (d < 50) return { text: "it's weighing on me", color: "#F0C060" };
    if (d < 70) return { text: "really shaken", color: "var(--ember)" };
    if (d < 85) return { text: "can barely think", color: "#E07878" };
    return { text: "completely overwhelmed", color: "#E07878" };
  }
  function disturbanceThumbColor(d: number) {
    if (d < 30) return "var(--sage)";
    if (d < 50) return "#F0C060";
    if (d < 70) return "var(--ember)";
    return "#E07878";
  }

  // ── Helpers ──
  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  const personName = reflect?.personName ?? (ventPersonName.trim() || null);

  const upperLabel = (text: string, color = "var(--text-faint)") => (
    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "10px" }}>
      {text}
    </div>
  );

  // ── Handlers ──

  const handleVentSubmit = async () => {
    if (!rawVent.trim()) return;
    setError(null);
    setPhase("reflecting");
    scrollTop();
    try {
      const res = await fetch("/api/resolve/reflect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawVent: rawVent.trim(),
          personName: ventPersonName.trim() || null,
          intent, responsePattern,
        }),
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

  const handleReflectionConfirm = () => {
    setPhase("picker");
    scrollTop();
  };

  const handleReflectionRetry = async (feedback: string) => {
    setError(null);
    setPhase("reflecting");
    scrollTop();
    try {
      const res = await fetch("/api/resolve/reflect-retry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawVent: rawVent.trim(),
          personName: ventPersonName.trim() || null,
          intent, responsePattern,
          previousReflection: reflect?.reflection,
          feedback,
        }),
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
      setPhase("reflection");
    }
  };

  const handlePickerSubmit = () => {
    if (feelings.length === 0 || needs.length === 0) return;
    setAckBreathing(false);
    setPhase("acknowledgment");
    scrollTop();
  };

  const handleAcknowledgmentContinue = () => {
    setAckBreathing(false);
    setBreathT(0);
    setPathwaysReady(null);
    setPathwaysFetchError(false);
    // Fire pathways fetch in background while user is on disturbance screen
    const fn = ventPersonName.trim() || reflect?.personName || null;
    fetch("/api/resolve/pathways", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawVent: rawVent.trim(), followUpAnswer: followUpAnswer.trim() || null, feelings, needs, personName: fn }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setPathwaysReady(data.pathways ?? []))
      .catch(() => setPathwaysFetchError(true));
    setPhase("disturbance");
    scrollTop();
  };

  const handleDisturbanceContinue = () => {
    scrollTop();
    if (pathwaysFetchError) {
      setError("the fire flickered — try again?");
      return;
    }
    if (pathwaysReady !== null) {
      setPathways(pathwaysReady);
      setPhase("pathways");
    } else {
      setPhase("pathways_loading");
    }
  };

  const handlePathwaysConfirm = () => {
    // proceed to breakdown
    handlePathwaysSubmit();
  };

  const handlePathwaysRetry = async (feedback: string) => {
    setError(null);
    setPhase("pathways_loading");
    scrollTop();
    try {
      const res = await fetch("/api/resolve/pathways-retry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawVent: rawVent.trim(),
          followUpAnswer: followUpAnswer.trim() || null,
          feelings, needs,
          personName: ventPersonName.trim() || reflect?.personName || null,
          previousPathways: pathways,
          feedback,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPathways(data.pathways ?? []);
      setPathwaysReady(data.pathways ?? []);
      setPhase("pathways");
      scrollTop();
    } catch {
      setError("the fire flickered — try again?");
      setPhase("pathways");
    }
  };

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
          myStory: myStory.trim() || null,
          selectedPathway: selectedPathway ?? null,
          personName: ventPersonName.trim() || reflect?.personName || null,
          disturbance,
          responsePattern,
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

  const handleNvcRetry = async (feedback: string) => {
    if (!breakdown) return;
    try {
      const res = await fetch("/api/resolve/breakdown-retry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "nvc", feedback,
          rawVent: rawVent.trim(), followUpAnswer: followUpAnswer.trim() || null,
          feelings, bodySensations, needs, myStory: myStory.trim() || null,
          selectedPathway, personName: personName ?? null, disturbance, responsePattern,
          previousContent: { observation: bObs, feeling: bFeel, need: bNeed, request: bReq, empathyMap: bEmpathy },
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.observation) setBObs(data.observation);
      if (data.feeling) setBFeel(data.feeling);
      if (data.need) setBNeed(data.need);
      if (data.request) setBReq(data.request);
      if (data.empathyMap) setBEmpathy(data.empathyMap);
    } catch { /* silent */ }
  };

  const handleMessageRetry = async (target: "checkin" | "draft" | "freeze", feedback: string) => {
    if (!breakdown) return;
    const prevMap = { checkin: bCheckin, draft: bDraft, freeze: bFreeze };
    try {
      const res = await fetch("/api/resolve/breakdown-retry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target, feedback,
          rawVent: rawVent.trim(), followUpAnswer: followUpAnswer.trim() || null,
          feelings, bodySensations, needs, myStory: myStory.trim() || null,
          selectedPathway, personName: personName ?? null, disturbance, responsePattern,
          previousContent: { [target === "checkin" ? "checkInMessage" : target === "draft" ? "draftMessage" : "freezeMessage"]: prevMap[target] },
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (target === "checkin" && data.checkInMessage) setBCheckin(data.checkInMessage);
      if (target === "draft" && data.draftMessage) setBDraft(data.draftMessage);
      if (target === "freeze" && data.freezeMessage) setBFreeze(data.freezeMessage);
    } catch { /* silent */ }
  };

  const handleSave = async (chosenAction: string) => {
    if (!breakdown) return;
    await fetch("/api/resolve/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personName: personName ?? null,
        personId: null,
        rawVent: rawVent.trim(),
        myStory: myStory.trim() || null,
        feelings, bodySensations, needs,
        disturbance, responsePattern,
        conflictType: breakdown.conflictType,
        nvcObservation: bObs, nvcFeeling: bFeel, nvcNeed: bNeed, nvcRequest: bReq,
        empathyMap: bEmpathy, draftMessage: bDraft, checkInMessage: bCheckin,
        chosenAction,
      }),
    });
    setSaved(true);
    setBreathT(0);
    setPhase("closing_breathe");
    scrollTop();
  };

  const handleReset = () => {
    setPhase("vent"); setRawVent(""); setContextOpen(false); setVentPersonName("");
    setIntent(null); setResponsePattern(null); setReflect(null); setFollowUpAnswer("");
    setShowAckButtons(false); setAckBreathing(false); setBreathT(0); setBreathPatternKey("5-5");
    setFeelings([]); setBodySensations([]); setNeeds([]);
    setDisturbance(50); setPathwaysReady(null); setPathwaysFetchError(false);
    setPathways([]); setSelectedPathway(null); setMyStory("");
    setBreakdown(null); setExpandedAction(null); setShowSavePrompt(false);
    setSaved(false); setError(null);
    scrollTop();
  };

  const dlabel = disturbanceLabel(disturbance);
  const thumbColor = disturbanceThumbColor(disturbance);
  const fillPct = disturbance;

  return (
    <PasswordGate>
      <style>{`
        @keyframes rl-pulse { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes rl-fadeup { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .rl-fade { animation: rl-fadeup 0.35s ease; }
        input[type=range].rl-slider { -webkit-appearance:none; appearance:none; height:5px; border-radius:3px; outline:none; cursor:pointer; }
        input[type=range].rl-slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:var(--rl-thumb); border:2px solid var(--bg); box-shadow:0 1px 4px rgba(0,0,0,0.15); cursor:pointer; }
        input[type=range].rl-slider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:var(--rl-thumb); border:2px solid var(--bg); box-shadow:0 1px 4px rgba(0,0,0,0.15); cursor:pointer; }
      `}</style>

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
            <div className="rl-fade" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <Sprite src="/sprites/listening-removebg-preview.png" size={56} />
                </div>
                <h1 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "22px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>
                  hey. i&apos;m here.
                </h1>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  tell me what&apos;s going on
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: "#B07070", margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              <textarea
                autoFocus
                value={rawVent}
                onChange={(e) => setRawVent(e.target.value)}
                placeholder="just let it out — who, what happened, how you feel..."
                style={{
                  width: "100%", minHeight: "150px", padding: "18px",
                  backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                  borderRadius: "16px", color: "var(--text)",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "15px", fontWeight: 300, lineHeight: 1.65,
                  resize: "none", outline: "none", boxSizing: "border-box",
                }}
              />

              {/* Optional context */}
              <div style={{ marginTop: "12px" }}>
                {!contextOpen ? (
                  <button
                    onClick={() => setContextOpen(true)}
                    style={{
                      width: "100%", padding: "10px 14px", textAlign: "left",
                      backgroundColor: "none", background: "none",
                      border: "1px dashed var(--border)", borderRadius: "12px", cursor: "pointer",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "12.5px", fontWeight: 300, color: "var(--text-faint)",
                    }}
                  >
                    + add context — helps me help you better (optional)
                  </button>
                ) : (
                  <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", fontWeight: 500, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.8px" }}>CONTEXT</span>
                      <button onClick={() => setContextOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-faint)" }}>hide</button>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", marginBottom: "6px" }}>who is this about?</div>
                      <input
                        type="text"
                        value={ventPersonName}
                        onChange={(e) => setVentPersonName(e.target.value)}
                        placeholder="their name (optional)"
                        style={{
                          width: "100%", padding: "9px 12px", borderRadius: "10px",
                          backgroundColor: "var(--bg)", border: "1px solid var(--border-light)",
                          color: "var(--text)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                          fontSize: "13px", fontWeight: 300, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", marginBottom: "8px" }}>what do you need most?</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {(["process", "talk", "understand"] as Intent[]).map((v) => {
                          const labels = { process: "process it", talk: "talk to them", understand: "understand them" };
                          const on = intent === v;
                          return (
                            <button key={v} onClick={() => setIntent(on ? null : v)} style={{
                              flex: 1, padding: "9px 6px", borderRadius: "10px", cursor: "pointer",
                              backgroundColor: on ? "var(--ember-soft)" : "var(--bg)",
                              border: `1px solid ${on ? "rgba(224,120,64,0.33)" : "var(--border)"}`,
                              color: on ? "var(--ember)" : "var(--text-quiet)",
                              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                              fontSize: "11.5px", fontWeight: on ? 500 : 300,
                            }}>
                              {labels[v]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", marginBottom: "8px" }}>when this happens, what do you usually do?</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        {(
                          [
                            { key: "quiet" as ResponsePattern, label: "go quiet", color: "#6B9EB0", soft: "rgba(107,158,176,0.10)", border: "rgba(107,158,176,0.33)" },
                            { key: "please" as ResponsePattern, label: "try to make it okay", color: "#8B7EA6", soft: "rgba(139,126,166,0.10)", border: "rgba(139,126,166,0.33)" },
                            { key: "react" as ResponsePattern, label: "react immediately", color: "var(--ember)", soft: "var(--ember-soft)", border: "rgba(224,120,64,0.33)" },
                            { key: "avoid" as ResponsePattern, label: "pull away", color: "#C49860", soft: "rgba(240,192,96,0.08)", border: "rgba(240,192,96,0.33)" },
                          ]
                        ).map(({ key, label, color, soft, border }) => {
                          const on = responsePattern === key;
                          return (
                            <button key={key} onClick={() => setResponsePattern(on ? null : key)} style={{
                              padding: "9px 10px", borderRadius: "12px", cursor: "pointer",
                              backgroundColor: on ? soft : "var(--bg)",
                              border: `1px solid ${on ? border : "var(--border)"}`,
                              color: on ? color : "var(--text-quiet)",
                              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                              fontSize: "12px", fontWeight: on ? 500 : 300, textAlign: "center",
                            }}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleVentSubmit}
                disabled={!rawVent.trim()}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: "14px", marginTop: "16px",
                  backgroundColor: rawVent.trim() ? "var(--ember)" : "var(--surface)",
                  border: "none", cursor: rawVent.trim() ? "pointer" : "not-allowed",
                  color: rawVent.trim() ? "white" : "var(--text-faint)",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "14px", fontWeight: 500, transition: "all 0.2s ease",
                }}
              >
                help me understand this
              </button>
            </div>
          )}

          {/* ── PHASE 2: REFLECTING ── */}
          {phase === "reflecting" && (
            <div className="rl-fade" style={{ padding: "60px 20px 0", textAlign: "center" }}>
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

          {/* ── PHASE 3: REFLECTION + FEEDBACK ── */}
          {phase === "reflection" && reflect && (
            <div className="rl-fade" style={{ padding: "28px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <Sprite src="/sprites/listening-removebg-preview.png" size={48} />
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: "#B07070", margin: 0 }}>{error}</p>
                </div>
              )}

              <div style={{ backgroundColor: "var(--surface)", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px" }}>
                {upperLabel("I hear you saying")}
                <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14.5px", fontStyle: "italic", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.65, margin: 0 }}>
                  {reflect.reflection}
                </p>
              </div>

              {reflect.followUp && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ backgroundColor: "rgba(240,192,96,0.08)", borderLeft: "2px solid rgba(240,192,96,0.22)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
                    <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.55, margin: 0 }}>
                      {reflect.followUp}
                    </p>
                  </div>
                  <textarea
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="add anything that feels important..."
                    rows={2}
                    style={{
                      width: "100%", padding: "12px",
                      backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                      borderRadius: "12px", color: "var(--text)",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "13.5px", fontWeight: 300, lineHeight: 1.55,
                      resize: "none", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              <FeedbackCheckpoint
                onConfirm={handleReflectionConfirm}
                onRetry={handleReflectionRetry}
              />
            </div>
          )}

          {/* ── PHASE 4: PICKER ── */}
          {phase === "picker" && reflect && (
            <div className="rl-fade" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <Sprite src="/sprites/thinking-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "19px", fontWeight: 300, color: "var(--text)", margin: "0 0 5px" }}>
                  let&apos;s name it together
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  i&apos;ve highlighted what i think — tap to adjust
                </p>
              </div>

              {/* Feelings */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                  <h3 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: 0 }}>what are you feeling?</h3>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>{feelings.length} selected</span>
                </div>
                {FEELING_FAMILIES.map((fam) => (
                  <div key={fam.key} style={{ marginBottom: "12px" }}>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px", color: fam.color, opacity: 0.6, marginBottom: "6px" }}>{fam.label}</div>
                    <PillGroup items={fam.items} selected={feelings} onToggle={(v) => toggle(feelings, setFeelings, v)} color={fam.color} soft={fam.soft} border={fam.border} />
                  </div>
                ))}
              </div>

              <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "0 0 24px" }} />

              {/* Body */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                  <h3 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: 0 }}>where do you feel it?</h3>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>{bodySensations.length} selected</span>
                </div>
                <PillGroup items={BODY_SENSATIONS} selected={bodySensations} onToggle={(v) => toggle(bodySensations, setBodySensations, v)} color="#C49860" soft="rgba(240,192,96,0.08)" border="rgba(240,192,96,0.44)" />
              </div>

              <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "0 0 24px" }} />

              {/* Needs */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                  <h3 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: 0 }}>what do you need?</h3>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>{needs.length} selected</span>
                </div>
                {NEED_FAMILIES.map((fam) => (
                  <div key={fam.key} style={{ marginBottom: "12px" }}>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px", color: fam.color, opacity: 0.6, marginBottom: "6px" }}>{fam.label}</div>
                    <PillGroup items={fam.items} selected={needs} onToggle={(v) => toggle(needs, setNeeds, v)} color={fam.color} soft={fam.soft} border={fam.border} />
                  </div>
                ))}
              </div>

              <div style={{ height: "80px" }} />

              {feelings.length > 0 && needs.length > 0 && (
                <div style={{ position: "sticky", bottom: "16px" }}>
                  <button onClick={handlePickerSubmit} style={{
                    width: "100%", padding: "14px 0", borderRadius: "14px",
                    backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
                    color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "14px", fontWeight: 500,
                    boxShadow: "0 4px 20px rgba(224,120,64,0.3)",
                  }}>
                    explore what might be happening →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PHASE 5: ACKNOWLEDGE + BREATHE ── */}
          {phase === "acknowledgment" && (
            <div className="rl-fade" style={{ padding: "48px 20px 0", textAlign: "center" }}>
              {!ackBreathing ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                    <Sprite src="/sprites/listening-removebg-preview.png" size={70} />
                  </div>
                  <p style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300,
                    fontStyle: "italic", color: "var(--text)", lineHeight: 1.75,
                    margin: "0 auto 48px", maxWidth: "320px",
                  }}>
                    {buildAckMessage(feelings, bodySensations)}
                  </p>
                  {showAckButtons && (
                    <div className="rl-fade" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 4px" }}>
                        want to breathe together before we go deeper?
                      </p>
                      <button onClick={() => setAckBreathing(true)} style={{
                        padding: "12px 28px", borderRadius: "22px", cursor: "pointer",
                        backgroundColor: "var(--ember)", border: "none",
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "13.5px", fontWeight: 500, color: "white",
                      }}>
                        breathe with me
                      </button>
                      <button onClick={handleAcknowledgmentContinue} style={{
                        padding: "12px 28px", borderRadius: "22px", cursor: "pointer",
                        background: "none", border: "1px solid var(--border-light)",
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "13.5px", fontWeight: 300, color: "var(--text-quiet)",
                      }}>
                        i&apos;m okay — let&apos;s keep going
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                    <div style={{ transition: "transform 0.1s linear, opacity 0.1s linear", transform: `scale(${breathScale})`, opacity: breathOpacity }}>
                      <Sprite src="/sprites/listening-removebg-preview.png" size={80} />
                    </div>
                  </div>
                  <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "20px", fontWeight: 300, color: breathLabelColor, margin: "0 0 8px", transition: "color 0.5s ease" }}>
                    {breathLabel}
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-faint)", margin: "0 0 32px" }}>
                    {breathGuidance}
                  </p>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "40px" }}>
                    {(["5-5", "4-4-4-4", "4-7-8"] as BreathPatternKey[]).map((k) => (
                      <button key={k} onClick={() => { setBreathPatternKey(k); setBreathT(0); }} style={{
                        padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
                        background: breathPatternKey === k ? "var(--surface)" : "none",
                        border: `1px solid ${breathPatternKey === k ? "var(--border-light)" : "transparent"}`,
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "11px", fontWeight: 300, color: breathPatternKey === k ? "var(--text-quiet)" : "var(--text-faint)",
                      }}>
                        {BREATH_PATTERNS[k].label}
                      </button>
                    ))}
                  </div>
                  {showBreathReady && (
                    <div className="rl-fade" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <button onClick={handleAcknowledgmentContinue} style={{
                        padding: "12px 28px", borderRadius: "22px", cursor: "pointer",
                        backgroundColor: "var(--ember)", border: "none",
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "13.5px", fontWeight: 500, color: "white",
                      }}>
                        i&apos;m ready to go deeper
                      </button>
                      <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-faint)", margin: 0 }}>
                        or keep breathing — no rush
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PHASE 6: DISTURBANCE ── */}
          {phase === "disturbance" && (
            <div className="rl-fade" style={{ padding: "40px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <Sprite src="/sprites/listening-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px", lineHeight: 1.4 }}>
                  now that you&apos;ve named it — how much is this shaking you?
                </h2>
              </div>

              {/* Slider */}
              <div style={{ padding: "0 4px", marginBottom: "28px" }}>
                <div style={{ position: "relative", height: "5px", borderRadius: "3px", backgroundColor: "rgba(166,158,144,0.15)", margin: "12px 0 8px" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${fillPct}%`, borderRadius: "3px",
                    background: "linear-gradient(to right, var(--sage) 0%, #F0C060 40%, var(--ember) 70%, #E07878 100%)",
                  }} />
                  <input
                    type="range" min={0} max={100} value={disturbance}
                    className="rl-slider"
                    onChange={(e) => setDisturbance(parseInt(e.target.value))}
                    style={{
                      position: "absolute", top: "50%", transform: "translateY(-50%)",
                      left: "-10px", width: "calc(100% + 20px)",
                      background: "transparent", margin: 0,
                      "--rl-thumb": thumbColor,
                    } as React.CSSProperties}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", color: "var(--text-faint)" }}>ripple</span>
                  <span style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "16px", fontWeight: 300, color: dlabel.color, transition: "color 0.3s ease" }}>
                    {dlabel.text}
                  </span>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", color: "var(--text-faint)" }}>earthquake</span>
                </div>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: "#B07070", margin: 0 }}>{error}</p>
                </div>
              )}

              <button onClick={handleDisturbanceContinue} style={{
                width: "100%", padding: "14px 0", borderRadius: "14px",
                backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
                color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "14px", fontWeight: 500,
              }}>
                continue →
              </button>
            </div>
          )}

          {/* ── PATHWAYS LOADING ── */}
          {phase === "pathways_loading" && (
            <div className="rl-fade" style={{ padding: "60px 20px 0", textAlign: "center" }}>
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

          {/* ── PHASE 8: PATHWAYS + YOUR STORY ── */}
          {phase === "pathways" && (
            <div className="rl-fade" style={{ padding: "28px 20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <Sprite src="/sprites/listening-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "20px", fontWeight: 300, color: "var(--text)", margin: "0 0 5px", lineHeight: 1.3 }}>
                  there&apos;s more than one story
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  notice which ones shift something
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(176,112,112,0.10)", border: "1px solid rgba(176,112,112,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: "#B07070", margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Pathway cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                {pathways.map((p, i) => {
                  const sel = selectedPathway === p.story;
                  return (
                    <button key={i} onClick={() => setSelectedPathway(sel ? null : p.story)} style={{
                      textAlign: "left", padding: "16px 18px", borderRadius: "14px", cursor: "pointer",
                      backgroundColor: "var(--surface)",
                      border: `1.5px solid ${sel ? "rgba(224,120,64,0.33)" : "var(--border)"}`,
                      transition: "all 0.15s ease",
                    }}>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 500, color: sel ? "var(--ember)" : "var(--text-quiet)", marginBottom: "6px" }}>
                        {p.title}{sel ? " ✓" : ""}
                      </div>
                      <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontWeight: 300, fontStyle: "italic", color: "var(--text-soft)", lineHeight: 1.6, margin: "0 0 8px" }}>
                        {p.story}
                      </p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", backgroundColor: "var(--bg)", borderRadius: "20px", padding: "2px 9px", border: "1px solid var(--border-light)" }}>
                          might feel: {p.theirFeeling}
                        </span>
                        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", backgroundColor: "var(--bg)", borderRadius: "20px", padding: "2px 9px", border: "1px solid var(--border-light)" }}>
                          might need: {p.theirNeed}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <FeedbackCheckpoint
                onConfirm={handlePathwaysConfirm}
                onRetry={handlePathwaysRetry}
              />

              <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "20px 0" }} />

              {/* Your story */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: "0 0 5px" }}>
                  what&apos;s the story in your head?
                </h3>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontStyle: "italic", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 10px" }}>
                  what are you telling yourself about why this happened?
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

              <button onClick={handlePathwaysSubmit} style={{
                width: "100%", padding: "14px 0", borderRadius: "14px",
                backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
                color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "14px", fontWeight: 500,
                boxShadow: "0 4px 20px rgba(224,120,64,0.3)",
              }}>
                show me the clarity →
              </button>
            </div>
          )}

          {/* ── BREAKDOWN LOADING ── */}
          {phase === "breakdown_loading" && (
            <div className="rl-fade" style={{ padding: "60px 20px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <Sprite src="/sprites/thinking-removebg-preview.png" size={60} />
              </div>
              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px" }}>
                reflecting deeper...
              </h2>
              <LoadingDots />
            </div>
          )}

          {/* ── PHASE 9: BREAKDOWN + ACTIONS ── */}
          {phase === "breakdown" && breakdown && (
            <div className="rl-fade" style={{ padding: "28px 20px 0" }}>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <Sprite src="/sprites/happy-removebg-preview.png" size={48} />
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: "0 0 5px" }}>
                  here&apos;s what i see
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  your feelings are valid. let&apos;s give them structure.
                </p>
              </div>

              {/* NVC Card */}
              <div style={{ marginBottom: "16px" }}>
                {upperLabel("your NVC breakdown")}
                <div style={{ borderRadius: "14px", overflow: "hidden" }}>
                  {(
                    [
                      { label: "WHEN", value: bObs, set: setBObs, bg: "var(--surface)", bc: "rgba(166,158,144,0.33)", top: true, bottom: false },
                      { label: "I FELT", value: bFeel, set: setBFeel, bg: "rgba(240,192,96,0.08)", bc: "rgba(240,192,96,0.33)", top: false, bottom: false },
                      { label: "BECAUSE I NEED", value: bNeed, set: setBNeed, bg: "var(--sage-soft, rgba(122,173,122,0.08))", bc: "rgba(122,173,122,0.33)", top: false, bottom: false },
                      { label: "WOULD YOU BE WILLING TO", value: bReq, set: setBReq, bg: "var(--ember-soft)", bc: "rgba(224,120,64,0.33)", top: false, bottom: true },
                    ] as Array<{ label: string; value: string; set: (v: string) => void; bg: string; bc: string; top: boolean; bottom: boolean }>
                  ).map((row) => (
                    <div key={row.label} style={{
                      backgroundColor: row.bg, borderLeft: `2px solid ${row.bc}`,
                      borderRadius: `${row.top ? "14px 14px" : "0 0"} ${row.bottom ? "14px 14px" : "0 0"}`,
                      padding: "14px 16px",
                      borderBottom: row.bottom ? "none" : "1px solid var(--border)",
                    }}>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: row.bc, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "5px" }}>
                        {row.label}
                      </div>
                      <EditableText
                        value={row.value}
                        onChange={row.set}
                        textStyle={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14.5px", fontWeight: 300, fontStyle: "italic", color: "var(--text)", lineHeight: 1.6, paddingLeft: "2px" }}
                      />
                    </div>
                  ))}
                </div>
                <FeedbackCheckpoint
                  onConfirm={() => { /* already confirmed, just a "looks good" */ }}
                  onRetry={handleNvcRetry}
                />
              </div>

              {/* Empathy map */}
              <div style={{ backgroundColor: "rgba(139,126,166,0.10)", borderLeft: "2px solid rgba(139,126,166,0.33)", borderRadius: "14px", padding: "16px 18px", marginBottom: "20px" }}>
                {upperLabel(`what ${personName ?? "they"} might be experiencing`, "#8B7EA6")}
                <EditableText
                  value={bEmpathy}
                  onChange={setBEmpathy}
                  textStyle={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14.5px", fontWeight: 300, fontStyle: "italic", color: "var(--text-soft)", lineHeight: 1.65 }}
                />
              </div>

              {/* Before / After */}
              <div style={{ marginBottom: "24px" }}>
                {upperLabel("what you said → NVC version")}
                <div style={{ borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ backgroundColor: "rgba(176,112,112,0.10)", borderLeft: "2px solid rgba(176,112,112,0.33)", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "#B07070", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "6px" }}>YOUR WORDS</div>
                    <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontWeight: 300, fontStyle: "italic", color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>{breakdown.beforeAfter.before}</p>
                  </div>
                  <div style={{ backgroundColor: "rgba(122,173,122,0.08)", borderLeft: "2px solid rgba(122,173,122,0.33)", padding: "14px 16px" }}>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "var(--sage)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "6px" }}>NVC VERSION</div>
                    <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontWeight: 300, fontStyle: "italic", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{breakdown.beforeAfter.after}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <h3 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "19px", fontWeight: 300, color: "var(--text)", margin: "0 0 14px" }}>
                what do you want to do?
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>

                {/* Check-in */}
                <div style={{ backgroundColor: "var(--gold-soft, rgba(240,192,96,0.08))", borderLeft: "2px solid rgba(240,192,96,0.22)", borderRadius: "14px", overflow: "hidden" }}>
                  <button onClick={() => setExpandedAction(expandedAction === "checkin" ? null : "checkin")} style={{
                    width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer",
                    background: "none", border: "none", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "#C49860", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "3px" }}>CHECK IN WITH THEM</div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontStyle: "italic", fontWeight: 300, color: "var(--text-quiet)" }}>share your experience, invite theirs</div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "14px", marginLeft: "12px", marginTop: "2px" }}>{expandedAction === "checkin" ? "↑" : "↓"}</span>
                  </button>
                  {expandedAction === "checkin" && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(240,192,96,0.15)" }}>
                      <div style={{ marginTop: "14px" }}>
                        <EditableText value={bCheckin} onChange={setBCheckin} textStyle={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.65 }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
                        <CopyButton text={bCheckin} onCopy={() => setShowSavePrompt(true)} />
                        <FeedbackCheckpoint
                          onConfirm={() => setShowSavePrompt(true)}
                          onRetry={(fb) => handleMessageRetry("checkin", fb)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Send a message */}
                <div style={{ backgroundColor: "var(--ember-soft)", borderLeft: "2px solid rgba(224,120,64,0.22)", borderRadius: "14px", overflow: "hidden" }}>
                  <button onClick={() => setExpandedAction(expandedAction === "draft" ? null : "draft")} style={{
                    width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer",
                    background: "none", border: "none", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "var(--ember)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "3px" }}>SEND A MESSAGE</div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontStyle: "italic", fontWeight: 300, color: "var(--text-quiet)" }}>warm, honest — ready to paste</div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "14px", marginLeft: "12px", marginTop: "2px" }}>{expandedAction === "draft" ? "↑" : "↓"}</span>
                  </button>
                  {expandedAction === "draft" && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(224,120,64,0.15)" }}>
                      <div style={{ marginTop: "14px" }}>
                        <EditableText value={bDraft} onChange={setBDraft} textStyle={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.65 }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
                        <CopyButton text={bDraft} onCopy={() => setShowSavePrompt(true)} />
                        <FeedbackCheckpoint
                          onConfirm={() => setShowSavePrompt(true)}
                          onRetry={(fb) => handleMessageRetry("draft", fb)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Not ready */}
                <div style={{ backgroundColor: "var(--surface)", borderLeft: "2px solid rgba(166,158,144,0.22)", borderRadius: "14px", overflow: "hidden" }}>
                  <button onClick={() => setExpandedAction(expandedAction === "freeze" ? null : "freeze")} style={{
                    width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer",
                    background: "none", border: "none", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 500, color: "var(--text-quiet)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "3px" }}>NOT READY YET</div>
                      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontStyle: "italic", fontWeight: 300, color: "var(--text-quiet)" }}>need time? that&apos;s okay</div>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "14px", marginLeft: "12px", marginTop: "2px" }}>{expandedAction === "freeze" ? "↑" : "↓"}</span>
                  </button>
                  {expandedAction === "freeze" && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border-light)" }}>
                      <div style={{ marginTop: "14px" }}>
                        <EditableText value={bFreeze} onChange={setBFreeze} textStyle={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text)", lineHeight: 1.65 }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
                        <CopyButton text={bFreeze} onCopy={() => setShowSavePrompt(true)} />
                        <Link href="/freeze" target="_blank" rel="noopener noreferrer" style={{
                          padding: "6px 14px", borderRadius: "8px",
                          border: "1px solid var(--border-light)", textDecoration: "none",
                          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                          fontSize: "12px", color: "var(--text-quiet)",
                        }}>
                          more templates ↗
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Just save */}
                <button onClick={() => handleSave("save")} style={{
                  width: "100%", backgroundColor: "var(--surface)", borderRadius: "14px",
                  padding: "16px 18px", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--text-soft)", marginBottom: "2px" }}>
                      just save the clarity
                    </div>
                    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                      keep the clarity, don&apos;t send anything{personName ? ` — save to ${personName}'s story` : ""}
                    </div>
                  </div>
                  <span style={{ color: "var(--text-faint)", fontSize: "14px", marginLeft: "12px" }}>↓</span>
                </button>

              </div>

              {/* Save prompt */}
              {showSavePrompt && !saved && (
                <div className="rl-fade" style={{ backgroundColor: "rgba(240,192,96,0.08)", borderLeft: "2px solid rgba(240,192,96,0.22)", borderRadius: "14px", padding: "16px 18px", marginBottom: "24px" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 300, color: "var(--text)", margin: "0 0 14px", lineHeight: 1.5 }}>
                    {personName ? (<>save this to <strong style={{ fontWeight: 500 }}>{personName}</strong>&apos;s story?</>) : "save this resolution?"}
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleSave(expandedAction ?? "save")} style={{
                      padding: "9px 18px", borderRadius: "12px", backgroundColor: "var(--ember)",
                      border: "none", color: "white",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    }}>
                      yes — save it
                    </button>
                    <button onClick={() => { setShowSavePrompt(false); setBreathT(0); setPhase("closing_breathe"); scrollTop(); }} style={{
                      padding: "9px 18px", borderRadius: "12px", background: "none",
                      border: "1px solid var(--border-light)", color: "var(--text-quiet)",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, cursor: "pointer",
                    }}>
                      keep it private
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── PHASE 9: CLOSING BREATHE ── */}
          {phase === "closing_breathe" && (
            <div className="rl-fade" style={{ padding: "48px 20px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div style={{ transition: "transform 0.1s linear, opacity 0.1s linear", transform: `scale(${breathScale})`, opacity: breathOpacity }}>
                  <Sprite src="/sprites/happy-removebg-preview.png" size={72} />
                </div>
              </div>

              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>
                want to settle before you go?
              </h2>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 20px" }}>
                just a breath or two
              </p>

              <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: breathLabelColor, margin: "0 0 6px", transition: "color 0.5s ease" }}>
                {breathLabel}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-faint)", margin: "0 0 28px" }}>
                {breathGuidance}
              </p>

              <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "36px" }}>
                {(["5-5", "4-4-4-4", "4-7-8"] as BreathPatternKey[]).map((k) => (
                  <button key={k} onClick={() => { setBreathPatternKey(k); setBreathT(0); }} style={{
                    padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
                    background: breathPatternKey === k ? "var(--surface)" : "none",
                    border: `1px solid ${breathPatternKey === k ? "var(--border-light)" : "transparent"}`,
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "11px", fontWeight: 300, color: breathPatternKey === k ? "var(--text-quiet)" : "var(--text-faint)",
                  }}>
                    {BREATH_PATTERNS[k].label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                {showBreathReady && (
                  <button onClick={() => { setPhase("done"); scrollTop(); }} className="rl-fade" style={{
                    padding: "12px 28px", borderRadius: "22px", cursor: "pointer",
                    backgroundColor: "var(--ember)", border: "none",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "13.5px", fontWeight: 500, color: "white",
                  }}>
                    i&apos;m settled
                  </button>
                )}
                <button onClick={() => { setPhase("done"); scrollTop(); }} style={{
                  padding: "10px 24px", borderRadius: "22px", cursor: "pointer",
                  background: "none", border: "1px solid var(--border-light)",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)",
                }}>
                  i&apos;m good
                </button>
              </div>
            </div>
          )}

          {/* ── PHASE 10: DONE ── */}
          {phase === "done" && (
            <div className="rl-fade" style={{ padding: "60px 20px 0", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "20px" }}>
                <span className="animate-float" style={{ display: "inline-block" }}>🔥</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "20px", fontWeight: 300, color: "var(--text)", margin: "0 0 8px" }}>
                you showed up for yourself
              </h2>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 32px", lineHeight: 1.5 }}>
                {saved ? `saved to ${personName ? `${personName}'s story` : "your resolutions"}.` : "that takes courage."}{" "}the clarity is yours now.
              </p>
              <button onClick={handleReset} style={{
                background: "none", border: "1px solid var(--border-light)", borderRadius: "20px",
                padding: "8px 22px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", cursor: "pointer",
              }}>
                start over
              </button>
            </div>
          )}

        </div>
      </main>
    </PasswordGate>
  );
}
