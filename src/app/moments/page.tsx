"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PasswordGate from "@/components/PasswordGate";
import BonfireCharacter from "@/components/BonfireCharacter";
import BottomNav from "@/components/BottomNav";

type Feeling = "nourishing" | "deep" | "joyful" | "calm" | "intense" | "inspired" | "angry" | "safe" | "belonged";

interface Moment {
  id: string;
  title: string;
  text: string | null;
  feeling: Feeling | null;
  location: string | null;
  date: string;
  time: string;
  momentDate: string;
  createdAt: string;
}

const feelings: { value: Feeling; emoji: string; label: string; color: string }[] = [
  { value: "nourishing", emoji: "🌿", label: "nourishing", color: "#7a9e6b" },
  { value: "deep",       emoji: "🌊", label: "deep",       color: "#6b8ab5" },
  { value: "joyful",     emoji: "✨", label: "joyful",     color: "#d4a53b" },
  { value: "calm",       emoji: "🫧", label: "calm",       color: "#8b7eb5" },
  { value: "intense",    emoji: "🔥", label: "intense",    color: "#c46b5a" },
  { value: "inspired",   emoji: "💡", label: "inspired",   color: "#d4883b" },
  { value: "angry",      emoji: "😤", label: "angry",      color: "#c44a3a" },
  { value: "safe",       emoji: "🛡️", label: "safe",       color: "#6b9e8b" },
  { value: "belonged",   emoji: "🤝", label: "belonged",   color: "#9b7eb5" },
];

const feelingMap = Object.fromEntries(feelings.map((f) => [f.value, f])) as Record<Feeling, typeof feelings[0]>;

