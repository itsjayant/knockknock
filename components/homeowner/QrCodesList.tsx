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
};

export default function QrCodesList({ initialQrCodes }: Props) {
  const { idToken, loading: tokenLoading } = useIdToken();
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QrCode[]>(initialQrCodes);
  const [qrImages, setQrImages] = useState<Record<string, string>>({}); // QR code data URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <h3 className="font-semibold text-zinc-900">{qr.label}</h3>
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${qr.isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                    }`}
                >
                  {qr.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* QR Code Image */}
              <div className="flex items-center justify-center rounded-lg bg-zinc-50 p-4">
                {qrImages[qr.id] ? (
                  <img
                    src={qrImages[qr.id]}
                    alt={`QR code for ${qr.label}`}
                    className="h-48 w-48 rounded"
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
                  onClick={() => {
                    const url = qr.url;
                    navigator.clipboard.writeText(url);
                  }}
                  className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                >
                  Copy Link
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
