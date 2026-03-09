"use client";

import { useState, useEffect, useRef } from "react";
import { EncounterType } from "@/lib/types";

type Tab = "story" | "intel" | "actions";

interface Encounter {
  id: string;
  type: EncounterType;
  date: string;
  time: string;
  summary: string;
  full_text?: string;
  energy?: number;
  category?: string;
  created_at: string;
}

interface Note {
  id: string;
  text: string;
  created_at: string;
}

interface Action {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
}

interface Link {
  id: string;
  url: string;
  title?: string;
  source?: string;
  summary?: string;
  created_at: string;
}

interface PersonData {
  person: {
    id: string;
    name: string;
    city?: string;
    context?: string;
    first_met_date?: string;
    created_at: string;
  };
  encounters: Encounter[];
  notes: Note[];
  actions: Action[];
  links: Link[];
}

interface PersonProfileProps {
  personId: string | null;
  open: boolean;
  onClose: () => void;
}

const typeEmoji: Record<EncounterType, string> = {
  coffee: "☕", call: "📞", event: "✦", dm: "💬", bumped: "👋",
};

const energyColor = (v: number) => {
  if (v < 30) return "var(--rose)";
  if (v < 50) return "#C49860";
  if (v < 70) return "var(--text-soft)";
  return "var(--sage)";
};

