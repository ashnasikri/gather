"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PasswordGate from "@/components/PasswordGate";
import BonfireCharacter from "@/components/BonfireCharacter";
import BottomNav from "@/components/BottomNav";

type Priority = "urgent" | "important" | "whenever";

interface Commitment {
  id: string;
  text: string;
  person_name: string | null;
  priority: Priority;
  due_text: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const PRIORITY_BORDER: Record<Priority, string> = {
  urgent: "3px solid #c46b5a",
  important: "3px solid #d4a53b",
  whenever: "none",
};

const PRIORITY_BG: Record<Priority, string> = {
  urgent: "rgba(196,107,90,0.06)",
  important: "rgba(212,165,59,0.04)",
  whenever: "transparent",
};

const DUE_COLOR: Record<Priority, string> = {
  urgent: "#c46b5a",
  important: "#d4a53b",
  whenever: "#6b5e50",
};

const PRIORITY_OPTIONS: { value: Priority; emoji: string; label: string; color: string }[] = [
  { value: "urgent", emoji: "🔴", label: "urgent", color: "#c46b5a" },
  { value: "important", emoji: "🟡", label: "important", color: "#d4a53b" },
  { value: "whenever", emoji: "⚪", label: "whenever", color: "#6b5e50" },
];

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [addOpen, setAddOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftPerson, setDraftPerson] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("whenever");
  const [saving, setSaving] = useState(false);

