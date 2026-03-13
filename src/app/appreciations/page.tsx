"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PasswordGate from "@/components/PasswordGate";

interface Appreciation {
  id: string;
  url: string;
  created_at: string;
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 1200;
      const MAX_H = 1600;
      let { width, height } = img;
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("compression failed"));
      }, "image/jpeg", 0.85);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export default function AppreciationsPage() {
  const [items, setItems] = useState<Appreciation[]>([]);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Appreciation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/appreciations");
    if (res.ok) {
      const { appreciations } = await res.json();
      setItems(appreciations ?? []);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed, "appreciation.jpg");
      const res = await fetch("/api/appreciations", { method: "POST", body: fd });
      if (res.ok) {
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        showToast(body.error ?? "upload failed");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!lightbox) return;
    await fetch(`/api/appreciations/${lightbox.id}`, { method: "DELETE" });
    setLightbox(null);
    setDeleteConfirm(false);
    await load();
  };

  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  if (!mounted) return null;

  return (
    <PasswordGate>
      <main
        style={{
          width: "100%",
          maxWidth: "430px",
          margin: "0 auto",
          minHeight: "100dvh",
          backgroundColor: "#1a1410",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        {/* Back */}
        <div style={{ padding: "20px 20px 12px" }}>
          <span
            onClick={() => { window.location.href = "/freeze"; }}
            style={{
              fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
              fontSize: "13px",
              color: "#6b5e50",
              cursor: "pointer",
            }}
          >
            ←
          </span>
        </div>

        {/* Gallery */}
        {items.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60dvh" }}>
            <span style={{ fontSize: "32px", opacity: 0.25 }}>✨</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 12px", width: "100%", boxSizing: "border-box" }}>
            {items.map((item) => (
              <GalleryImage key={item.id} item={item} onClick={() => { setLightbox(item); setDeleteConfirm(false); }} />
            ))}
          </div>
        )}

        {/* Upload FAB */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#d4853b",
            border: "none",
            color: "#1a1410",
            fontSize: "24px",
            fontWeight: 300,
            cursor: uploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(212,133,59,0.3)",
            opacity: uploading ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {uploading ? "·" : "+"}
        </button>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed",
            bottom: "84px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(196,107,90,0.15)",
            border: "1px solid rgba(196,107,90,0.25)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
            fontSize: "12px",
            color: "#c46b5a",
          }}>
            {toast}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div
            onClick={() => { if (deleteConfirm) { setDeleteConfirm(false); } else { setLightbox(null); } }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.93)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(null); setDeleteConfirm(false); }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.25)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            {/* Image */}
            <img
              src={lightbox.url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "12px",
              }}
            />

            {/* Delete */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
            >
              {deleteConfirm ? (
                <button
                  onClick={handleDelete}
                  style={{
                    background: "rgba(196,107,90,0.15)",
                    border: "1px solid rgba(196,107,90,0.25)",
                    borderRadius: "12px",
                    padding: "6px 18px",
                    color: "#c46b5a",
                    fontSize: "12px",
                    fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  delete this?
                </button>
              ) : (
                <span
                  onClick={() => setDeleteConfirm(true)}
                  style={{ fontSize: "13px", opacity: 0.2, cursor: "pointer" }}
                >
                  🗑
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </PasswordGate>
  );
}

function GalleryImage({ item, onClick }: { item: Appreciation; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={item.url}
      alt=""
      loading="lazy"
      onClick={onClick}
      onLoad={() => setLoaded(true)}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: "12px",
        cursor: "pointer",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.3s ease",
        display: "block",
      }}
    />
  );
}
