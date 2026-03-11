"use client";

import { useState } from "react";
// CommitmentsSection is rendered separately on the home page
import { EncounterType } from "@/lib/types";

export interface FeedEncounter {
  id: string;
  personName: string;
  personId: string;
  type: EncounterType;
  date: string;
  time: string;
  summary: string;
  energy?: number;
  city?: string | null;
}

interface JournalFeedProps {
  encounters: FeedEncounter[];
  onEdit: (enc: FeedEncounter) => void;
  onDelete: (id: string) => void;
  onPersonTap: (personId: string) => void;
  // passed through to CommitmentsBlock
}

const typeEmoji: Record<EncounterType, string> = {
  coffee: "☕",
  call: "📞",
  event: "✦",
  dm: "💬",
  bumped: "👋",
};

function EncounterRow({
  enc,
  onEdit,
  onDelete,
  onPersonTap,
}: {
  enc: FeedEncounter;
  onEdit: () => void;
  onDelete: () => void;
  onPersonTap: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleEdit = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
    onEdit();
  };

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      {/* Name line */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "16px", fontWeight: 400, color: "var(--text)" }}>
            {typeEmoji[enc.type]}
          </span>
          <button
            onClick={onPersonTap}
            style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontSize: "16px", fontWeight: 400, color: "var(--text)",
              background: "none", border: "none", padding: 0, cursor: "pointer",
            }}
          >
            {enc.personName}
          </button>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "12px" }}>
          <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--text-faint)" }}>
            {enc.time}
          </span>
          {/* ··· toggle */}
          <button
            onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: menuOpen ? "var(--text-soft)" : "var(--text-faint)",
              fontSize: "14px", lineHeight: 1, padding: "2px 0",
              letterSpacing: "1px",
              transition: "color 0.15s",
            }}
          >
            ···
          </button>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          paddingLeft: "21px",
          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
          fontSize: "13.5px", fontWeight: 300, color: "var(--text-quiet)", lineHeight: 1.45,
        }}
      >
        {enc.summary}
      </div>

      {/* City tag */}
      {enc.city && (
        <div style={{ paddingLeft: "21px", marginTop: "6px" }}>
          <span style={{
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "11px", fontWeight: 300, color: "var(--text-faint)",
            letterSpacing: "0.3px",
          }}>
            📍 {enc.city}
          </span>
        </div>
      )}

      {/* Inline action row */}
      {menuOpen && (
        <div
          style={{
            display: "flex", gap: "8px", paddingLeft: "21px", paddingTop: "10px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <button
            onClick={handleEdit}
            style={{
              padding: "5px 14px", borderRadius: "14px",
              backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
              color: "var(--text-soft)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "12px", fontWeight: 300, cursor: "pointer",
            }}
          >
            ✏️ edit
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: "5px 14px", borderRadius: "14px",
              backgroundColor: confirmDelete ? "rgba(196,114,114,0.12)" : "var(--surface)",
              border: `1px solid ${confirmDelete ? "rgba(196,114,114,0.3)" : "var(--border-light)"}`,
              color: confirmDelete ? "var(--rose)" : "var(--text-soft)",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "12px", fontWeight: 300, cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {confirmDelete ? "confirm delete" : "🗑️ delete"}
          </button>
          {confirmDelete && (
            <button
              onClick={() => { setConfirmDelete(false); setMenuOpen(false); }}
              style={{
                padding: "5px 14px", borderRadius: "14px",
                backgroundColor: "var(--surface)", border: "1px solid var(--border-light)",
                color: "var(--text-faint)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "12px", fontWeight: 300, cursor: "pointer",
              }}
            >
              cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function JournalFeed({ encounters, onEdit, onDelete, onPersonTap }: JournalFeedProps) {
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  // Unique cities across all encounters, preserving first-seen order
  const cities = Array.from(
    new Set(encounters.map((e) => e.city).filter((c): c is string => !!c))
  );

  const visible = cityFilter
    ? encounters.filter((e) => e.city === cityFilter)
    : encounters;

  const grouped = visible.reduce<Record<string, FeedEncounter[]>>((acc, enc) => {
    if (!acc[enc.date]) acc[enc.date] = [];
    acc[enc.date].push(enc);
    return acc;
  }, {});

  const dateGroups = Object.entries(grouped);

  return (
    <div style={{ padding: "0 20px 120px" }}>
      <h2
        style={{
          fontFamily: "var(--font-newsreader), Georgia, serif",
          fontSize: "18px", fontWeight: 400, color: "var(--text)",
          margin: "0 0 14px", padding: 0,
        }}
      >
        recent encounters
      </h2>

      {/* City filter chips — only shown when there are cities to filter by */}
      {cities.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {cityFilter && (
            <button
              onClick={() => setCityFilter(null)}
              style={{
                padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
                backgroundColor: "var(--ember-soft)",
                border: "1px solid rgba(224,120,64,0.25)",
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "11.5px", fontWeight: 300, color: "var(--ember)",
              }}
            >
              ✕ all
            </button>
          )}
          {cities.map((city) => {
            const active = cityFilter === city;
            return (
              <button
                key={city}
                onClick={() => setCityFilter(active ? null : city)}
                style={{
                  padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
                  backgroundColor: active ? "var(--ember-soft)" : "var(--surface)",
                  border: `1px solid ${active ? "rgba(224,120,64,0.25)" : "var(--border)"}`,
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "11.5px", fontWeight: active ? 400 : 300,
                  color: active ? "var(--ember)" : "var(--text-faint)",
                  transition: "all 0.15s",
                }}
              >
                📍 {city}
              </button>
            );
          })}
        </div>
      )}

      {dateGroups.map(([date, group]) => (
        <div key={date} style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "11px", fontWeight: 400, color: "var(--text-faint)",
              letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "4px",
            }}
          >
            {date}
          </div>
          {group.map((enc) => (
            <EncounterRow
              key={enc.id}
              enc={enc}
              onEdit={() => onEdit(enc)}
              onDelete={() => onDelete(enc.id)}
              onPersonTap={() => onPersonTap(enc.personId)}
            />
          ))}
        </div>
      ))}

      <p
        style={{
          fontFamily: "var(--font-newsreader), Georgia, serif",
          fontStyle: "italic", fontSize: "13.5px", fontWeight: 300,
          color: "var(--text-faint)", textAlign: "center",
          marginTop: "32px", lineHeight: 1.6, padding: "0 8px",
        }}
      >
        the people you gather around become the story of your life
      </p>
    </div>
  );
}
