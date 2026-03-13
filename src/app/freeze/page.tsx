"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";

// ─── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "swamped",
    name: "Swamped with work",
    accent: "#8B9E6B",
    messages: [
      { label: "The straightforward one", text: "Hey — I've been underwater with work and my replies have suffered. Not ignoring you, just genuinely buried. Surfacing soon." },
      { label: "The lighter one", text: "Work has eaten my brain this week. I owe you a proper reply and you're getting one — just not today. Bear with me?" },
      { label: "The honest-about-capacity one", text: "I've been in heads-down work mode and everything else has slipped. You're not forgotten — I'm just bad at doing both at once. I'll come up for air soon." },
      { label: "The short one", text: "Buried in work right now. Will reply properly when I come up for air. Sorry for the quiet." },
    ],
  },
  {
    id: "saw-it",
    name: "I saw it, will respond properly later",
    accent: "#6B8B9E",
    messages: [
      { label: "The quick acknowledgment", text: "Saw this — want to give it a real reply when I have a minute. Didn't want you wondering." },
      { label: "The warm one", text: "Read this and I'm sitting with it. Don't have the headspace to reply properly right now but I will. Just wanted you to know I saw it." },
      { label: "The casual one", text: "Noted and not forgotten — just can't brain a good reply right now. Coming back to this." },
      { label: "The shortest possible", text: "Seen. Replying soon. ❤️" },
    ],
  },
  {
    id: "close",
    name: "Close friends & family",
    accent: "#7B9E6B",
    messages: [
      { label: "The honest one", text: "Hey — I'm having one of those days where I've gone quiet and I can't seem to come back. It's not you. You matter to me. I just need a little time and I'll reach out when I'm back." },
      { label: "The shorter one", text: "I'm in a freeze moment. Not ignoring you — just can't words right now. I'll come back to this. ❤️" },
      { label: "The gentle check-in reply", text: "Thank you for checking in. I'm okay — just in a low-capacity stretch. I don't want you to feel like you don't matter because you really do. Can I get back to you in a couple of days?" },
      { label: "The 'I saw your message' one", text: "I read this and I want to give it a real reply but I don't have it in me right now. Didn't want you sitting there wondering if I saw it. I did. I'll respond properly soon." },
    ],
  },
  {
    id: "work",
    name: "Work colleagues & collaborators",
    accent: "#6B7F9E",
    messages: [
      { label: "The professional-but-real one", text: "Hi — I'm running behind on replies and I wanted to flag that rather than go silent. I'll get back to you by [day]. Appreciate your patience." },
      { label: "The capacity one", text: "Hey, just a heads up — I'm at low capacity this week and responses may be slow. Didn't want you to read into the silence. I'll circle back soon." },
      { label: "The rescheduling one", text: "I need to be honest — I'm not in the headspace to give this the attention it deserves right now. Can we push this to [day]? I want to show up properly for it." },
      { label: "The 'I dropped the ball' one", text: "I owe you a follow-up on this and I'm sorry it slipped. I'm on it now — you'll have it by [day]. Thanks for your patience with me." },
    ],
  },
  {
    id: "casual",
    name: "Acquaintances & casual connections",
    accent: "#9E7F6B",
    messages: [
      { label: "The light one", text: "Hey! Sorry for the slow reply — I've been in my cave for a bit. Still here though. What were you saying?" },
      { label: "The social plans one", text: "I'm going to have to sit this one out — I'm running on empty and I'd rather be upfront than flake last minute. Rain check?" },
      { label: "The group chat one", text: "I've been lurking and not replying — not checked out, just low on social battery. Catching up on everything now." },
    ],
  },
  {
    id: "repair",
    name: "When someone's hurt by the silence",
    accent: "#9E6B7F",
    messages: [
      { label: "The repair one", text: "I owe you a response and I'm sorry it's been so long. When I get overwhelmed I go quiet — and it has nothing to do with how much you mean to me. I should have sent something sooner. I'm here now." },
      { label: "The pattern-acknowledging one", text: "I know I do this — I disappear when things feel like too much. I'm working on it. You deserved better than silence and I'm sorry. Can we talk?" },
      { label: "The 'it's been weeks' one", text: "I've been meaning to reply for so long that the guilt of not replying became its own wall. That's not fair to you. I'm sorry. The delay was never about how I feel about you — it was about how I was feeling inside." },
    ],
  },
  {
    id: "vulnerable",
    name: "When someone shared something vulnerable",
    accent: "#7B6B9E",
    messages: [
      { label: "The 'I care but I froze' one", text: "I want you to know I read what you shared and it meant a lot that you trusted me with it. I went quiet not because I didn't care but because I wanted to say the right thing and then froze. I'm here. How are you feeling now?" },
      { label: "The 'I don't have words but I'm here' one", text: "I don't have the right words for what you're going through but I didn't want my silence to feel like I don't care. I care. I'm just not great at showing it in words sometimes. I'm here if you need me." },
    ],
  },
  {
    id: "overcommitted",
    name: "When you said yes but can't follow through",
    accent: "#9E956B",
    messages: [
      { label: "The honest backtrack", text: "I said yes to this but I need to be honest — I overcommitted and I can't do it justice right now. I'd rather tell you now than disappear on it. I'm sorry." },
      { label: "The partial delivery", text: "I haven't been able to get to this fully yet but I wanted to check in rather than go quiet. Here's where I'm at: [status]. Can I have until [day] for the rest?" },
      { label: "The boundary one", text: "I've been thinking about it and I need to pull back from this. I know the timing isn't ideal but I'd rather be upfront than overextend and let you down. Can we figure out a different plan?" },
    ],
  },
  {
    id: "persistent",
    name: "When someone's been consistently reaching out",
    accent: "#6B9E95",
    messages: [
      { label: "The gratitude one", text: "I know you've reached out a few times and I haven't responded. That's not okay and I see you. Thank you for not giving up on me. I'm coming back around." },
      { label: "The 'please don't stop' one", text: "I know I've been terrible at replying. Please don't take it as a signal to stop reaching out — your messages actually help even when I can't respond. I'll get there." },
    ],
  },
  {
    id: "birthday",
    name: "Birthday / celebration / big news you missed",
    accent: "#9E6B6B",
    messages: [
      { label: "The belated one", text: "I'm late on this and I'm sorry — but please know I'm genuinely happy for you. My silence wasn't indifference, it was me being in my own fog. Congratulations, for real. Tell me everything." },
      { label: "The birthday one", text: "I know your birthday was [time ago] and I hate that I missed it. You deserved to hear from me and I dropped the ball. Happy belated — I hope it was wonderful. ❤️" },
    ],
  },
  {
    id: "selftalk",
    name: "Self-talk — messages to yourself",
    accent: "#8B8B8B",
    messages: [
      { label: "The reparenting one", text: "I'm here for you. The freeze is a pattern, not a truth about who you are. You're allowed to move slowly. You're allowed to send the imperfect message. You are not in danger." },
      { label: "The permission slip", text: "You don't have to reply to everything today. Pick one. Just one. The smallest one. Send the shortest message in your kit. That's enough for now." },
      { label: "The self-compassion one", text: "The guilt you feel about not replying is proof that you care. You are not a bad person. You're a person whose nervous system is doing what it learned to do. And you're working on a new way." },
      { label: "The Juan reminder", text: "We are not endangered anymore. We move at the pace of safety, but we move. Sending something imperfect is the move." },
    ],
  },
];

