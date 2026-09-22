"use client";

import { useEffect, useState } from "react";
import { QrCode, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface QRCodeDisplayProps {
  chestNumber: string;
  participantName?: string;
}

export function QRCodeDisplay({ chestNumber, participantName }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQRCode() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/participants/${chestNumber}/qr`);
        if (response.ok) {
          const data = await response.json();
          setQrCode(data.qrCode);
        } else {
          setError("Failed to generate QR code");
        }
      } catch (err) {
        console.error("Error fetching QR code:", err);
        setError("Failed to load QR code");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQRCode();
  }, [chestNumber]);

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qr-code-${chestNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error || !qrCode) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{error || "QR code not available"}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <CardTitle className="mb-2 flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Participant QR Code
          </CardTitle>
          {participantName && (
            <CardDescription>{participantName}</CardDescription>
          )}
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <Image
              src={qrCode}
              alt={`QR Code for ${chestNumber}`}
              width={200}
              height={200}
              className="w-48 h-48"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to view participant profile
          </p>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </div>
    </Card>
  );
}

