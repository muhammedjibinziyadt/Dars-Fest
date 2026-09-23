"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { Camera, Upload, Trash2, Link as LinkIcon, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentAvatarPickerProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  label?: string;
  onChange?: (avatar: string) => void;
}

export function StudentAvatarPicker({
  name = "avatar",
  value,
  defaultValue = "",
  label = "Student Photo",
  onChange,
}: StudentAvatarPickerProps) {
  const [internalAvatar, setInternalAvatar] = useState<string>(value ?? defaultValue);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatar = value !== undefined ? value : internalAvatar;

  // Sync internal state when controlled value or defaultValue changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalAvatar(value);
    } else if (defaultValue !== undefined) {
      setInternalAvatar(defaultValue);
    }
  }, [value, defaultValue]);

  // Resize and compress image to 300x300 square canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const size = 300;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            setIsProcessing(false);
            return;
          }

          // Draw centered square crop
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            size,
            size
          );

          // Convert to optimized JPEG data URL (~25KB)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          setInternalAvatar(compressedBase64);
          onChange?.(compressedBase64);
        } catch (err) {
          console.error("Failed to crop image:", err);
          alert("Could not process image file. Please try a different one.");
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        alert("Failed to load image. Please choose another image file.");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset file input value so selecting the same file again triggers onChange
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemove = () => {
    setInternalAvatar("");
    onChange?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplyUrl = () => {
    const clean = urlInput.trim();
    if (clean) {
      setInternalAvatar(clean);
      onChange?.(clean);
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
          {label}
        </label>
      )}

      {/* Hidden input to pass avatar value in FormData */}
      <input type="hidden" name={name} value={currentAvatar} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-white/10 bg-white/5">
        {/* Avatar Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative group cursor-pointer w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${
            isDragging
              ? "border-amber-400 bg-amber-400/20 scale-105"
              : currentAvatar
              ? "border-[#FACC15]/80 shadow-md shadow-amber-400/10"
              : "border-dashed border-white/20 bg-white/5 hover:border-white/40"
          }`}
          title="Click or drag image to upload"
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center text-amber-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[8px] uppercase mt-1">Processing</span>
            </div>
          ) : currentAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentAvatar}
              alt="Student Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/40 group-hover:text-white/70 transition-colors">
              <User className="w-8 h-8 mb-0.5" />
              <span className="text-[9px] uppercase font-medium">Add Photo</span>
            </div>
          )}

          {/* Hover overlay with Camera Icon */}
          {!isProcessing && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs h-8"
            >
              <Upload className="w-3.5 h-3.5" />
              {currentAvatar ? "Change Photo" : "Upload Photo"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="gap-1.5 text-xs h-8 border border-white/10 hover:bg-white/10 text-white/80"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Paste URL
            </Button>

            {currentAvatar && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={isProcessing}
                onClick={handleRemove}
                className="gap-1 text-xs h-8 px-2"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-[11px] text-white/50">
            JPG, PNG, or WEBP. Auto-cropped to square.
          </p>

          {/* URL Input Dropdown */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                placeholder="https://example.com/student.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleApplyUrl}
                className="text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
