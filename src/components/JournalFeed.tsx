"use client";

import { EncounterType } from "@/lib/types";

interface FeedEncounter {
  id: string;
  personName: string;
  type: EncounterType;
  date: string;
  time: string;
  summary: string;
}

interface JournalFeedProps {
  encounters: FeedEncounter[];
}

const typeEmoji: Record<EncounterType, string> = {
  coffee: "☕",
  call: "📞",
  event: "✦",
  dm: "💬",
  bumped: "👋",
};

export default function JournalFeed({ encounters }: JournalFeedProps) {
  // Group encounters by date
  const grouped = encounters.reduce<Record<string, FeedEncounter[]>>((acc, enc) => {
    if (!acc[enc.date]) acc[enc.date] = [];
    acc[enc.date].push(enc);
    return acc;
  }, {});

  const dateGroups = Object.entries(grouped);

  return (
    <div style={{ padding: "0 20px 120px" }}>
      {/* Section header */}
      <h2
        style={{
          fontFamily: "var(--font-newsreader), Georgia, serif",
          fontSize: "18px",
          fontWeight: 400,
          color: "var(--text)",
          margin: "0 0 20px",
          padding: "0",
        }}
      >
        recent encounters
      </h2>

      {dateGroups.map(([date, group]) => (
        <div key={date} style={{ marginBottom: "20px" }}>
          {/* Day label */}
          <div
            style={{
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "11px",
              fontWeight: 400,
              color: "var(--text-faint)",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {date}
          </div>

          {/* Encounters for this day */}
          {group.map((enc) => (
            <div
              key={enc.id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* Name line */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    color: "var(--text)",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                  }}
                >
                  <span>{typeEmoji[enc.type]}</span>
                  <span>{enc.personName}</span>
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    fontSize: "11px",
                    color: "var(--text-faint)",
                    flexShrink: 0,
                    marginLeft: "12px",
                  }}
                >
                  {enc.time}
                </span>
              </div>

              {/* Summary */}
              <div
                style={{
                  paddingLeft: "21px",
                  fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                  fontSize: "13.5px",
                  fontWeight: 300,
                  color: "var(--text-quiet)",
                  lineHeight: 1.45,
                }}
              >
                {enc.summary}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Bottom quote */}
      <p
        style={{
          fontFamily: "var(--font-newsreader), Georgia, serif",
          fontStyle: "italic",
          fontSize: "13.5px",
          fontWeight: 300,
          color: "var(--text-faint)",
          textAlign: "center",
          marginTop: "32px",
          lineHeight: 1.6,
          padding: "0 8px",
        }}
      >
        the people you gather around become the story of your life
      </p>
    </div>
  );
}
