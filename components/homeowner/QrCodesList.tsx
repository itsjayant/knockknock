"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useIdToken } from "@/lib/hooks/useIdToken";
import { generateQrDataUrl } from "@/lib/qr";

type QrCode = {
  id: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  url: string;
};

type Props = {
  initialQrCodes: QrCode[];
  onNewQrCode?: (qrCode: QrCode) => void;
};

export default function QrCodesList({ initialQrCodes, onNewQrCode }: Props) {
  const { idToken, loading: tokenLoading } = useIdToken();
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QrCode[]>(initialQrCodes);
  const [qrImages, setQrImages] = useState<Record<string, string>>({}); // QR code data URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Update codes when new ones are added from CreateQrForm
  const addQrCode = (newQrCode: QrCode) => {
    setQrCodes((prev) => [newQrCode, ...prev]);
    onNewQrCode?.(newQrCode);
  };

  // Expose addQrCode via window for parent component
  useEffect(() => {
    (window as any).__addQrCode = addQrCode;
    return () => {
      delete (window as any).__addQrCode;
    };
  }, []);

  // Generate QR code images on mount and when codes change
  useEffect(() => {
    const generateImages = async () => {
      const images: Record<string, string> = {};
      for (const qr of qrCodes) {
        try {
          images[qr.id] = await generateQrDataUrl(qr.url);
        } catch (err) {
          console.error(`Failed to generate QR image for ${qr.id}:`, err);
        }
      }
      setQrImages(images);
    };
    if (qrCodes.length > 0) {
      generateImages();
    }
  }, [qrCodes]);

  async function handleDelete(qrId: string) {
    if (!confirm("Delete this QR code?") || !idToken || tokenLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/qr?id=${qrId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setQrCodes(qrCodes.filter((q) => q.id !== qrId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  }

  function handleCopyLink(qrId: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(qrId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDownloadQR(qrId: string, label: string) {
    const qrImage = qrImages[qrId];
    if (!qrImage) return;

    // Create a canvas to draw the QR code with label
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create an image from the QR data URL
    const img = new window.Image();
    img.src = qrImage;

    img.onload = () => {
      const padding = 20;
      const labelHeight = 50;
      const imgSize = img.width;

      // Set canvas dimensions
      canvas.width = imgSize + padding * 2;
      canvas.height = imgSize + padding * 2 + labelHeight;

      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR image
      ctx.drawImage(img, padding, padding);

      // Draw label
      ctx.fillStyle = "#18181b";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, canvas.width / 2, imgSize + padding * 2 + 25);

      // Download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.click();
    };
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {qrCodes.length === 0 ? (
          <p className="col-span-full text-center text-sm text-zinc-500">
            No QR codes yet. Create one to get started.
          </p>
        ) : (
          qrCodes.map((qr) => (
            <div
              key={qr.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 truncate">{qr.label}</h3>
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium flex-shrink-0 ${qr.isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                    }`}
                >
                  {qr.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* QR Code Image */}
              <div className="flex items-center justify-center rounded-lg bg-zinc-50 p-4 min-h-56">
                {qrImages[qr.id] ? (
                  <img
                    src={qrImages[qr.id]}
                    alt={`QR code for ${qr.label}`}
                    className="h-40 w-40 rounded"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Generating QR code...</p>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="text-xs text-zinc-500">
                Created {new Date(qr.createdAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyLink(qr.id, qr.url)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${copiedId === qr.id
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                >
                  {copiedId === qr.id ? "✓ Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => handleDownloadQR(qr.id, qr.label)}
                  disabled={!qrImages[qr.id]}
                  className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                  title="Download QR code as PNG"
                >
                  ⬇ Download
                </button>
                <button
                  onClick={() => handleDelete(qr.id)}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