const JUAN_WISDOM = [
  "We move at the pace of safety, but we move.",
  "Let people see your messy — your humanity.",
  "Responding with something tells them: you matter, but it's me, not you.",
  "Less guilt. Less ghosting. More truth.",
  "We are not endangered anymore.",
  "Evaluate your time and energy deeply — then you can judge if you are really available or not.",
];

const QUICK_ACTIONS = [
  {
    emoji: "🧊",
    title: "I'm frozen right now",
    steps: [
      "Breathe. You found this page. That's the first move.",
      "Scroll to the category that fits.",
      "Copy the closest message. Don't edit. Don't perfect.",
      "Paste and send. It just needs to be sent.",
      "Put your phone down. You did the thing.",
    ],
  },
  {
    emoji: "📋",
    title: "Inbox triage when overwhelmed",
    steps: [
      "Open your messages. Don't read yet — just scan names.",
      "Sort mentally: people who matter most / time-sensitive / everything else.",
      "Send a freeze message to the top 2-3. That's it for now.",
      "Everything else can wait. Give yourself permission.",
    ],
  },
  {
    emoji: "🚪",
    title: "Preemptive boundary setting",
    steps: [
      "When you feel the freeze coming — before the silence starts — send an advance notice.",
      "\"Hey, I'm heading into a low stretch. If I go quiet, it's me, not you. I'll come back.\"",
      "This buys you grace AND reduces future guilt because people already know.",
    ],
  },
  {
    emoji: "🔁",
    title: "The Sunday reset",
    steps: [
      "Once a week, open this kit.",
      "Scan your messages for anyone you've been avoiding.",
      "Pick the person you feel worst about. Send them something from here.",
      "Then pick one more if you can. Two is plenty.",
      "The pattern breaks one message at a time.",
    ],
  },
  {
    emoji: "⚡",
    title: "The 30-second rule",
    steps: [
      "When a message comes in and you feel the freeze start — you have 30 seconds.",
      "Don't craft a reply. Just send: \"Got this — will reply properly later.\"",
      "That's it. You bought yourself time without creating a ghost.",
      "The freeze usually kicks in after the window closes. Beat it.",
    ],
  },
];