  // Menu / inline state
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);

  const textInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/commitments");
      if (res.ok) {
        const { commitments: data } = await res.json();
        setCommitments(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // BottomNav "i made a promise" signal
  useEffect(() => {
    const handler = () => {
      if (sessionStorage.getItem("gather_open_promise") === "1") {
        sessionStorage.removeItem("gather_open_promise");
        setAddOpen(true);
      }
    };
    window.addEventListener("gather_open_promise", handler);
    handler();
    return () => window.removeEventListener("gather_open_promise", handler);
  }, []);

  // Autofocus add input
  useEffect(() => {
    if (addOpen) setTimeout(() => textInputRef.current?.focus(), 120);
    else {
      setTimeout(() => {
        setDraftText(""); setDraftPerson(""); setDraftDue("");
        setDraftPriority("whenever"); setSaving(false);
      }, 350);
    }
  }, [addOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleAdd = async () => {
    if (!draftText.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: draftText.trim(),
          person_name: draftPerson.trim() || null,
          due_text: draftDue.trim() || null,
          priority: draftPriority,
          source_type: "manual",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setCommitments((prev) => [created, ...prev]);
        setAddOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (c: Commitment) => {
    setCompleting((s) => new Set(s).add(c.id));
    setTimeout(async () => {
      setCommitments((prev) =>
        prev.map((x) => x.id === c.id ? { ...x, completed: !c.completed, completed_at: !c.completed ? new Date().toISOString() : null } : x)
      );
      setCompleting((s) => { const n = new Set(s); n.delete(c.id); return n; });
      await fetch(`/api/commitments/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !c.completed }),
      });
    }, 300);
  };

  const handlePriority = async (id: string, priority: Priority) => {
    setMenuOpen(null);
    setCommitments((prev) => prev.map((x) => x.id === id ? { ...x, priority } : x));
    await fetch(`/api/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
  };

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return;
    setCommitments((prev) => prev.map((x) => x.id === id ? { ...x, text: editText.trim() } : x));
    setEditingId(null);
    await fetch(`/api/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() }),
    });
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    setMenuOpen(null);
    setCommitments((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/commitments/${id}`, { method: "DELETE" });
  };

  const open = commitments.filter((c) => !c.completed);
  const done = commitments.filter((c) => c.completed);

  // Sort open by priority weight
  const WEIGHT: Record<Priority, number> = { urgent: 0, important: 1, whenever: 2 };
  const sortedOpen = [...open].sort((a, b) => (WEIGHT[a.priority] ?? 2) - (WEIGHT[b.priority] ?? 2));

  const renderItem = (c: Commitment) => {
    const isCompleting = completing.has(c.id);
    const isEditing = editingId === c.id;
    const menuIsOpen = menuOpen === c.id;
    const deleteConfirm = confirmDelete === c.id;

    return (
      <div
        key={c.id}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "12px 14px",
          borderBottom: "1px solid #3a2f24",
          borderLeft: !c.completed ? PRIORITY_BORDER[c.priority] : "none",
          backgroundColor: !c.completed ? PRIORITY_BG[c.priority] : "transparent",
          opacity: c.completed ? 0.4 : isCompleting ? 0.5 : 1,
          transition: "opacity 0.3s ease",
          position: "relative",
        }}
      >
        {/* Complete circle */}
        <button
          onClick={() => handleComplete(c)}
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            border: `1.5px solid ${c.completed ? "#4a7c59" : "#6b5e50"}`,
            backgroundColor: c.completed ? "#4a7c59" : "transparent",
            cursor: "pointer",
            flexShrink: 0,
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {c.completed && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <polyline points="1 3.5 3.5 6 8 1" stroke="#1a1410" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(c.id); if (e.key === "Escape") setEditingId(null); }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #6b5e50",
                  color: "#e8ddd0",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "14px",
                  fontWeight: 300,
                  outline: "none",
                  padding: "2px 0",
                }}
              />
              <button
                onClick={() => handleEditSave(c.id)}
                style={{ background: "none", border: "none", color: "#d4853b", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif" }}
              >
                save
              </button>
              <button
                onClick={() => setEditingId(null)}
                style={{ background: "none", border: "none", color: "#6b5e50", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif" }}
              >
                cancel
              </button>
            </div>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "14px",
                fontWeight: 300,
                color: c.completed ? "#9a8b7a" : "#e8ddd0",
                lineHeight: 1.4,
                textDecoration: c.completed ? "line-through" : "none",
                display: "block",
              }}
            >
              {c.text}
            </span>
          )}

          {!c.completed && !isEditing && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              {c.person_name && (
                <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "#6b5e50" }}>
                  → {c.person_name}
                </span>
              )}
              {c.due_text && (
                <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontStyle: "italic", color: DUE_COLOR[c.priority] }}>
                  {c.due_text}
                </span>
              )}
              {c.priority !== "whenever" && (
                <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: DUE_COLOR[c.priority] }}>
                  {c.priority}
                </span>
              )}
            </div>
          )}

          {/* Delete confirm */}
          {deleteConfirm && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
              <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "#9a8b7a" }}>
                delete this promise?
              </span>
              <button
                onClick={() => handleDelete(c.id)}
                style={{ background: "none", border: "none", color: "#c46b5a", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif" }}
              >
                delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ background: "none", border: "none", color: "#6b5e50", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif" }}
              >
                cancel
              </button>
            </div>
          )}
        </div>

        {/* ··· menu */}
        {!c.completed && (
          <div style={{ position: "relative" }} ref={menuIsOpen ? menuRef : undefined}>
            <button
              onClick={() => { setMenuOpen(menuIsOpen ? null : c.id); setConfirmDelete(null); }}
              style={{
                background: "none",
                border: "none",
                color: "#6b5e50",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
                padding: "0 2px",
                letterSpacing: "1px",
              }}
            >
              ···
            </button>

            {menuIsOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  right: 0,
                  backgroundColor: "#231c14",
                  border: "1px solid #3a2f24",
                  borderRadius: "10px",
                  padding: "6px 0",
                  zIndex: 50,
                  minWidth: "160px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {/* Priority options */}
                <div style={{ padding: "6px 12px 4px" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "10px", color: "#6b5e50", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    priority
                  </span>
                </div>
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePriority(c.id, p.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      background: c.priority === p.value ? "rgba(255,255,255,0.04)" : "none",
                      border: "none",
                      padding: "7px 12px",
                      cursor: "pointer",
                      color: p.color,
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "13px",
                      fontWeight: 300,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>{p.emoji}</span>
                    {p.label}
                    {c.priority === p.value && <span style={{ marginLeft: "auto", fontSize: "10px" }}>✓</span>}
                  </button>
                ))}

                <div style={{ height: "1px", backgroundColor: "#3a2f24", margin: "4px 0" }} />

                <button
                  onClick={() => { setEditingId(c.id); setEditText(c.text); setMenuOpen(null); }}
                  style={{
                    display: "block", width: "100%", background: "none", border: "none",
                    padding: "7px 12px", cursor: "pointer", color: "#9a8b7a",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, textAlign: "left",
                  }}
                >
                  edit
                </button>
                <button
                  onClick={() => { setConfirmDelete(c.id); setMenuOpen(null); }}
                  style={{
                    display: "block", width: "100%", background: "none", border: "none",
                    padding: "7px 12px", cursor: "pointer", color: "#c46b5a",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, textAlign: "left",
                  }}
                >
                  delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
        <div style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "120px" }}>

          {/* Header */}
          <header style={{ textAlign: "center", paddingTop: "52px", paddingBottom: "4px" }}>
            <h1
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "27px",
                fontWeight: 300,
                color: "#e8ddd0",
                margin: "0 0 6px",
                letterSpacing: "-0.2px",
              }}
            >
              promises
            </h1>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px",
                fontWeight: 300,
                color: "#6b5e50",
                margin: 0,
              }}
            >
              not a to-do list — just awareness
            </p>
          </header>

          <BonfireCharacter mood="idle" />

          {/* Summary + add toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: "4px" }}>
            <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "#6b5e50" }}>
              {loading ? "..." : (
                <>
                  <span style={{ color: "#d4853b", fontWeight: 600 }}>{open.length}</span>
                  <span> open · </span>
                  <span style={{ color: "#4a7c59" }}>{done.length}</span>
                  <span> done</span>
                </>
              )}
            </span>
            <button
              onClick={() => setAddOpen((v) => !v)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "12px", color: "#d4853b", padding: 0,
              }}
            >
              {addOpen ? "✕ close" : "+ add"}
            </button>
          </div>

          {/* Inline add form */}
          <div
            style={{
              overflow: "hidden",
              maxHeight: addOpen ? "320px" : "0",
              transition: "max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                ref={textInputRef}
                type="text"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="what did you promise?"
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #3a2f24",
                  color: "#e8ddd0",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "14px",
                  fontWeight: 300,
                  outline: "none",
                  padding: "8px 0",
                  width: "100%",
                }}
              />
              <input
                type="text"
                value={draftPerson}
                onChange={(e) => setDraftPerson(e.target.value)}
                placeholder="→ who's it for? (optional)"
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #3a2f24",
                  color: "#6b5e50",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "12px",
                  fontWeight: 300,
                  outline: "none",
                  padding: "6px 0",
                  width: "100%",
                }}
              />
              <input
                type="text"
                value={draftDue}
                onChange={(e) => setDraftDue(e.target.value)}
                placeholder="by when? (optional)"
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #3a2f24",
                  color: "#6b5e50",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "12px",
                  fontStyle: "italic",
                  fontWeight: 300,
                  outline: "none",
                  padding: "6px 0",
                  width: "100%",
                }}
              />
              {/* Priority pills */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "2px" }}>
                {PRIORITY_OPTIONS.map((p) => {
                  const selected = draftPriority === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setDraftPriority(p.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        padding: "5px 10px", borderRadius: "20px",
                        border: `1px solid ${selected ? p.color + "66" : "#3a2f24"}`,
                        backgroundColor: selected ? p.color + "22" : "transparent",
                        color: selected ? p.color : "#6b5e50",
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "11px", fontWeight: 300, cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "10px" }}>{p.emoji}</span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleAdd}
                  disabled={!draftText.trim() || saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "20px",
                    backgroundColor: "#d4853b",
                    border: "none",
                    color: "#1a1410",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    cursor: !draftText.trim() || saving ? "not-allowed" : "pointer",
                    opacity: !draftText.trim() || saving ? 0.4 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? "saving..." : "save promise"}
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: "1px", backgroundColor: "#3a2f24", margin: "0 20px 0" }} />

          {/* Open commitments */}
          <div style={{ padding: "0 0" }}>
            {!loading && open.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontStyle: "italic", color: "#6b5e50", margin: "0 0 6px" }}>
                  no promises yet
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "#6b5e50", margin: 0 }}>
                  that&apos;s okay — or tap 🔥 to make one
                </p>
              </div>
            ) : (
              sortedOpen.map(renderItem)
            )}
          </div>

          {/* Done section */}
          {done.length > 0 && (
            <div>
              <button
                onClick={() => setShowDone((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "20px 20px 8px",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "11px", fontWeight: 400, color: "#6b5e50",
                  letterSpacing: "1.5px", textTransform: "uppercase",
                }}
              >
                done
                <span style={{ color: "#4a7c59" }}>{done.length}</span>
                <span style={{ fontSize: "10px" }}>{showDone ? "▲" : "▼"}</span>
              </button>
              {showDone && done.map(renderItem)}
            </div>
          )}
        </div>

        <BottomNav />
      </main>
    </PasswordGate>
  );
}