function EnergyBar({ value }: { value: number }) {
  return (
    <div style={{ width: "28px", height: "4px", borderRadius: "2px", backgroundColor: "var(--surface-light)", overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", backgroundColor: energyColor(value), borderRadius: "2px", transition: "width 0.3s ease" }} />
    </div>
  );
}

export default function PersonProfile({ personId, open, onClose }: PersonProfileProps) {
  const [data, setData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("story");

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // City editing
  const [editingCity, setEditingCity] = useState(false);
  const [cityValue, setCityValue] = useState("");
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Note adding
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // Link adding
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  // Actions optimistic state
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    if (!open || !personId) return;
    setTab("story");
    setData(null);
    setLoading(true);
    setShowNoteInput(false);
    setShowLinkInput(false);
    setSelectedNote(null);
    setNoteInput("");
    setLinkInput("");

    fetch(`/api/people/${personId}`)
      .then((r) => r.json())
      .then((d: PersonData) => {
        setData(d);
        setNameValue(d.person.name);
        setCityValue(d.person.city ?? "");
        setActions(d.actions);
      })
      .finally(() => setLoading(false));
  }, [open, personId]);

  // Sync actions when data loads
  useEffect(() => {
    if (data) setActions(data.actions);
  }, [data]);

  // Focus name input when editing
  useEffect(() => {
    if (editingName) setTimeout(() => nameInputRef.current?.focus(), 60);
  }, [editingName]);

  // Focus city input when editing
  useEffect(() => {
    if (editingCity) setTimeout(() => cityInputRef.current?.focus(), 60);
  }, [editingCity]);

  const saveCity = async () => {
    setEditingCity(false);
    if (!data) return;
    const trimmed = cityValue.trim();
    if (trimmed === (data.person.city ?? "")) return;
    await fetch(`/api/people/${data.person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: trimmed || null }),
    });
    setData((prev) => prev ? { ...prev, person: { ...prev.person, city: trimmed || undefined } } : prev);
  };

  const saveName = async () => {
    if (!data || !nameValue.trim() || nameValue === data.person.name) {
      setEditingName(false);
      return;
    }
    await fetch(`/api/people/${data.person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue.trim() }),
    });
    setData((prev) => prev ? { ...prev, person: { ...prev.person, name: nameValue.trim() } } : prev);
    setEditingName(false);
  };

  const toggleAction = async (actionId: string, current: boolean) => {
    // Optimistic
    setActions((prev) => prev.map((a) => a.id === actionId ? { ...a, done: !current } : a));
    const res = await fetch(`/api/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !current }),
    });
    if (!res.ok) setActions((prev) => prev.map((a) => a.id === actionId ? { ...a, done: current } : a));
  };

  const addNote = async () => {
    if (!data || !noteInput.trim()) return;
    const optimistic: Note = { id: `tmp-${Date.now()}`, text: noteInput.trim(), created_at: new Date().toISOString() };
    setData((prev) => prev ? { ...prev, notes: [optimistic, ...prev.notes] } : prev);
    setNoteInput("");
    setShowNoteInput(false);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: data.person.id, text: optimistic.text }),
    });
    const saved = await res.json();
    setData((prev) => prev ? { ...prev, notes: prev.notes.map((n) => n.id === optimistic.id ? saved : n) } : prev);
  };

  const deleteNote = async (noteId: string) => {
    setData((prev) => prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) } : prev);
    setSelectedNote(null);
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
  };

  const addLink = async () => {
    if (!data || !linkInput.trim()) return;
    await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personName: data.person.name, url: linkInput.trim() }),
    });
    setLinkInput("");
    setShowLinkInput(false);
    // Refresh
    const r = await fetch(`/api/people/${data.person.id}`);
    const d: PersonData = await r.json();
    setData(d);
  };

  const sortedActions = [
    ...actions.filter((a) => !a.done),
    ...actions.filter((a) => a.done),
  ];

  const metaDot = (
    <span style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--text-faint)", display: "inline-block", margin: "0 6px", verticalAlign: "middle" }} />
  );

  const sectionLabel = (text: string) => (
    <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 400, color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "10px" }}>
      {text}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(15,12,10,0.8)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          zIndex: 199,
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
          zIndex: 200,
          maxHeight: "85vh",
          display: "flex", flexDirection: "column",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "14px", flexShrink: 0 }}>
          <div style={{ width: "28px", height: "3.5px", borderRadius: "2px", backgroundColor: "var(--text-faint)", opacity: 0.35 }} />
        </div>

        {loading && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: "var(--text-faint)", margin: 0 }}>
              gathering their world...
            </p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Header */}
            <div style={{ padding: "18px 24px 0", flexShrink: 0 }}>
              {/* Name */}
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif",
                    fontSize: "23px", fontWeight: 400, color: "var(--text)",
                    background: "none", border: "none", borderBottom: "1px solid var(--ember)",
                    outline: "none", width: "100%", padding: "0 0 2px",
                  }}
                />
              ) : (
                <h2
                  onClick={() => setEditingName(true)}
                  style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif",
                    fontSize: "23px", fontWeight: 400, color: "var(--text)",
                    margin: "0 0 8px", cursor: "text",
                  }}
                >
                  {data.person.name}
                </h2>
              )}

              {/* Meta row */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginBottom: "14px", gap: "2px" }}>
                {/* City — editable */}
                {editingCity ? (
                  <input
                    ref={cityInputRef}
                    value={cityValue}
                    onChange={(e) => setCityValue(e.target.value)}
                    onBlur={saveCity}
                    onKeyDown={(e) => e.key === "Enter" && saveCity()}
                    placeholder="add city..."
                    style={{
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "12px", color: "var(--text)",
                      background: "none", border: "none",
                      borderBottom: "1px solid var(--ember)",
                      outline: "none", padding: "0 0 1px", width: "100px",
                    }}
                  />
                ) : (
                  <>
                    <span
                      onClick={() => setEditingCity(true)}
                      style={{
                        fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                        fontSize: "12px",
                        color: data.person.city ? "var(--text-quiet)" : "var(--text-faint)",
                        cursor: "text",
                        fontStyle: data.person.city ? "normal" : "italic",
                      }}
                    >
                      {data.person.city || "add city"}
                    </span>
                    {metaDot}
                  </>
                )}
                {data.person.first_met_date && (
                  <>
                    <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-quiet)" }}>
                      first met {new Date(data.person.first_met_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {metaDot}
                  </>
                )}
                <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-quiet)" }}>
                  {data.encounters.length} {data.encounters.length === 1 ? "encounter" : "encounters"}
                </span>
              </div>

              {/* Context box */}
              {data.person.context && (
                <div style={{
                  padding: "12px 14px", borderRadius: "12px",
                  backgroundColor: "var(--ember-glow)",
                  borderLeft: "2px solid rgba(224,120,64,0.13)",
                  marginBottom: "16px",
                }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "14px", fontWeight: 300, color: "var(--text-soft)", margin: 0, lineHeight: 1.6 }}>
                    {data.person.context}
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div style={{
                display: "flex", gap: "3px",
                backgroundColor: "var(--surface)", borderRadius: "12px", padding: "3px",
                marginBottom: "16px",
              }}>
                {(["story", "intel", "actions"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: "10px",
                      backgroundColor: tab === t ? "var(--surface-light)" : "transparent",
                      border: "none", cursor: "pointer",
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "12px", fontWeight: tab === t ? 500 : 300,
                      color: tab === t ? "var(--text)" : "var(--text-quiet)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable tab content */}
            <div style={{ overflowY: "auto", flex: 1, padding: "0 24px 32px" }}>

              {/* ── STORY TAB ── */}
              {tab === "story" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {data.encounters.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text-quiet)", textAlign: "center", padding: "32px 0", fontStyle: "italic" }}>
                      your story with {data.person.name} starts here
                    </p>
                  ) : (
                    data.encounters.map((enc) => (
                      <div key={enc.id} style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                        {/* Top row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "14px" }}>{typeEmoji[enc.type as EncounterType]}</span>
                            <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", fontWeight: 300, color: "var(--text-quiet)" }}>
                              {enc.date} · {enc.time}
                            </span>
                            {enc.category && (
                              <span style={{
                                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                                fontSize: "10px", color: "var(--text-faint)",
                                backgroundColor: "var(--surface)", padding: "2px 7px", borderRadius: "8px",
                              }}>
                                {enc.category}
                              </span>
                            )}
                          </div>
                          {enc.energy != null && <EnergyBar value={enc.energy} />}
                        </div>
                        {/* Summary */}
                        <p style={{
                          fontFamily: "var(--font-newsreader), Georgia, serif",
                          fontSize: "14px", fontWeight: 300, fontStyle: "italic",
                          color: "var(--text-soft)", margin: 0, lineHeight: 1.65,
                        }}>
                          {enc.full_text || enc.summary}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── INTEL TAB ── */}
              {tab === "intel" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                  {/* Saved Links */}
                  <div>
                    {sectionLabel("Saved Links")}
                    {data.links.length === 0 && !showLinkInput && (
                      <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-faint)", fontStyle: "italic", margin: "0 0 12px" }}>
                        no links yet
                      </p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                      {data.links.map((link) => (
                        <div key={link.id} style={{ backgroundColor: "var(--surface)", padding: "11px 14px", borderRadius: "12px" }}>
                          <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13.5px", fontWeight: 400, color: "var(--text)", marginBottom: link.source || link.summary ? "4px" : 0 }}>
                            {link.title || link.url}
                          </div>
                          {link.source && (
                            <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", color: "var(--ember)", marginBottom: link.summary ? "4px" : 0 }}>
                              {link.source}
                            </div>
                          )}
                          {link.summary && (
                            <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.5 }}>
                              {link.summary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {showLinkInput ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="url"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addLink()}
                          placeholder="https://..."
                          autoFocus
                          style={{
                            flex: 1, padding: "9px 12px",
                            backgroundColor: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: "10px", color: "var(--text)",
                            fontFamily: "ui-monospace, monospace", fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <button onClick={addLink} style={{ padding: "9px 16px", borderRadius: "10px", backgroundColor: "var(--ember)", border: "none", color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", cursor: "pointer" }}>
                          add
                        </button>
                        <button onClick={() => setShowLinkInput(false)} style={{ padding: "9px 12px", borderRadius: "10px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-faint)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowLinkInput(true)}
                        style={{
                          width: "100%", padding: "9px 0", borderRadius: "12px",
                          backgroundColor: "transparent",
                          border: "1px dashed var(--border-light)",
                          color: "var(--text-quiet)",
                          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                          fontSize: "12.5px", fontWeight: 300, cursor: "pointer",
                        }}
                      >
                        + drop a link
                      </button>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    {sectionLabel("Things You Know")}
                    {data.notes.length === 0 && !showNoteInput && (
                      <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-faint)", fontStyle: "italic", margin: "0 0 12px" }}>
                        drop links and notes to remember what matters about {data.person.name}
                      </p>
                    )}
                    <div style={{ marginBottom: "10px" }}>
                      {data.notes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => setSelectedNote(selectedNote === note.id ? null : note.id)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "9px 0", borderBottom: "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13.5px", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.5 }}>
                            {note.text}
                          </span>
                          {selectedNote === note.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                              style={{ background: "none", border: "none", color: "var(--rose)", fontSize: "13px", cursor: "pointer", padding: "0 0 0 12px", flexShrink: 0 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {showNoteInput ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addNote()}
                          placeholder="something to remember..."
                          autoFocus
                          style={{
                            flex: 1, padding: "9px 12px",
                            backgroundColor: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: "10px", color: "var(--text)",
                            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13.5px", fontWeight: 300,
                            outline: "none",
                          }}
                        />
                        <button onClick={addNote} style={{ padding: "9px 16px", borderRadius: "10px", backgroundColor: "var(--ember)", border: "none", color: "white", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", cursor: "pointer" }}>
                          add
                        </button>
                        <button onClick={() => setShowNoteInput(false)} style={{ padding: "9px 12px", borderRadius: "10px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-faint)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNoteInput(true)}
                        style={{
                          width: "100%", padding: "9px 0", borderRadius: "12px",
                          backgroundColor: "transparent", border: "1px dashed var(--border-light)",
                          color: "var(--text-quiet)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                          fontSize: "12.5px", fontWeight: 300, cursor: "pointer",
                        }}
                      >
                        + add a note
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── ACTIONS TAB ── */}
              {tab === "actions" && (
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontStyle: "italic", fontWeight: 300, color: "var(--text-quiet)", margin: "0 0 16px" }}>
                    open threads — no rush
                  </p>

                  {sortedActions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔥</div>
                      <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-faint)", margin: 0 }}>
                        no open threads with {data.person.name}
                      </p>
                    </div>
                  ) : (
                    sortedActions.map((action) => (
                      <div
                        key={action.id}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "11px 0", borderBottom: "1px solid var(--border)",
                          opacity: action.done ? 0.45 : 1, transition: "opacity 0.2s",
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleAction(action.id, action.done)}
                          style={{
                            width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                            border: `1.5px solid ${action.done ? "var(--sage)" : "var(--text-quiet)"}`,
                            backgroundColor: action.done ? "var(--sage-soft)" : "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {action.done && <span style={{ fontSize: "10px", color: "var(--sage)" }}>✓</span>}
                        </button>
                        {/* Text */}
                        <span style={{
                          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                          fontSize: "14px", fontWeight: 300, color: "var(--text)",
                          textDecoration: action.done ? "line-through" : "none",
                          flex: 1,
                        }}>
                          {action.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
