"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "gather_auth";
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "gather";

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setAuthed(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  // Avoid flash before mount
  if (!mounted) return null;

  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg)",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontFamily: "var(--font-newsreader), Georgia, serif",
            fontSize: "32px",
            fontWeight: 300,
            color: "var(--text)",
            margin: "0 0 8px",
          }}
        >
          gather
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
          a people journal
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "280px" }}>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="password"
          autoFocus
          style={{
            width: "100%",
            padding: "14px 18px",
            backgroundColor: "var(--surface)",
            border: `1px solid ${error ? "var(--rose)" : "var(--border-light)"}`,
            borderRadius: "12px",
            color: "var(--text)",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "15px",
            fontWeight: 300,
            outline: "none",
            textAlign: "center",
            letterSpacing: "3px",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "12px",
              color: "var(--rose)",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            wrong password
          </p>
        )}
        <button
          type="submit"
          style={{
            display: "none",
          }}
        >
          enter
        </button>
      </form>

      <p
        style={{
          fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
          fontSize: "12px",
          fontWeight: 300,
          color: "var(--text-faint)",
          marginTop: "28px",
          textAlign: "center",
        }}
      >
        press enter to continue
      </p>
    </div>
  );
}
