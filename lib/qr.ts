import QRCode from "qrcode";

export type QrCodeDoc = {
    id: string;        // Firestore document ID — also the token embedded in the QR URL
    ownerId: string;
    label: string;
    isActive: boolean;
    createdAt: string; // ISO 8601
};

/**
 * Generates a PNG data URL for a QR code pointing to the given URL.
 * Runs server-side (Node.js). Uses the `qrcode` npm package.
 */
export async function generateQrDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300,
    });
}
