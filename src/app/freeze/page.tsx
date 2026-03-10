"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  label: string;
  text: string;
}

interface Category {
  id: string;
  name: string;
  accent: string;
  messages: Message[];
}

const CATEGORIES: Category[] = [
  {
    id: "close",
    name: "close friends & family",
    accent: "#7EA67A",
    messages: [
      {
        id: "close-1",
        label: "the honest one",
        text: "Hey — I'm having one of those days where I've gone quiet and I can't seem to come back. It's not you. You matter to me. I just need a little time and I'll reach out when I'm back.",
      },
      {
        id: "close-2",
        label: "the shorter one",
        text: "I'm in a freeze moment. Not ignoring you — just can't words right now. I'll come back to this. ❤️",
      },
      {
        id: "close-3",
        label: "the gentle check-in reply",
        text: "Thank you for checking in. I'm okay — just in a low-capacity stretch. I don't want you to feel like you don't matter because you really do. Can I get back to you in a couple of days?",
      },
    ],
  },
  {
    id: "work",
    name: "work colleagues & collaborators",
    accent: "#6B8BA6",
    messages: [
      {
        id: "work-1",
        label: "the professional-but-real one",
        text: "Hi — I'm running behind on replies and I wanted to flag that rather than go silent. I'll get back to you by [day]. Appreciate your patience.",
      },
      {
        id: "work-2",
        label: "the capacity one",
        text: "Hey, just a heads up — I'm at low capacity this week and responses may be slow. Didn't want you to read into the silence. I'll circle back soon.",
      },
      {
        id: "work-3",
        label: "the rescheduling one",
        text: "I need to be honest — I'm not in the headspace to give this the attention it deserves right now. Can we push this to [day]? I want to show up properly for it.",
      },
    ],
  },
  {
    id: "casual",
    name: "acquaintances & casual connections",
    accent: "#A6896B",
    messages: [
      {
        id: "casual-1",
        label: "the light one",
        text: "Hey! Sorry for the slow reply — I've been in my cave for a bit. Still here though. What were you saying?",
      },
      {
        id: "casual-2",
        label: "the social plans one",
        text: "I'm going to have to sit this one out — I'm running on empty and I'd rather be upfront than flake last minute. Rain check?",
      },
    ],
  },
  {
    id: "repair",
    name: "when someone's hurt by the silence",
    accent: "#A66B80",
    messages: [
      {
        id: "repair-1",
        label: "the repair one",
        text: "I owe you a response and I'm sorry it's been so long. When I get overwhelmed I go quiet — and it has nothing to do with how much you mean to me. I should have sent something sooner. I'm here now.",
      },
      {
        id: "repair-2",
        label: "the pattern-acknowledging one",
        text: "I know I do this — I disappear when things feel like too much. I'm working on it. You deserved better than silence and I'm sorry. Can we talk?",
      },
    ],
  },
];

const STORAGE_KEY = "gather_freeze_edits";

// ─── Day placeholder highlighter ──────────────────────────────────────────────

