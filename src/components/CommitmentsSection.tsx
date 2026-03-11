"use client";

import { useState, useEffect, useCallback } from "react";

interface Commitment {
  id: string;
  text: string;
  personName: string | null;
  personId: string | null;
  encounterId: string | null;
  createdAt: string;
}

interface CommitmentsSectionProps {
  onPersonTap: (personId: string) => void;
}

export default function CommitmentsSection({ onPersonTap }: CommitmentsSectionProps) {
  const [items, setItems] = useState<Commitment[]>([]);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCommitments = useCallback(async () => {
    try {
      const res = await fetch("/api/actions");
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCommitments(); }, [fetchCommitments]);

  const handleCheck = async (id: string) => {
    // Optimistic: fade out immediately
    setChecking((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setItems((prev) => prev.filter((c) => c.id !== id));
      setChecking((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, 400);
    await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
  };

  const handleAdd = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.trim() }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [...prev, {
          id: newItem.id,
          text: newItem.text,
          personName: null,
          personId: null,
          encounterId: null,
          createdAt: newItem.created_at,
        }]);
        setDraft("");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // Don't render at all if empty and not adding
  if (items.length === 0 && !adding) {
    return (
      <div style={{ padding: "0 20px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 400, color: "var(--text-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>
            commitments
          </span>
          <button
            onClick={() => setAdding(true)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-faint)", padding: "2px 0" }}
          >
            + add
          </button>
        </div>
        <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-faint)", margin: "6px 0 0", fontStyle: "italic" }}>
          nothing yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px 4px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 400, color: "var(--text-faint)", letterSpacing: "1px", textTransform: "uppercase" }}>
          commitments {items.length > 0 && <span style={{ color: "var(--ember)", marginLeft: "4px" }}>{items.length}</span>}
        </span>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-faint)", padding: "2px 0" }}
          >
            + add
          </button>
        )}
      </div>

      {/* List */}
      {items.map((item) => {
        const fading = checking.has(item.id);
        return (
          <div
            key={item.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: "12px",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              opacity: fading ? 0 : 1,
              transition: "opacity 0.35s ease",
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => handleCheck(item.id)}
              style={{
                width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                border: "1.5px solid var(--border-light)",
                backgroundColor: "transparent",
                cursor: "pointer", marginTop: "1px",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            />

            {/* Text + person */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13.5px", fontWeight: 300, color: "var(--text-soft)", margin: 0, lineHeight: 1.4 }}>
                {item.text}
              </p>
              {item.personName && (
                <button
                  onClick={() => item.personId && onPersonTap(item.personId)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11.5px", color: "var(--text-faint)", marginTop: "2px" }}
                >
                  {item.personName}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Inline add form */}
      {adding && (
        <div style={{ display: "flex", gap: "8px", paddingTop: "10px", alignItems: "center" }}>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setAdding(false); setDraft(""); }
            }}
            placeholder="what did you commit to?"
            style={{
              flex: 1, padding: "9px 12px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "10px",
              color: "var(--text)",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "13px", fontWeight: 300,
              outline: "none",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!draft.trim() || saving}
            style={{
              padding: "9px 14px", borderRadius: "10px",
              backgroundColor: draft.trim() ? "var(--ember)" : "var(--surface)",
              border: "none", cursor: draft.trim() ? "pointer" : "default",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "13px", fontWeight: 400,
              color: draft.trim() ? "white" : "var(--text-faint)",
              transition: "all 0.15s",
            }}
          >
            add
          </button>
          <button
            onClick={() => { setAdding(false); setDraft(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "18px", lineHeight: 1, padding: "0 2px" }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