const EMERGENCY_TEXT = "Hey — I'm sorry for the silence. It's me, not you. I'll get back to you soon.";
const STORAGE_KEY = "gather_freeze_edits";

// ─── Placeholder highlighter ────────────────────────────────────────────────────

function MessageText({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/(\[day\]|\[time ago\]|\[status\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[.+\]$/.test(part) ? (
          <span key={i} style={{ color: accent, opacity: 0.9 }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Message Card ───────────────────────────────────────────────────────────────

function MessageCard({
  msgKey,
  label,
  accent,
  text,
  onSave,
}: {
  msgKey: string;
  label: string;
  accent: string;
  text: string;
  onSave: (key: string, val: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!isEditing) setDraft(text); }, [text, isEditing]);

  const handleDone = () => { onSave(msgKey, draft); setIsEditing(false); };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(draft); }
    catch {
      const el = document.createElement("textarea");
      el.value = draft; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ backgroundColor: "var(--bg-soft)", border: "1px solid var(--border-light)", borderRadius: "10px", padding: "18px 20px", marginBottom: "10px" }}>
      <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
        {label}
      </div>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          style={{ width: "100%", backgroundColor: "var(--surface-light)", border: `1px solid ${accent}`, borderRadius: "6px", padding: "12px", fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.65, resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
      ) : (
        <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.65, margin: 0 }}>
          <MessageText text={draft} accent={accent} />
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
        <button
          onClick={() => isEditing ? handleDone() : setIsEditing(true)}
          style={{ background: "none", border: "1px solid var(--border-light)", borderRadius: "6px", padding: "5px 12px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: "var(--text-quiet)", cursor: "pointer" }}
        >
          {isEditing ? "done" : "edit"}
        </button>
        <button
          onClick={handleCopy}
          style={{ background: copied ? accent : "none", border: `1px solid ${copied ? accent : "var(--border-light)"}`, borderRadius: "6px", padding: "5px 12px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12px", color: copied ? "white" : "var(--text-quiet)", cursor: "pointer", transition: "all 0.15s" }}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Quick Action Accordion ─────────────────────────────────────────────────────

function QuickAction({ emoji, title, steps }: { emoji: string; title: string; steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ backgroundColor: "var(--bg-soft)", border: "1px solid var(--border-light)", borderRadius: "10px", marginBottom: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: "18px" }}>{emoji}</span>
        <span style={{ flex: 1, fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, color: "var(--text-soft)" }}>{title}</span>
        <span style={{ color: "var(--text-faint)", fontSize: "16px", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>›</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px", borderTop: "1px solid var(--border)" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginTop: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", flexShrink: 0, marginTop: "2px" }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontWeight: 300, lineHeight: 1.65, color: "var(--text-quiet)" }}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FreezePage() {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [emergencyCopied, setEmergencyCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEdits(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleSave = useCallback((key: string, val: string) => {
    setEdits(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleEmergencyCopy = async () => {
    try { await navigator.clipboard.writeText(EMERGENCY_TEXT); }
    catch {
      const el = document.createElement("textarea");
      el.value = EMERGENCY_TEXT; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setEmergencyCopied(true);
    setTimeout(() => setEmergencyCopied(false), 2000);
  };

  if (!mounted) return null;

  return (
    <PasswordGate>
      <main style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100dvh", backgroundColor: "var(--bg)" }}>
        <div style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "60px" }}>

          {/* Back */}
          <div style={{ padding: "20px 20px 0" }}>
            <Link href="/" style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-soft)", textDecoration: "none" }}>
              ← back to the fire
            </Link>
          </div>

          {/* Header */}
          <header className="animate-fade-in" style={{ textAlign: "center", padding: "32px 24px 20px" }}>
            <div style={{ marginBottom: "20px", opacity: 0.6 }}>
              <Image src="/sprites/sleepy-removebg-preview.png" alt="a gentle fire, resting" width={319} height={782} style={{ height: "60px", width: "auto" }} priority />
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "14px" }}>
              Freeze Response Kit
            </div>
            <h1 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "24px", fontWeight: 300, fontStyle: "italic", color: "var(--text)", margin: "0 0 16px", lineHeight: 1.35 }}>
              For when you can&apos;t get back to people<br />but still want them to know they matter
            </h1>
            <div style={{ width: "40px", height: "1px", backgroundColor: "var(--text-faint)", opacity: 0.3, margin: "0 auto" }} />
          </header>

          <div style={{ padding: "0 16px" }}>

            {/* Juan's reminders */}
            <div className="animate-fade-in" style={{ backgroundColor: "var(--surface)", borderRadius: "12px", padding: "22px 24px", marginBottom: "12px", animationDelay: "60ms", animationFillMode: "both" }}>
              <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "14px" }}>
                Reminders from Juan
              </div>
              {JUAN_WISDOM.map((w, i) => (
                <p key={i} style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14.5px", fontStyle: "italic", fontWeight: 300, color: "var(--text-soft)", lineHeight: 1.65, margin: 0, padding: "5px 0" }}>{w}</p>
              ))}
            </div>

            {/* Emergency message */}
            <div className="animate-fade-in" style={{ backgroundColor: "var(--surface)", borderRadius: "12px", padding: "22px 24px", marginBottom: "0", textAlign: "center", animationDelay: "100ms", animationFillMode: "both" }}>
              <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "12px" }}>
                If you can only do one thing
              </div>
              <div style={{ backgroundColor: "var(--bg-soft)", borderRadius: "8px", padding: "16px 18px", marginBottom: "14px", fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, lineHeight: 1.65, color: "var(--text-soft)", textAlign: "left" }}>
                &ldquo;{EMERGENCY_TEXT}&rdquo;
              </div>
              <button
                onClick={handleEmergencyCopy}
                style={{ background: emergencyCopied ? "var(--text-soft)" : "none", border: `1px solid ${emergencyCopied ? "var(--text-soft)" : "var(--border-light)"}`, borderRadius: "6px", padding: "8px 22px", fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", color: emergencyCopied ? "var(--bg)" : "var(--text-quiet)", cursor: "pointer", transition: "all 0.15s" }}
              >
                {emergencyCopied ? "copied ✓" : "copy"}
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "40px 0" }} />

            {/* Quick actions */}
            <div style={{ marginBottom: "0" }}>
              <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "8px" }}>
                Quick actions
              </div>
              <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontStyle: "italic", fontWeight: 300, color: "var(--text-faint)", margin: "0 0 16px" }}>
                Step-by-step so you don&apos;t have to think.
              </p>
              {QUICK_ACTIONS.map((a, i) => (
                <QuickAction key={i} emoji={a.emoji} title={a.title} steps={a.steps} />
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "40px 0" }} />

            {/* All messages */}
            <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "24px" }}>
              Messages by situation
            </div>

            {CATEGORIES.map((cat, ci) => (
              <div key={cat.id} style={{ marginBottom: "36px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cat.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 400, color: "var(--text-soft)" }}>{cat.name}</span>
                </div>
                {cat.messages.map((msg, mi) => (
                  <MessageCard
                    key={mi}
                    msgKey={`${ci}-${mi}`}
                    label={msg.label}
                    accent={cat.accent}
                    text={edits[`${ci}-${mi}`] ?? msg.text}
                    onSave={handleSave}
                  />
                ))}
              </div>
            ))}

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "8px 0 40px" }} />

            {/* The deeper truth */}
            <div style={{ backgroundColor: "var(--bg-soft)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "26px 28px", marginBottom: "0" }}>
              <div style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "18px" }}>
                The deeper truth
              </div>
              <div style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "15px", fontWeight: 300, lineHeight: 1.75, color: "var(--text-quiet)" }}>
                <p style={{ marginTop: 0 }}>The freeze is a survival pattern. Your nervous system learned it to keep you safe. It&apos;s not a character flaw — it&apos;s outdated software running on new hardware.</p>
                <p>Ghosting isn&apos;t cruelty — it&apos;s what happens when the freeze wins. But the people waiting on the other side don&apos;t know that. They just feel the absence.</p>
                <p>The goal isn&apos;t to never freeze. The goal is to <em>move while frozen</em> — even if that movement is a single copied message from this page.</p>
                <p style={{ marginBottom: 0, fontStyle: "italic", color: "var(--text-faint)" }}>We move at the pace of safety, but we move.</p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer style={{ textAlign: "center", padding: "40px 24px 48px" }}>
            <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "14px", fontStyle: "italic", fontWeight: 300, color: "var(--text-faint)", lineHeight: 1.6, maxWidth: "340px", margin: "0 auto" }}>
              Sending something imperfect is always better than sending nothing.<br />
              The message doesn&apos;t have to be perfect. It just has to be sent.
            </p>
          </footer>

        </div>
      </main>
    </PasswordGate>
  );
}
