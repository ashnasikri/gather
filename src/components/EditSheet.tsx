"use client";

import { useState, useEffect, useRef } from "react";
import { EncounterType } from "@/lib/types";

interface EditSheetProps {
  open: boolean;
  encounterId: string;
  personId: string;
  initialSummary: string;
  initialType: EncounterType;
  initialEnergy?: number;
  initialCity?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const encounterTypes: { type: EncounterType; emoji: string; label: string }[] = [
  { type: "coffee", emoji: "☕", label: "coffee" },
  { type: "call", emoji: "📞", label: "call" },
  { type: "event", emoji: "✦", label: "event" },
  { type: "dm", emoji: "💬", label: "DM" },
  { type: "bumped", emoji: "👋", label: "met" },
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

export default function EditSheet({
  open, encounterId, personId, initialSummary, initialType, initialEnergy, initialCity,
  onClose, onSaved,
}: EditSheetProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [type, setType] = useState<EncounterType>(initialType);
  const [energy, setEnergy] = useState(initialEnergy ?? 50);
  const [city, setCity] = useState(initialCity ?? "");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync props when sheet opens for a new encounter
  useEffect(() => {
    if (open) {
      setSummary(initialSummary);
      setType(initialType);
      setEnergy(initialEnergy ?? 50);
      setCity(initialCity ?? "");
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [open, initialSummary, initialType, initialEnergy, initialCity]);

  const handleSave = async () => {
    if (!summary.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/encounters/${encounterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: summary.trim(), type, energy, city: city.trim(), personId }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        console.error("[EditSheet] save failed", await res.json());
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    color: "var(--text)",
    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
    fontSize: "13.5px",
    fontWeight: 300,
    outline: "none",
    boxSizing: "border-box",
    resize: "none",
  };

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
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
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
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "14px", paddingBottom: "8px" }}>
          <div style={{ width: "28px", height: "3.5px", borderRadius: "2px", backgroundColor: "var(--text-faint)", opacity: 0.35 }} />
        </div>

        <div style={{ padding: "8px 24px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <h2 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "18px", fontWeight: 300, color: "var(--text)", margin: 0 }}>
            edit entry
          </h2>

          {/* Summary */}
          <textarea
            ref={textareaRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            style={{ ...inputStyle, minHeight: "100px" }}
          />

          {/* Type */}
          <div style={{ display: "flex", gap: "8px" }}>
            {encounterTypes.map(({ type: t, emoji, label }) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "5px", padding: "10px 0 8px",
                  borderRadius: "12px",
                  backgroundColor: type === t ? "var(--ember-soft)" : "var(--surface)",
                  border: `1px solid ${type === t ? "rgba(224,120,64,0.25)" : "var(--border)"}`,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", color: type === t ? "var(--ember)" : "var(--text-faint)" }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* City */}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="📍 city (optional)"
            style={{ ...inputStyle, fontSize: "13px", padding: "10px 14px" }}
          />

          {/* Energy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <style>{`
              .edit-energy-slider { -webkit-appearance:none; appearance:none; width:100%; height:4px; background:var(--surface-light); border-radius:2px; outline:none; }
              .edit-energy-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:var(--ember); border:2px solid var(--bg-soft); box-shadow:0 2px 8px rgba(224,120,64,0.4); cursor:pointer; }
              .edit-energy-slider::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:var(--ember); border:2px solid var(--bg-soft); cursor:pointer; }
            `}</style>
            <input
              type="range" min={0} max={100} value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="edit-energy-slider"
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>drained</span>
              <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 400, color: energyColor(energy), transition: "color 0.2s" }}>
                {energyLabel(energy)}
              </span>
              <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>energised</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px", borderRadius: "20px",
                backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                color: "var(--text-soft)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px", fontWeight: 300, cursor: "pointer",
              }}
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "11px 24px", borderRadius: "20px",
                backgroundColor: "var(--ember)", border: "none",
                color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13.5px", fontWeight: 400,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "saving..." : "save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
