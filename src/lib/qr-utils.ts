import QRCode from "qrcode";

/**
 * Generate QR code data URL for a participant
 * QR code contains: /participant/{chest_number}
 * This allows direct scanning to view participant profile
 */
export async function generateParticipantQR(chestNumber: string, baseUrl?: string): Promise<string> {
  const urlBase = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${urlBase}/participant/${chestNumber}`;
  
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateParticipantQRSVG(chestNumber: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const url = `${baseUrl}/participant/${chestNumber}`;
  
  try {
    const svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return svg;
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw new Error("Failed to generate QR code");
  }
}