function MomentRow({
  moment,
  onDelete,
}: {
  moment: Moment;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const f = moment.feeling ? feelingMap[moment.feeling] : null;

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #3a2f24" }}>
      {/* Top row: title + time + menu */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
        <span
          style={{
            fontFamily: "var(--font-newsreader), Georgia, serif",
            fontSize: "15px",
            fontStyle: "italic",
            fontWeight: 400,
            color: "#e8ddd0",
            flex: 1,
            paddingRight: "10px",
          }}
        >
          {moment.title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "12px",
              color: "#6b5e50",
            }}
          >
            {moment.time}
          </span>
          <button
            onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: menuOpen ? "#9a8b7a" : "#6b5e50",
              fontSize: "14px",
              lineHeight: 1,
              padding: "2px 0",
              letterSpacing: "1px",
              transition: "color 0.15s",
            }}
          >
            ···
          </button>
        </div>
      </div>

      {/* Body text */}
      {moment.text && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "13.5px",
            fontWeight: 300,
            color: "#9a8b7a",
            lineHeight: 1.5,
            margin: "0 0 8px",
          }}
        >
          {moment.text}
        </p>
      )}

      {/* Bottom row: feeling + location */}
      {(f || moment.location) && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {f && (
            <span
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "11px",
                fontWeight: 300,
                color: f.color,
                padding: "3px 8px",
                borderRadius: "12px",
                border: `1px solid ${f.color}40`,
                backgroundColor: `${f.color}10`,
              }}
            >
              {f.emoji} {f.label}
            </span>
          )}
          {moment.location && (
            <span
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "12px",
                fontWeight: 300,
                color: "#d4853b",
              }}
            >
              📍 {moment.location}
            </span>
          )}
        </div>
      )}

      {/* Inline action row */}
      {menuOpen && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            paddingTop: "10px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <button
            onClick={() => {
              if (confirmDelete) {
                onDelete();
              } else {
                setConfirmDelete(true);
              }
            }}
            style={{
              padding: "5px 14px",
              borderRadius: "14px",
              backgroundColor: confirmDelete ? "rgba(196,107,90,0.12)" : "var(--surface)",
              border: `1px solid ${confirmDelete ? "rgba(196,107,90,0.3)" : "var(--border-light)"}`,
              color: confirmDelete ? "#c46b5a" : "var(--text-soft)",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "12px",
              fontWeight: 300,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {confirmDelete ? "delete this moment?" : "🗑️ delete"}
          </button>
          {confirmDelete && (
            <button
              onClick={() => { setConfirmDelete(false); setMenuOpen(false); }}
              style={{
                padding: "5px 14px",
                borderRadius: "14px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-light)",
                color: "var(--text-faint)",
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "12px",
                fontWeight: 300,
                cursor: "pointer",
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

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [feelingFilter, setFeelingFilter] = useState<Feeling | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Add form state
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/moments");
      if (res.ok) {
        const { moments: data } = await res.json();
        setMoments(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Listen for "something moved me" signal from BottomNav
  useEffect(() => {
    const handler = () => {
      if (sessionStorage.getItem("gather_open_moment") === "1") {
        sessionStorage.removeItem("gather_open_moment");
        setAddOpen(true);
      }
    };
    window.addEventListener("gather_open_moment", handler);
    handler();
    return () => window.removeEventListener("gather_open_moment", handler);
  }, []);

  // Autofocus title when add form opens
  useEffect(() => {
    if (addOpen) {
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [addOpen]);

  const resetForm = () => {
    setTitle("");
    setText("");
    setSelectedFeeling(null);
    setLocation("");
    setSaving(false);
    setSaveError(null);
    setAddOpen(false);
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          text: text.trim() || null,
          feeling: selectedFeeling,
          location: location.trim() || null,
        }),
      });
      if (res.ok) {
        const newMoment = await res.json();
        setMoments((prev) => [newMoment, ...prev]);
        resetForm();
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error ?? `error ${res.status}`);
        setSaving(false);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "network error");
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic remove
    setMoments((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/moments/${id}`, { method: "DELETE" });
  };

  const visible = feelingFilter
    ? moments.filter((m) => m.feeling === feelingFilter)
    : moments;

  const grouped = visible.reduce<Record<string, Moment[]>>((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  const sharedInputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #3a2f24",
    outline: "none",
    color: "#e8ddd0",
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 0",
  };

  return (
    <PasswordGate>
      <main
        style={{
          maxWidth: "430px",
          margin: "0 auto",
          minHeight: "100dvh",
          backgroundColor: "#1a1410",
          position: "relative",
        }}
      >
        <div style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "100px" }}>
          {/* Header */}
          <header style={{ textAlign: "center", paddingTop: "52px", paddingBottom: "4px" }}>
            <h1
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "27px",
                fontWeight: 300,
                color: "var(--text)",
                margin: "0 0 6px",
                letterSpacing: "-0.2px",
              }}
            >
              moments
            </h1>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px",
                fontWeight: 300,
                color: "var(--text-quiet)",
                margin: 0,
              }}
            >
              what moved you?
            </p>
          </header>

          <BonfireCharacter mood="idle" />

          {/* Subheading */}
          <div style={{ textAlign: "center", padding: "0 24px 4px" }}>
            <p
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "17px",
                fontWeight: 300,
                color: "#e8ddd0",
                margin: "0 0 6px",
                lineHeight: 1.5,
              }}
            >
              capture the feeling before it fades
            </p>
          </div>

          {/* Add form — inline, not a modal */}
          {addOpen && (
            <div
              style={{
                margin: "16px 20px",
                padding: "18px",
                backgroundColor: "var(--surface)",
                borderRadius: "16px",
                border: "1px solid #3a2f24",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Title */}
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") resetForm(); }}
                placeholder="what happened?"
                style={{
                  ...sharedInputStyle,
                  fontFamily: "var(--font-newsreader), Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "15px",
                }}
              />

              {/* Text */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="how did it feel..."
                rows={3}
                style={{
                  ...sharedInputStyle,
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "13.5px",
                  color: "#9a8b7a",
                  resize: "none",
                  lineHeight: 1.5,
                  borderBottom: "1px solid #3a2f24",
                }}
              />

              {/* Feeling selector */}
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {feelings.map(({ value, emoji, label, color }) => {
                  const active = selectedFeeling === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setSelectedFeeling(active ? null : value)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: `1px solid ${active ? `${color}40` : "#3a2f24"}`,
                        backgroundColor: active ? `${color}15` : "transparent",
                        color: active ? color : "#6b5e50",
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "12px",
                        fontWeight: 300,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {emoji} {label}
                    </button>
                  );
                })}
              </div>

              {/* Location */}
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="📍 where?"
                style={{
                  ...sharedInputStyle,
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "12px",
                  color: "#6b5e50",
                }}
              />

              {/* Error */}
              {saveError && (
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "#c46b5a", margin: 0, textAlign: "center" }}>
                  {saveError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                  onClick={resetForm}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "20px",
                    backgroundColor: "transparent",
                    border: "1px solid #3a2f24",
                    color: "#6b5e50",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "13px",
                    fontWeight: 300,
                    cursor: "pointer",
                  }}
                >
                  cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "20px",
                    backgroundColor: "#d4853b",
                    border: "none",
                    color: "#1a1410",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: !title.trim() || saving ? "not-allowed" : "pointer",
                    opacity: !title.trim() || saving ? 0.5 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? "saving..." : "save moment"}
                </button>
              </div>
            </div>
          )}

          {/* Add button (when form is closed) */}
          {!addOpen && (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 20px 0" }}>
              <button
                onClick={() => setAddOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "12px",
                  color: "#6b5e50",
                  padding: 0,
                }}
              >
                + capture
              </button>
            </div>
          )}

          {/* Feeling filter pills */}
          <div
            style={{
              display: "flex",
              gap: "7px",
              padding: "14px 20px 4px",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            <style>{`.mo-pills::-webkit-scrollbar { display: none; }`}</style>
            {feelings.map(({ value, emoji, label, color }) => {
              const active = feelingFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setFeelingFilter(active ? null : value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "16px",
                    border: `1px solid ${color}25`,
                    backgroundColor: active ? `${color}18` : "transparent",
                    color: color,
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "11px",
                    fontWeight: active ? 400 : 300,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                    opacity: active ? 1 : 0.75,
                  }}
                >
                  {emoji} {label}
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div style={{ padding: "8px 20px 0" }}>
            {loading ? null : visible.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p
                  style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "15px",
                    fontWeight: 300,
                    color: "#6b5e50",
                    margin: "0 0 8px",
                  }}
                >
                  {feelingFilter ? `no ${feelingFilter} moments yet` : "no moments yet"}
                </p>
                {!feelingFilter && (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#6b5e50",
                      margin: 0,
                    }}
                  >
                    tap 🔥 sit by the fire to capture one
                  </p>
                )}
              </div>
            ) : (
              Object.entries(grouped).map(([date, group]) => (
                <div key={date} style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#6b5e50",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    {date}
                  </div>
                  {group.map((m) => (
                    <MomentRow
                      key={m.id}
                      moment={m}
                      onDelete={() => handleDelete(m.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        <BottomNav />
      </main>
    </PasswordGate>
  );
}
