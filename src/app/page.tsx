"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BonfireCharacter from "@/components/BonfireCharacter";
import JournalFeed, { FeedEncounter } from "@/components/JournalFeed";
import PasswordGate from "@/components/PasswordGate";
import CaptureSheet from "@/components/CaptureSheet";
import EditSheet from "@/components/EditSheet";
import PersonProfile from "@/components/PersonProfile";
import BottomNav from "@/components/BottomNav";
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

  // Listen for BottomNav fire sheet → "i met someone" signal
  useEffect(() => {
    const handler = () => {
      if (sessionStorage.getItem("gather_open_capture") === "1") {
        sessionStorage.removeItem("gather_open_capture");
        setSheetOpen(true);
      }
    };
    window.addEventListener("gather_open_capture", handler);
    // Also check on mount in case we navigated here from another page
    handler();
    return () => window.removeEventListener("gather_open_capture", handler);
  }, []);

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
        <div style={{ overflowY: "auto", minHeight: "100dvh", paddingBottom: "120px" }}>
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

          {/* Escape hatch links */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", padding: "2px 0 6px", flexWrap: "wrap" }}>
            <Link href="/freeze" style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-faint)", textDecoration: "none" }}>
              frozen? can&apos;t reply?
            </Link>
            <span style={{ color: "var(--text-faint)", fontSize: "12.5px", lineHeight: 1 }}>·</span>
            <Link href="/boundaries" style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-faint)", textDecoration: "none" }}>
              about to say yes?
            </Link>
            <span style={{ color: "var(--text-faint)", fontSize: "12.5px", lineHeight: 1 }}>·</span>
            <Link href="/resolve" style={{ fontFamily: "var(--font-dm-sans), -apple-system, sans-serif", fontSize: "12.5px", fontWeight: 300, color: "var(--text-faint)", textDecoration: "none" }}>
              tension with someone?
            </Link>
          </div>

          <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "20px 20px 0" }} />

          <div style={{ paddingTop: "20px" }}>
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

        <BottomNav onOpenCapture={() => setSheetOpen(true)} />

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
          personId={editTarget?.personId ?? ""}
          initialSummary={editTarget?.summary ?? ""}
          initialType={editTarget?.type ?? "coffee"}
          initialEnergy={editTarget?.energy}
          initialCity={editTarget?.city}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchEncounters(); }}
        />
      </main>
    </PasswordGate>
  );
}
