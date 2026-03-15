"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { EncounterType } from "@/lib/types";

type Stage = "input" | "processing" | "confirm" | "done";
type Category = "work" | "personal" | "social";

interface MatchedPerson {
  id: string;
  name: string;
  city: string | null;
  encounterCount: number;
  lastSeen: string | null;
}

interface Extracted {
  personName: string;
  city: string | null;
  category: Category;
  encounterType: EncounterType;
  summary: string;
  fullText: string;
  links: string[];
  actions: string[];
  confidence: "high" | "medium" | "low";
  matchedPerson: MatchedPerson | MatchedPerson[] | null;
}

interface CaptureSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onMoodChange: (mood: "idle" | "thinking" | "happy") => void;
}

const encounterTypes: { type: EncounterType; emoji: string; label: string }[] = [
  { type: "coffee", emoji: "☕", label: "coffee" },
  { type: "call", emoji: "📞", label: "call" },
  { type: "event", emoji: "✦", label: "event" },
  { type: "dm", emoji: "💬", label: "DM" },
  { type: "bumped", emoji: "👋", label: "met" },
];

const categories: { value: Category; label: string }[] = [
  { value: "work", label: "work" },
  { value: "personal", label: "personal" },
  { value: "social", label: "social" },
];

const energyLabel = (v: number) => {
  if (v < 25) return "drained";
  if (v < 45) return "low";
  if (v < 55) return "neutral";
  if (v < 75) return "good";
  return "energised";
};

const energyColor = (v: number) => {
  if (v < 30) return "var(--rose)";
  if (v < 50) return "#C49860";
  if (v < 70) return "var(--text-soft)";
  return "var(--sage)";
};

