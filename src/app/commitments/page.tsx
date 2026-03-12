"use client";

import PasswordGate from "@/components/PasswordGate";
import BonfireCharacter from "@/components/BonfireCharacter";
import BottomNav from "@/components/BottomNav";

export default function CommitmentsPage() {
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
              what you&apos;ve promised
            </p>
          </header>

          <BonfireCharacter mood="idle" />

          <div style={{ textAlign: "center", padding: "32px 24px" }}>
            <p
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "17px",
                fontWeight: 300,
                color: "var(--text-soft)",
                margin: "0 0 8px",
                lineHeight: 1.5,
              }}
            >
              keep your word
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "13px",
                fontWeight: 300,
                color: "var(--text-quiet)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              track what you&apos;ve committed to — to yourself and others
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "12px",
                fontWeight: 300,
                color: "var(--text-faint)",
                fontStyle: "italic",
                marginTop: "24px",
              }}
            >
              coming soon
            </p>
          </div>
        </div>

        <BottomNav />
      </main>
    </PasswordGate>
  );
}
