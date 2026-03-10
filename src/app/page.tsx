"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BonfireCharacter from "@/components/BonfireCharacter";
import JournalFeed, { FeedEncounter } from "@/components/JournalFeed";
import PasswordGate from "@/components/PasswordGate";
import CaptureSheet from "@/components/CaptureSheet";
import EditSheet from "@/components/EditSheet";
import PersonProfile from "@/components/PersonProfile";
import { BuddyMood } from "@/lib/types";

export default function HomePage() {
  const [encounters, setEncounters] = useState<FeedEncounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mood, setMood] = useState<BuddyMood>("idle");
  const handleMoodChange = (m: "idle" | "thinking" | "happy") => setMood(m as BuddyMood);

  // Edit state
  const [editTarget, setEditTarget] = useState<FeedEncounter | null>(null);
  // Profile state
  const [profilePersonId, setProfilePersonId] = useState<string | null>(null);

  const fetchEncounters = useCallback(async () => {
    try {
      const res = await fetch("/api/encounters");
      if (res.ok) setEncounters(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEncounters(); }, [fetchEncounters]);

  const handleDelete = async (id: string) => {
    // Optimistic removal
    setEncounters((prev) => prev.filter((e) => e.id !== id));
    const res = await fetch(`/api/encounters/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // Revert on failure
      fetchEncounters();
      console.error("[delete] failed");
    }
  };

  const uniquePeople = new Set(encounters.map((e) => (e as FeedEncounter & { personId?: string }).personId)).size;

  return (
    <PasswordGate>
      <main
        style={{
          maxWidth: "430px", margin: "0 auto",
          minHeight: "100dvh", backgroundColor: "var(--bg)", position: "relative",
        }}
      >
        <div style={{ overflowY: "auto", minHeight: "100dvh" }}>
          {/* Header */}
          <header style={{ textAlign: "center", paddingTop: "52px", paddingBottom: "4px" }}>
            <h1 style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "27px", fontWeight: 300, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.2px" }}>
              gather
            </h1>
            <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
              {loading ? "..." : uniquePeople > 0 ? `${uniquePeople} around your fire` : "the fire\u2019s just getting started"}
            </p>
          </header>

          <BonfireCharacter mood={mood} />

          {/* Freeze kit section */}
          <div style={{ padding: "16px 16px 4px" }}>
            <Link
              href="/freeze"
              style={{ textDecoration: "none", display: "block" }}
            >
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  border: "1px solid var(--border-light)",
                }}
              >
                {/* Icon */}
                <div style={{ fontSize: "26px", lineHeight: 1, opacity: 0.7, flexShrink: 0 }}>
                  🕯️
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-newsreader), Georgia, serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      color: "var(--text-soft)",
                      margin: "0 0 3px",
                      lineHeight: 1.3,
                    }}
                  >
                    gone quiet on someone?
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "var(--text-faint)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    for when you&apos;re frozen, ashna
                  </p>
                </div>

                {/* Arrow */}
                <div
                  style={{
                    color: "var(--text-faint)",
                    fontSize: "16px",
                    flexShrink: 0,
                    opacity: 0.5,
                  }}
                >
                  →
                </div>
              </div>
            </Link>
          </div>

          <div style={{ paddingTop: "28px" }}>
            {!loading && encounters.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <p style={{ fontFamily: "var(--font-newsreader), Georgia, serif", fontSize: "17px", fontWeight: 300, color: "var(--text-soft)", margin: "0 0 8px" }}>
                  the fire&apos;s just getting started
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "13px", fontWeight: 300, color: "var(--text-quiet)", margin: 0 }}>
                  tell me about someone
                </p>
              </div>
            ) : (
              <JournalFeed
                encounters={encounters}
                onEdit={setEditTarget}
                onDelete={handleDelete}
                onPersonTap={setProfilePersonId}
              />
            )}
          </div>
        </div>

        {/* FAB */}
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              height: "46px", padding: "0 22px", borderRadius: "23px",
              backgroundColor: "var(--ember)", border: "none", cursor: "pointer",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "13.5px", fontWeight: 400, color: "white",
              boxShadow: "0 3px 18px rgba(224,120,64,0.3)",
              whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            🔥 sit by the fire
          </button>
        </div>

        <CaptureSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSaved={fetchEncounters}
          onMoodChange={handleMoodChange}
        />

        <PersonProfile
          personId={profilePersonId}
          open={profilePersonId !== null}
          onClose={() => { setProfilePersonId(null); fetchEncounters(); }}
        />

        <EditSheet
          open={editTarget !== null}
          encounterId={editTarget?.id ?? ""}
          initialSummary={editTarget?.summary ?? ""}
          initialType={editTarget?.type ?? "coffee"}
          initialEnergy={editTarget?.energy}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchEncounters(); }}
        />
      </main>
    </PasswordGate>
  );
}