export default function CaptureSheet({ open, onClose, onSaved, onMoodChange }: CaptureSheetProps) {
  const [stage, setStage] = useState<Stage>("input");
  const [rawText, setRawText] = useState("");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [fallback, setFallback] = useState(false);

  // Confirm-stage editable fields
  const [personName, setPersonName] = useState("");
  const [summary, setSummary] = useState("");
  const [city, setCity] = useState("");
  const [encounterDate, setEncounterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [encounterType, setEncounterType] = useState<EncounterType>("coffee");
  const [category, setCategory] = useState<Category>("personal");
  const [energy, setEnergy] = useState(50);
  const [links, setLinks] = useState<{ url: string; checked: boolean }[]>([]);
  const [actions, setActions] = useState<{ text: string; checked: boolean }[]>([]);
  const [newAction, setNewAction] = useState("");

  // Matched/selected person for linking to existing
  const [matchedPerson, setMatchedPerson] = useState<MatchedPerson | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Name search dropdown state
  const [nameSearchResults, setNameSearchResults] = useState<MatchedPerson[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const nameSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStage("input");
        setRawText("");
        setExtracted(null);
        setFallback(false);
        setPersonName("");
        setSummary("");
        setCity("");
        setEncounterDate(new Date().toISOString().slice(0, 10));
        setEncounterType("coffee");
        setCategory("personal");
        setEnergy(50);
        setLinks([]);
        setActions([]);
        setNewAction("");
        setSaving(false);
        setMatchedPerson(null);
        setSelectedPersonId(null);
        setNameSearchResults([]);
        setShowNameDropdown(false);
        onMoodChange("idle");
      }, 350);
    }
  }, [open, onMoodChange]);

  // Autofocus textarea on open
  useEffect(() => {
    if (open && stage === "input") {
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [open, stage]);

  const populateConfirm = (data: Extracted) => {
    setPersonName(data.personName);
    setSummary(data.summary);
    setCity(data.city ?? "");
    setEncounterType(data.encounterType);
    setCategory(data.category);
    setLinks(data.links.map((url) => ({ url, checked: true })));
    setActions(data.actions.map((text) => ({ text, checked: true })));

    // Handle matched person — skip if confidence is low
    if (data.confidence !== "low" && data.matchedPerson) {
      if (Array.isArray(data.matchedPerson)) {
        // Ambiguous — show dropdown with candidates pre-filled
        setNameSearchResults(data.matchedPerson);
        setShowNameDropdown(true);
        setMatchedPerson(null);
        setSelectedPersonId(null);
      } else {
        setMatchedPerson(data.matchedPerson);
        setSelectedPersonId(data.matchedPerson.id);
      }
    }
  };

  const searchPeople = useCallback(async (q: string) => {
    if (q.length < 2) {
      setNameSearchResults([]);
      setShowNameDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/people/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const results: MatchedPerson[] = await res.json();
        setNameSearchResults(results);
        setShowNameDropdown(true);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const handleNameChange = (value: string) => {
    setPersonName(value);
    // Clear any existing match when user manually edits name
    setMatchedPerson(null);
    setSelectedPersonId(null);
    // Debounce search
    if (nameSearchTimeout.current) clearTimeout(nameSearchTimeout.current);
    nameSearchTimeout.current = setTimeout(() => searchPeople(value), 300);
  };

  const selectSearchResult = (person: MatchedPerson) => {
    setPersonName(person.name);
    setMatchedPerson(person);
    setSelectedPersonId(person.id);
    setShowNameDropdown(false);
    setNameSearchResults([]);
  };

  const clearMatch = () => {
    setMatchedPerson(null);
    setSelectedPersonId(null);
  };

  const handleNext = async () => {
    if (!rawText.trim()) return;
    setStage("processing");
    onMoodChange("thinking");

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });

      if (res.ok) {
        const data: Extracted = await res.json();
        setExtracted(data);
        populateConfirm(data);
        setFallback(false);
      } else {
        // Fallback: use raw text as summary
        setFallback(true);
        setSummary(rawText.trim().slice(0, 200));
        setLinks([]);
        setActions([]);
      }
    } catch {
      setFallback(true);
      setSummary(rawText.trim().slice(0, 200));
      setLinks([]);
      setActions([]);
    }

    onMoodChange("idle");
    setStage("confirm");
  };

  const handleSave = async () => {
    if (!personName.trim() || !summary.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: selectedPersonId ?? undefined,
          personName: personName.trim(),
          city: city.trim() || undefined,
          date: encounterDate,
          type: encounterType,
          category,
          summary: summary.trim(),
          fullText: extracted?.fullText ?? rawText.trim(),
          energy,
          source: "text",
          rawTranscript: rawText.trim(),
          actions: actions.filter((a) => a.checked && a.text.trim()).map((a) => a.text.trim()),
          links: links.filter((l) => l.checked).map((l) => l.url),
        }),
      });

      if (!res.ok) {
        console.error("[CaptureSheet] save failed", await res.json());
        setSaving(false);
        return;
      }

      setStage("done");
      onMoodChange("happy");
      setTimeout(() => onMoodChange("idle"), 3000);
      setTimeout(() => { onSaved(); onClose(); }, 2000);
    } catch (e) {
      console.error("[CaptureSheet] fetch error:", e);
      setSaving(false);
    }
  };

  // ── Shared styles ──
  const inputBase: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    color: "var(--text)",
    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
    fontWeight: 300,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "11px 28px",
    borderRadius: "20px",
    backgroundColor: "var(--ember)",
    border: "none",
    color: "white",
    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
    fontSize: "13.5px",
    fontWeight: 400,
    cursor: "pointer",
  };

  const btnSecondary: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "20px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border-light)",
    color: "var(--text-soft)",
    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
    fontSize: "13px",
    fontWeight: 300,
    cursor: "pointer",
  };

  const typeSelected = (t: EncounterType) => ({
    flex: 1, display: "flex" as const, flexDirection: "column" as const,
    alignItems: "center" as const, justifyContent: "center" as const,
    gap: "4px", padding: "9px 0",
    borderRadius: "10px",
    backgroundColor: encounterType === t ? "var(--ember-soft)" : "var(--surface)",
    border: `1px solid ${encounterType === t ? "rgba(224,120,64,0.25)" : "var(--border)"}`,
    cursor: "pointer" as const, transition: "all 0.15s ease",
  });

  const catSelected = (v: Category) => ({
    flex: 1, padding: "8px 0", borderRadius: "20px",
    backgroundColor: category === v ? "var(--ember-soft)" : "var(--surface)",
    border: `1px solid ${category === v ? "rgba(224,120,64,0.2)" : "var(--border)"}`,
    color: category === v ? "var(--ember)" : "var(--text-quiet)",
    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
    fontSize: "12px", fontWeight: 300 as const, cursor: "pointer" as const, transition: "all 0.15s ease",
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(15,12,10,0.8)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          zIndex: 99,
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed", bottom: 0, left: "50%",
          transform: `translateX(-50%) translateY(${open ? "0" : "100%"})`,
          width: "100%", maxWidth: "430px",
          backgroundColor: "var(--bg-soft)",
          borderRadius: "22px 22px 0 0",
          zIndex: 100,
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "14px", paddingBottom: "4px", flexShrink: 0 }}>
          <div style={{ width: "28px", height: "3.5px", borderRadius: "2px", backgroundColor: "var(--text-faint)", opacity: 0.35 }} />
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "12px 24px 32px" }}>

          {/* ── INPUT ── */}
          {stage === "input" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "20px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px" }}>
                  come sit by the fire
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  who&apos;d you gather with today?
                </p>
              </div>

              {/* Voice placeholder */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <button
                  disabled
                  style={{
                    width: "58px", height: "58px", borderRadius: "50%",
                    background: "radial-gradient(circle, var(--gold) 0%, var(--ember) 100%)",
                    border: "none", fontSize: "24px", cursor: "not-allowed", opacity: 0.4,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  🎙️
                </button>
                <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>
                  tap to talk (coming soon)
                </span>
              </div>

              {/* Main textarea */}
              <textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="just dump it all — who you met, what happened, any links..."
                rows={6}
                style={{
                  ...inputBase,
                  fontSize: "14px",
                  padding: "16px",
                  minHeight: "150px",
                  lineHeight: 1.55,
                  resize: "none",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  style={{ ...btnPrimary, opacity: !rawText.trim() ? 0.4 : 1, cursor: !rawText.trim() ? "not-allowed" : "pointer" }}
                  onClick={handleNext}
                >
                  next →
                </button>
              </div>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {stage === "processing" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "32px 0" }}>
              <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: 0 }}>
                sorting through your thoughts...
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                finding the people, stories, and threads
              </p>
              {/* Subtle pulse dots */}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      backgroundColor: "var(--ember)",
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.2; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1); }
                }
              `}</style>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {stage === "confirm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {fallback && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", backgroundColor: "var(--surface)", borderLeft: "2px solid rgba(224,120,64,0.3)" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                    couldn&apos;t parse automatically — fill in the details
                  </p>
                </div>
              )}

              {/* Matched person banner */}
              {matchedPerson && (
                <div style={{
                  backgroundColor: "rgba(240,192,96,0.08)",
                  borderLeft: "2px solid rgba(240,192,96,0.2)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-soft)", margin: 0 }}>
                    adding to{" "}
                    <span style={{ fontWeight: 500 }}>{matchedPerson.name}</span>
                    {"'s story"}
                    {matchedPerson.city ? ` · ${matchedPerson.city}` : ""}
                    {matchedPerson.encounterCount > 0 ? ` · met ${matchedPerson.encounterCount} time${matchedPerson.encounterCount === 1 ? "" : "s"}` : ""}
                  </p>
                  <button
                    onClick={clearMatch}
                    style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px", padding: "0 2px", flexShrink: 0 }}
                    title="unlink"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Person name */}
              <div style={{ position: "relative" }}>
                <label style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  person
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => { if (nameSearchResults.length > 0) setShowNameDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowNameDropdown(false), 150)}
                  placeholder="their name"
                  style={{ ...inputBase, fontSize: "18px", fontWeight: 400, padding: "12px 14px" }}
                />
                {/* Search dropdown */}
                {showNameDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0, right: 0,
                    backgroundColor: "var(--surface-light)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "12px",
                    zIndex: 10,
                    overflow: "hidden",
                  }}>
                    {nameSearchResults.map((p, i) => (
                      <div
                        key={p.id}
                        onMouseDown={() => selectSearchResult(p)}
                        style={{
                          padding: "10px 14px",
                          borderBottom: i < nameSearchResults.length - 1 ? "1px solid var(--border)" : "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--text)" }}>{p.name}</div>
                        <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                          {[p.city, p.encounterCount > 0 ? `met ${p.encounterCount} time${p.encounterCount === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    ))}
                    <div
                      onMouseDown={() => {
                        setMatchedPerson(null);
                        setSelectedPersonId(null);
                        setShowNameDropdown(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "13px",
                        color: "var(--ember)",
                      }}
                    >
                      + add &ldquo;{personName}&rdquo; as new person
                    </div>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  when
                </label>
                <style>{`.cs-date::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }`}</style>
                <input
                  type="date"
                  value={encounterDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEncounterDate(e.target.value)}
                  className="cs-date"
                  style={{ ...inputBase, fontSize: "13.5px", padding: "12px 14px", colorScheme: "dark" }}
                />
              </div>

              {/* Summary */}
              <div>
                <label style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  what happened
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  style={{ ...inputBase, fontSize: "14px", padding: "12px 14px", resize: "none", lineHeight: 1.55 }}
                />
              </div>

              {/* Type + Category + City */}
              <div style={{ display: "flex", gap: "8px" }}>
                {encounterTypes.map(({ type: t, emoji, label }) => (
                  <button key={t} onClick={() => setEncounterType(t)} style={typeSelected(t)}>
                    <span style={{ fontSize: "17px", lineHeight: 1 }}>{emoji}</span>
                    <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", color: encounterType === t ? "var(--ember)" : "var(--text-faint)" }}>{label}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {categories.map(({ value, label }) => (
                  <button key={value} onClick={() => setCategory(value)} style={catSelected(value)}>{label}</button>
                ))}
              </div>

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="city (optional)"
                style={{ ...inputBase, fontSize: "13px", padding: "10px 14px" }}
              />

              {/* Detected links */}
              {links.length > 0 && (
                <div>
                  <label style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    links found
                  </label>
                  {links.map((l, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={l.checked}
                        onChange={() => setLinks((prev) => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x))}
                        style={{ accentColor: "var(--ember)", width: "15px", height: "15px", flexShrink: 0 }}
                      />
                      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "11.5px", color: "var(--text-soft)", wordBreak: "break-all" }}>{l.url}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Detected actions */}
              {(actions.length > 0 || newAction !== undefined) && (
                <div>
                  <label style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    action items
                  </label>
                  {actions.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                      <input
                        type="checkbox"
                        checked={a.checked}
                        onChange={() => setActions((prev) => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x))}
                        style={{ accentColor: "var(--ember)", width: "15px", height: "15px", flexShrink: 0 }}
                      />
                      <input
                        type="text"
                        value={a.text}
                        onChange={(e) => setActions((prev) => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                        style={{ ...inputBase, fontSize: "13px", padding: "4px 8px", borderRadius: "8px", flex: 1 }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="text"
                      value={newAction}
                      onChange={(e) => setNewAction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newAction.trim()) {
                          setActions((prev) => [...prev, { text: newAction.trim(), checked: true }]);
                          setNewAction("");
                        }
                      }}
                      placeholder="+ add action (Enter to add)"
                      style={{ ...inputBase, fontSize: "13px", padding: "8px 12px", flex: 1 }}
                    />
                  </div>
                </div>
              )}

              {/* Energy */}
              <div>
                <label style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                  energy
                </label>
                <style>{`
                  .cs-energy { -webkit-appearance:none; appearance:none; width:100%; height:4px; background:var(--surface-light); border-radius:2px; outline:none; }
                  .cs-energy::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:var(--ember); border:2px solid var(--bg-soft); box-shadow:0 2px 8px rgba(224,120,64,0.4); cursor:pointer; }
                  .cs-energy::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:var(--ember); border:2px solid var(--bg-soft); cursor:pointer; border:none; }
                `}</style>
                <input type="range" min={0} max={100} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="cs-energy" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>drained</span>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 400, color: energyColor(energy), transition: "color 0.2s" }}>{energyLabel(energy)}</span>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>energised</span>
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", paddingTop: "4px" }}>
                <button style={btnSecondary} onClick={() => setStage("input")}>← edit</button>
                <button
                  style={{ ...btnPrimary, opacity: (!personName.trim() || !summary.trim() || saving) ? 0.5 : 1, cursor: (!personName.trim() || !summary.trim() || saving) ? "not-allowed" : "pointer" }}
                  onClick={handleSave}
                >
                  {saving ? "saving..." : "add to the fire 🔥"}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {stage === "done" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "32px 0" }}>
              <span className="animate-float" style={{ fontSize: "40px" }}>🔥</span>
              <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text)", margin: 0 }}>
                added to the fire
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-quiet)", margin: 0, textAlign: "center" }}>
                finding the people, stories, and threads
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
