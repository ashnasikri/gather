"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface BottomNavProps {
  onOpenCapture?: () => void;
}

export default function BottomNav({ onOpenCapture }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [fireSheetOpen, setFireSheetOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const accent = "#d4853b";
  const faint = "var(--text-faint)";

  return (
    <>
      {/* Bottom nav bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "430px",
          zIndex: 50,
          background: "linear-gradient(to bottom, transparent, var(--bg) 35%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            padding: "12px 0 16px",
          }}
        >
          {/* Encounters */}
          <NavTab
            label="encounters"
            active={isActive("/")}
            accent={accent}
            faint={faint}
            onClick={() => router.push("/")}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />

          {/* Center fire button */}
          <button
            onClick={() => setFireSheetOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              transform: "translateY(-4px)",
              padding: "0 8px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 3px 16px rgba(212,133,59,0.35)",
              }}
            >
              🔥
            </div>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                fontSize: "10px",
                fontWeight: 400,
                color: accent,
                letterSpacing: "0.2px",
              }}
            >
              gather
            </span>
          </button>

          {/* Moments */}
          <NavTab
            label="moments"
            active={isActive("/moments")}
            accent={accent}
            faint={faint}
            onClick={() => router.push("/moments")}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }
          />

          {/* Promises */}
          <NavTab
            label="promises"
            active={isActive("/commitments")}
            accent={accent}
            faint={faint}
            onClick={() => router.push("/commitments")}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* Fire Sheet */}
      {fireSheetOpen && (
        <>
          <div
            onClick={() => setFireSheetOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              zIndex: 60,
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: "430px",
              backgroundColor: "var(--surface)",
              borderRadius: "20px 20px 0 0",
              zIndex: 61,
              padding: "12px 0 calc(32px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: "36px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: "var(--border-light)",
                margin: "0 auto 24px",
              }}
            />

            <p
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontSize: "17px",
                fontWeight: 300,
                color: "var(--text)",
                textAlign: "center",
                margin: "0 0 20px",
              }}
            >
              what would you like to add?
            </p>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <FireOption
                emoji="👥"
                title="i met someone"
                sub="log an encounter"
                onClick={() => {
                  setFireSheetOpen(false);
                  if (onOpenCapture) {
                    onOpenCapture();
                  } else {
                    // Signal home page to open capture sheet
                    sessionStorage.setItem("gather_open_capture", "1");
                    window.dispatchEvent(new Event("gather_open_capture"));
                  }
                }}
              />
              <FireOption
                emoji="✨"
                title="something moved me"
                sub="capture a moment"
                onClick={() => {
                  setFireSheetOpen(false);
                  sessionStorage.setItem("gather_open_moment", "1");
                  window.dispatchEvent(new Event("gather_open_moment"));
                  router.push("/moments");
                }}
              />
              <FireOption
                emoji="🤝"
                title="i made a promise"
                sub="track a commitment"
                onClick={() => {
                  setFireSheetOpen(false);
                  sessionStorage.setItem("gather_open_promise", "1");
                  window.dispatchEvent(new Event("gather_open_promise"));
                  router.push("/commitments");
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavTab({
  label,
  active,
  accent,
  faint,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  accent: string;
  faint: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0 8px",
        minWidth: "64px",
        color: active ? accent : faint,
        transition: "color 0.15s",
      }}
    >
      {icon}
      <span
        style={{
          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
          fontSize: "10px",
          fontWeight: active ? 400 : 300,
          letterSpacing: "0.2px",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function FireOption({
  emoji,
  title,
  sub,
  onClick,
}: {
  emoji: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 16px",
        borderRadius: "14px",
        backgroundColor: "var(--bg)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ fontSize: "20px", lineHeight: 1 }}>{emoji}</span>
      <div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            color: "var(--text)",
            marginBottom: "2px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12px",
            fontWeight: 300,
            color: "var(--text-faint)",
          }}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}
