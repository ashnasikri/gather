import BonfireCharacter from "@/components/BonfireCharacter";
import JournalFeed from "@/components/JournalFeed";
import PasswordGate from "@/components/PasswordGate";
import { EncounterType } from "@/lib/types";

const sampleEncounters: {
  id: string;
  personName: string;
  type: EncounterType;
  date: string;
  time: string;
  summary: string;
}[] = [
  {
    id: "1",
    personName: "Priya",
    type: "coffee",
    date: "Today",
    time: "2:30 PM",
    summary: "she's leaving Freshworks. hasn't told anyone yet.",
  },
  {
    id: "2",
    personName: "Arjun",
    type: "call",
    date: "Today",
    time: "11:00 AM",
    summary: "frustrated about the API timeline. holding it together.",
  },
  {
    id: "3",
    personName: "Neha",
    type: "event",
    date: "Yesterday",
    time: "7:00 PM",
    summary: "building computer vision for farmers. instant connection.",
  },
  {
    id: "4",
    personName: "Raj",
    type: "dm",
    date: "Yesterday",
    time: "3:15 PM",
    summary: "saw my building in public post. wants to talk Claude Code.",
  },
  {
    id: "5",
    personName: "Vikram",
    type: "coffee",
    date: "March 5",
    time: "4:00 PM",
    summary: "left Unacademy. taking time off. seemed a bit lost.",
  },
  {
    id: "6",
    personName: "Meera",
    type: "bumped",
    date: "March 3",
    time: "1:00 PM",
    summary: "bumped into her. she launched her podcast — 12 episodes!",
  },
];

const totalPeople = 6;

export default function HomePage() {
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
        {/* Scrollable content */}
        <div
          style={{
            overflowY: "auto",
            minHeight: "100dvh",
          }}
        >
          {/* Header */}
          <header
            style={{
              textAlign: "center",
              paddingTop: "52px",
              paddingBottom: "4px",
            }}
          >
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
              {totalPeople} around your fire
            </p>
          </header>

          {/* Bonfire character */}
          <BonfireCharacter mood="idle" />

          {/* Journal feed */}
          <div style={{ paddingTop: "28px" }}>
            <JournalFeed encounters={sampleEncounters} />
          </div>
        </div>

        {/* FAB */}
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
        >
          <button
            style={{
              height: "46px",
              padding: "0 22px",
              borderRadius: "23px",
              backgroundColor: "var(--ember)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "13.5px",
              fontWeight: 400,
              color: "white",
              boxShadow: "0 3px 18px rgba(224,120,64,0.3)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🔥 sit by the fire
          </button>
        </div>
      </main>
    </PasswordGate>
  );
}
