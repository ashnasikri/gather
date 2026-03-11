"use client";

import { useState, useEffect, useCallback } from "react";

interface Commitment {
  id: string;
  text: string;
  personName: string | null;
  personId: string | null;
}

const PREVIEW_COUNT = 2;

export default function CommitmentsSection({ onPersonTap }: { onPersonTap: (id: string) => void }) {
  const [items, setItems] = useState<Commitment[]>([]);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/actions");
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const check = async (id: string) => {
    setChecking((p) => new Set(p).add(id));
    setTimeout(() => {
      setItems((p) => p.filter((c) => c.id !== id));
      setChecking((p) => { const s = new Set(p); s.delete(id); return s; });
    }, 380);
    await fetch(`/api/actions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: true }) });
  };

  const add = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: draft.trim() }) });
      if (res.ok) {
        const n = await res.json();
        setItems((p) => [...p, { id: n.id, text: n.text, personName: null, personId: null }]);
        setDraft(""); setAdding(false);
      }
    } finally { setSaving(false); }
  };

  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hidden = items.length - PREVIEW_COUNT;

  return (
    <div style={{ padding: "20px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: items.length > 0 || adding ? "10px" : "6px" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 400, color: "var(--text-faint)", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          commitments{items.length > 0 && <span style={{ color: "var(--ember)", marginLeft: "5px" }}>{items.length}</span>}
        </span>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-faint)", padding: 0 }}>
            + add
          </button>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-faint)", fontStyle: "italic", margin: 0 }}>
          nothing yet
        </p>
      )}

      {visible.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0", borderBottom: "1px solid var(--border)", opacity: checking.has(item.id) ? 0 : 1, transition: "opacity 0.35s ease" }}>
          <button
            onClick={() => check(item.id)}
            style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1.5px solid var(--border-light)", background: "none", cursor: "pointer", flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13.5px", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.4 }}>{item.text}</span>
            {item.personName && (
              <button onClick={() => item.personId && onPersonTap(item.personId)} style={{ display: "block", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11.5px", color: "var(--text-faint)", marginTop: "1px" }}>
                {item.personName}
              </button>
            )}
          </div>
        </div>
      ))}

      {hidden > 0 && !adding && (
        <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-faint)", padding: "6px 0 0", display: "block" }}>
          {expanded ? "show less" : `+${hidden} more`}
        </button>
      )}

      {adding && (
        <div style={{ display: "flex", gap: "8px", paddingTop: "8px", alignItems: "center" }}>
          <input
            autoFocus type="text" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") { setAdding(false); setDraft(""); } }}
            placeholder="what did you commit to?"
            style={{ flex: 1, padding: "8px 12px", backgroundColor: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: "10px", color: "var(--text)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, outline: "none" }}
          />
          <button onClick={add} disabled={!draft.trim()} style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: draft.trim() ? "var(--ember)" : "var(--surface)", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: draft.trim() ? "white" : "var(--text-faint)", transition: "all 0.15s" }}>add</button>
          <button onClick={() => { setAdding(false); setDraft(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "18px", lineHeight: 1 }}>×</button>
        </div>
      )}
    </div>
  );
}