function MessageText({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/(\[day\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part === "[day]" ? (
          <span
            key={i}
            style={{
              color: accent,
              opacity: 0.9,
              fontStyle: "normal",
            }}
          >
            [day]
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Message Card ──────────────────────────────────────────────────────────────

interface MessageCardProps {
  message: Message;
  accent: string;
  editedText: string;
  onEdit: (id: string, text: string) => void;
  animIndex: number;
}

function MessageCard({ message, accent, editedText, onEdit, animIndex }: MessageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(editedText);
  const [copied, setCopied] = useState(false);

  // Keep draft in sync if external edits come in (e.g. on mount from localStorage)
  useEffect(() => {
    if (!isEditing) setDraft(editedText);
  }, [editedText, isEditing]);

  const handleDone = () => {
    onEdit(message.id, draft);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = draft;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "12px",
        padding: "18px 20px",
        marginBottom: "10px",
        animationDelay: `${animIndex * 40}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
          fontSize: "11px",
          fontWeight: 500,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: "10px",
        }}
      >
        {message.label}
      </div>

      {/* Message text or textarea */}
      {isEditing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            backgroundColor: "var(--surface-light)",
            border: `1px solid ${accent}4D`, // 30% opacity = 4D in hex
            borderRadius: "8px",
            padding: "12px",
            fontFamily: "var(--font-newsreader), Georgia, serif",
            fontSize: "15px",
            fontWeight: 300,
            color: "var(--text-soft)",
            lineHeight: 1.65,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <p
          style={{
            fontFamily: "var(--font-newsreader), Georgia, serif",
            fontSize: "15px",
            fontWeight: 300,
            color: "var(--text-soft)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          <MessageText text={draft} accent={accent} />
        </p>
      )}

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "14px",
        }}
      >
        <button
          onClick={() => (isEditing ? handleDone() : setIsEditing(true))}
          style={{
            background: "none",
            border: "1px solid var(--border-light)",
            borderRadius: "8px",
            padding: "6px 14px",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12px",
            color: "var(--text-quiet)",
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          {isEditing ? "done" : "edit"}
        </button>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? accent : "none",
            border: `1px solid ${copied ? accent : "var(--border-light)"}`,
            borderRadius: "8px",
            padding: "6px 14px",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12px",
            color: copied ? "white" : "var(--text-quiet)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FreezePage() {
  // edits: { [messageId]: string }
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEdits(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const handleEdit = useCallback(
    (id: string, text: string) => {
      const next = { ...edits, [id]: text };
      setEdits(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [edits]
  );

  const getTextFor = (msg: Message) => edits[msg.id] ?? msg.text;

  if (!mounted) return null;

  let cardIndex = 0;

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
        <div
          style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "60px" }}
        >
          {/* Back link */}
          <div style={{ padding: "20px 20px 0" }}>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px",
                fontWeight: 300,
                color: "var(--text-soft)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ← back to the fire
            </Link>
          </div>

          {/* Header */}
          <header
            className="animate-fade-in"
            style={{ textAlign: "center", padding: "32px 24px 20px" }}
          >
            {/* Sleepy bonfire sprite */}
            <div style={{ marginBottom: "20px", opacity: 0.6 }}>
              <Image
                src="/sprites/sleepy-removebg-preview.png"
                alt="a gentle fire, resting"
                width={319}
                height={782}
                style={{ height: "60px", width: "auto" }}
                priority
              />
            </div>

            <h1
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "24px",
                fontWeight: 300,
                color: "var(--text)",
                margin: "0 0 12px",
                lineHeight: 1.3,
              }}
            >
              it&apos;s okay. you&apos;re here.
            </h1>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px",
                fontWeight: 300,
                color: "var(--text-quiet)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              pick a message. edit it if you want. send it. that&apos;s enough.
            </p>

            {/* Divider */}
            <div
              style={{
                width: "40px",
                height: "1px",
                backgroundColor: "var(--text-faint)",
                opacity: 0.3,
                margin: "20px auto 0",
              }}
            />
          </header>

          {/* Reminders box */}
          <div style={{ padding: "0 16px", marginBottom: "32px" }}>
            <div
              className="animate-fade-in"
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: "14px",
                padding: "20px 24px",
                animationDelay: "80ms",
                animationFillMode: "both",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "14px",
                }}
              >
                reminders
              </div>
              {[
                "we move at the pace of safety, but we move.",
                "let people see your messy — your humanity.",
                "responding with something tells them: you matter, but it's me, not you.",
                "less guilt. less ghosting. more truth.",
              ].map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif",
                    fontSize: "14.5px",
                    fontStyle: "italic",
                    fontWeight: 300,
                    color: "var(--text-soft)",
                    lineHeight: 1.65,
                    margin: 0,
                    padding: "5px 0",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div style={{ padding: "0 16px" }}>
            {CATEGORIES.map((cat) => (
              <div key={cat.id} style={{ marginBottom: "36px" }}>
                {/* Category header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  {/* Color dot */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: cat.accent,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-newsreader), Georgia, serif",
                      fontSize: "17px",
                      fontWeight: 400,
                      color: "var(--text-soft)",
                    }}
                  >
                    {cat.name}
                  </span>
                </div>

                {/* Messages */}
                {cat.messages.map((msg) => {
                  const idx = cardIndex++;
                  return (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      accent={cat.accent}
                      editedText={getTextFor(msg)}
                      onEdit={handleEdit}
                      animIndex={idx + 3} // offset past header animations
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer
            style={{
              textAlign: "center",
              padding: "32px 24px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "14px",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--text-faint)",
                lineHeight: 1.6,
                margin: "0 0 6px",
              }}
            >
              sending something imperfect is always better than sending nothing.
            </p>
            <p
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "14px",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--text-faint)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              the message doesn&apos;t have to be perfect. it just has to be sent.
            </p>
          </footer>
        </div>
      </main>
    </PasswordGate>
  );
}
