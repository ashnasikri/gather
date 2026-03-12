"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PasswordGate from "@/components/PasswordGate";
import BonfireCharacter from "@/components/BonfireCharacter";
import BottomNav from "@/components/BottomNav";

interface Promise {
  id: string;
  text: string;
  done: boolean;
  personId: string | null;
  personName: string | null;
  createdAt: string;
}

export default function CommitmentsPage() {
  const [items, setItems] = useState<Promise[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/actions?all=true");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Listen for BottomNav "i made a promise" signal
  useEffect(() => {
    const handler = () => {
      if (sessionStorage.getItem("gather_open_promise") === "1") {
        sessionStorage.removeItem("gather_open_promise");
        setSheetOpen(true);
      }
    };
    window.addEventListener("gather_open_promise", handler);
    handler();
    return () => window.removeEventListener("gather_open_promise", handler);
  }, []);

  // Autofocus when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setTimeout(() => { setDraft(""); setSaving(false); }, 350);
    }
  }, [sheetOpen]);

  const check = async (id: string, currentDone: boolean) => {
    setChecking((p) => new Set(p).add(id));
    setTimeout(async () => {
      setItems((p) => p.map((i) => i.id === id ? { ...i, done: !currentDone } : i));
      setChecking((p) => { const s = new Set(p); s.delete(id); return s; });
      await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone }),
      });
    }, 280);
  };

  const add = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.trim() }),
      });
      if (res.ok) {
        const n = await res.json();
        setItems((p) => [{ id: n.id, text: n.text, done: false, personId: null, personName: null, createdAt: n.created_at }, ...p]);
        setSheetOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  const renderItem = (item: Promise) => (
    <div
      key={item.id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
        opacity: checking.has(item.id) ? 0.3 : 1,
        transition: "opacity 0.28s ease",
      }}
    >
      <button
        onClick={() => check(item.id, item.done)}
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: `1.5px solid ${item.done ? "var(--sage)" : "var(--border-light)"}`,
          backgroundColor: item.done ? "var(--sage)" : "transparent",
          cursor: "pointer",
          flexShrink: 0,
          marginTop: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
      >
        {item.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <polyline points="1 4 4 7 9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "14px",
            fontWeight: 300,
            color: item.done ? "var(--text-faint)" : "var(--text-soft)",
            lineHeight: 1.5,
            textDecoration: item.done ? "line-through" : "none",
          }}
        >
          {item.text}
        </span>
        {item.personName && (
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "11.5px",
              color: "var(--text-faint)",
              marginTop: "2px",
            }}
          >
            {item.personName}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <PasswordGate>
      <main
        style={{
          maxWidth: "430px",
          margin: "0 auto",
          minHeight: "100dvh",
          backgroundColor: "var(--bg)",
          position: "relative",
        }}
      >
        <div style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "120px" }}>
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
              promises
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
              {loading ? "..." : open.length > 0 ? `${open.length} open` : "you're all clear"}
            </p>
          </header>

          <BonfireCharacter mood="idle" />

          <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "16px 20px 0" }} />

          {/* Section header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 0" }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "11px",
                fontWeight: 400,
                color: "var(--text-faint)",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
              }}
            >
              open
              {open.length > 0 && (
                <span style={{ color: "var(--ember)", marginLeft: "5px" }}>{open.length}</span>
              )}
            </span>
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "12px",
                color: "var(--text-faint)",
                padding: 0,
              }}
            >
              + add
            </button>
          </div>

          <div style={{ padding: "0 20px" }}>
            {!loading && open.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "var(--text-faint)",
                  fontStyle: "italic",
                  padding: "12px 0",
                  margin: 0,
                }}
              >
                nothing open
              </p>
            ) : (
              open.map(renderItem)
            )}
          </div>

          {/* Done section */}
          {done.length > 0 && (
            <div style={{ padding: "20px 20px 0" }}>
              <button
                onClick={() => setShowDone((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "11px",
                  fontWeight: 400,
                  color: "var(--text-faint)",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                kept
                <span style={{ color: "var(--sage)" }}>{done.length}</span>
                <span style={{ fontSize: "10px" }}>{showDone ? "▲" : "▼"}</span>
              </button>
              {showDone && (
                <div style={{ marginTop: "4px" }}>
                  {done.map(renderItem)}
                </div>
              )}
            </div>
          )}
        </div>

        <BottomNav />

        {/* Add sheet backdrop */}
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,12,10,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 99,
            opacity: sheetOpen ? 1 : 0,
            pointerEvents: sheetOpen ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Add sheet */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: `translateX(-50%) translateY(${sheetOpen ? "0" : "100%"})`,
            width: "100%",
            maxWidth: "430px",
            backgroundColor: "var(--bg-soft)",
            borderRadius: "22px 22px 0 0",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            paddingBottom: "env(safe-area-inset-bottom, 24px)",
          }}
        >
          {/* Handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "14px", paddingBottom: "4px" }}>
            <div style={{ width: "28px", height: "3.5px", borderRadius: "2px", backgroundColor: "var(--text-faint)", opacity: 0.35 }} />
          </div>

          <div style={{ padding: "12px 24px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: "var(--font-newsreader), Georgia, serif",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "var(--text)",
                  margin: "0 0 6px",
                }}
              >
                i made a promise
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "var(--text-quiet)",
                  margin: 0,
                }}
              >
                what did you commit to?
              </p>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setSheetOpen(false); }}
              placeholder="e.g. send alex the article, call mum this week..."
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--text)",
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontWeight: 300,
                outline: "none",
                fontSize: "14px",
                padding: "14px",
                width: "100%",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={add}
                disabled={!draft.trim() || saving}
                style={{
                  padding: "11px 28px",
                  borderRadius: "20px",
                  backgroundColor: "var(--ember)",
                  border: "none",
                  color: "white",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "13.5px",
                  fontWeight: 400,
                  cursor: !draft.trim() || saving ? "not-allowed" : "pointer",
                  opacity: !draft.trim() || saving ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {saving ? "saving..." : "keep my word 🤝"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </PasswordGate>
  );
}
