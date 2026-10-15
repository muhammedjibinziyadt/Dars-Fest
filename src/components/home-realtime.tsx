"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { LiveScorePulse } from "@/components/live-score-pulse";
import { useScoreboardUpdates } from "@/hooks/use-realtime";
import type { Team } from "@/lib/types";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface GalleryPhoto {
  src: string;
  title: string;
  caption: string;
}

const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/img/gallery/gallery-1.webp",
    title: "Arts Fest Nonstage · 21 Mon",
    caption: "Official announcement for Maerika 2k26 Arts Fest Nonstage competitions",
  },
  {
    src: "/img/gallery/gallery-2.webp",
    title: "ലഹരിക്കെതിരെ സർഗാത്മക പോരാട്ടം",
    caption: "കല വിനോദമല്ല, മാറ്റത്തിന്റെ വഴി - കലായുഗ ഭാവുകം പോസ്റ്റർ ക്യാമ്പയിൻ",
  },
  {
    src: "/img/gallery/gallery-3.webp",
    title: "Story Talk · Unfiltered Conversations",
    caption: "A podcast platform bringing unheard stories and overlooked realities into the spotlight",
  },
  {
    src: "/img/gallery/gallery-4.webp",
    title: "The Race Begins · Azman vs Sahwan",
    caption: "The ultimate clash for the Maerika 2k26 championship glory",
  },
  {
    src: "/img/gallery/gallery-5.webp",
    title: "ഇവിടെ കലയാണ് ലഹരി",
    caption: "കലായുഗ ഭാവുകം 2k26 - ലഹരി വിരുദ്ധ സർഗ്ഗാത്മക മുന്നേറ്റം",
  },
  {
    src: "/img/gallery/gallery-6.webp",
    title: "പോരാട്ടം തുടങ്ങട്ടെ... ഇനി കലയുടെ കാലം",
    caption: "വളമംഗലം മഹല്ല് ജുമാ മസ്ജിദ് & ദർസ് വിദ്യാർത്ഥി പ്രതിഭകളുടെ മഹാസംഗമം",
  },
  {
    src: "/img/gallery/gallery-7.webp",
    title: "ലോഗോ പ്രകാശനവും ടീം പ്രഖ്യാപനവും",
    caption: "Official fest logo launch and team declaration ceremony",
  },
  {
    src: "/img/gallery/gallery-8.webp",
    title: "ഒരുക്കങ്ങൾ തുടങ്ങാം... Tick-Tock",
    caption: "ഒരു മാസം... ഒരു സ്നേഹം... ഒരു മാതൃക - വിശേഷ പരിപാടികൾ ഉടൻ",
  },
  {
    src: "/img/gallery/gallery-9.webp",
    title: "കലകൾ ഏറ്റുമുട്ടുന്നു · The Fest Era",
    caption: "The days of FEST: creativity comes alive and unforgettable moments begin",
  },
  {
    src: "/img/gallery/gallery-10.webp",
    title: "Logo Concept · അർത്ഥതലങ്ങൾ",
    caption: "The Dome Masjid, the Arabic Letter Meem (Maerika), and the Sword of righteousness",
  },
  {
    src: "/img/gallery/gallery-11.webp",
    title: "കലായുഗ ഭാവുകം · Fest Theme Poster",
    caption: "Official fest emblem by Jawharathul Uloom Suffa Dars Students Association",
  },
  {
    src: "/img/gallery/gallery-12.webp",
    title: "Nonstage Session · 18 Friday",
    caption: "Maerika 2k26 Arts Fest Nonstage inaugural session and competitions",
  },
];

interface HomeRealtimeProps {
  teams: Team[];
  liveScores: Map<string, number>;
}

export function HomeRealtime({
  teams: initialTeams,
  liveScores: initialLiveScores,
}: HomeRealtimeProps) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const currentPhotoIndex = selectedPhoto
    ? galleryPhotos.findIndex((p) => p.src === selectedPhoto.src)
    : -1;

  const handleNextPhoto = useCallback(() => {
    if (!selectedPhoto) return;
    const idx = galleryPhotos.findIndex((p) => p.src === selectedPhoto.src);
    const nextIdx = (idx + 1) % galleryPhotos.length;
    setSelectedPhoto(galleryPhotos[nextIdx]);
  }, [selectedPhoto]);

  const handlePrevPhoto = useCallback(() => {
    if (!selectedPhoto) return;
    const idx = galleryPhotos.findIndex((p) => p.src === selectedPhoto.src);
    const prevIdx = (idx - 1 + galleryPhotos.length) % galleryPhotos.length;
    setSelectedPhoto(galleryPhotos[prevIdx]);
  }, [selectedPhoto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPhoto(null);
      } else if (e.key === "ArrowRight") {
        handleNextPhoto();
      } else if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextPhoto, handlePrevPhoto]);

  useScoreboardUpdates(() => {
    router.refresh();
  });

  const highlight = initialTeams[0];

  return (
    <main className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen bg-[#fffcf5] p-4 sm:p-6 md:p-12 lg:p-16 flex flex-col">
        {/* Decorative waves at bottom - full width */}
        <div className="absolute bottom-0 left-0 right-0 w-full h-12 md:h-16 lg:h-22 z-0">
          <Image
            src="/img/hero/waves.webp"
            alt="Decorative waves"
            fill
            sizes="100vw"
            className="object-cover object-bottom"
            priority
            style={{ width: "100%" }}
          />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10 flex-1 flex flex-col lg:justify-center">
          {/* Mobile Layout: Vertical Stack */}
          <div className="flex flex-col lg:hidden space-y-4 sm:space-y-5 w-full pt-2">
            {/* Top Bar - Logo and Menu (Mobile) */}
            <div className="flex items-center justify-between mb-2">
              <div className="relative w-16 h-16 shrink-0">
                <Image
                  src="/img/hero/Fest-logo.webp"
                  alt="Maerika Logo"
                  fill
                  sizes="64px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Illustration - Full Width (Mobile) */}
            <div className="relative w-full h-[250px] sm:h-[320px] md:h-[380px] mx-auto -mt-2">
              <Image
                src="/img/hero/Left-side-image-for-hero section.webp"
                alt="Cultural Heritage Illustration"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Malayalam Text - Centered (Mobile) - Bigger */}
            <div className="flex justify-center px-4 -mt-2">
              <div className="relative w-full max-w-lg sm:max-w-xl h-24 sm:h-32 md:h-40">
                <Image
                  src="/img/hero/Typegraphy.webp"
                  alt="ശതകം സാക്ഷി"
                  fill
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Description - Centered (Mobile) */}
            <div className="text-center space-y-4 px-4">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-lg mx-auto">
                &apos;കലായുഗ ഭാവുകം&apos; എന്ന പ്രമേയത്തിലൂടെ, യുവത്വത്തെ
                കാർന്നുതിന്നുന്ന ലഹരിയെന്ന വിപത്തിനെതിരെ കലയെയും അറിവിനെയും
                ഞങ്ങൾ ആയുധമാക്കുന്നു. ചിന്തകൾക്ക് മൂർച്ചകൂട്ടാനും
                സർഗശേഷികളെ നാടിന്റെ നന്മയ്ക്കായി വഴിതിരിച്ചുവിടാനും ഈ വേദി
                കരുത്തുപകരുന്നു. വിനാശകരമായ ലഹരിയുടെ വഴികളിൽ നിന്ന്
                കലയുടെയും സംസ്കാരത്തിന്റെയും വിശുദ്ധിയിലേക്ക് വിദ്യാർത്ഥി
                സമൂഹത്തെ കൈപിടിച്ചുയർത്താനുള്ള ഒരു സർഗ്ഗാത്മക
                മുന്നേറ്റമാണിത്.
              </p>

              {/* CTA Button - Centered (Mobile) - Smaller */}
              <div className="pt-1">
                <Link href="/results">
                  <Button className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-medium px-6 py-3 text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg transition-all w-auto">
                    Click to Dive in
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 xl:gap-12 items-center w-full">
            {/* Left Side - Illustration */}
            <div className="relative w-full h-[500px] xl:h-[600px]">
              <Image
                src="/img/hero/Left-side-image-for-hero section.webp"
                alt="Cultural Heritage Illustration"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Right Side - Content */}
            <div className="space-y-6 xl:space-y-8">
              {/* Logo and Malayalam Script */}
              <div className="flex items-center gap-4 xl:gap-6">
                {/* Logo with text below */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative w-24 h-24 xl:w-36 xl:h-36 mb-1">
                    <Image
                      src="/img/hero/Fest-logo.webp"
                      alt="Maerika Logo"
                      fill
                      sizes="(max-width: 1280px) 96px, 144px"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                {/* Malayalam Text */}
                <div className="flex-1 pt-1">
                  <div className="relative w-full h-14 xl:h-28">
                    <Image
                      src="/img/hero/Typegraphy.webp"
                      alt="കലായുഗ ഭാവുകം"
                      fill
                      sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 400px, 500px"
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Main Title */}
              <div>
                <h1 className="text-4xl xl:text-5xl 2xl:text-7xl font-moga text-[#8B4513] leading-tight mb-2">
                  Maerika 2k26
                </h1>

                <p className="text-xl xl:text-2xl text-[#8B4513] font-light tracking-widest">
                  2026-27
                </p>
              </div>

              {/* Description */}
              <p className="text-base xl:text-lg text-gray-700 leading-relaxed max-w-3xl">
                &apos;കലായുഗ ഭാവുകം&apos; എന്ന പ്രമേയത്തിലൂടെ, യുവത്വത്തെ
                കാർന്നുതിന്നുന്ന ലഹരിയെന്ന വിപത്തിനെതിരെ കലയെയും അറിവിനെയും
                ഞങ്ങൾ ആയുധമാക്കുന്നു. ചിന്തകൾക്ക് മൂർച്ചകൂട്ടാനും
                സർഗശേഷികളെ നാടിന്റെ നന്മയ്ക്കായി വഴിതിരിച്ചുവിടാനും ഈ വേദി
                കരുത്തുപകരുന്നു. വിനാശകരമായ ലഹരിയുടെ വഴികളിൽ നിന്ന്
                കലയുടെയും സംസ്കാരത്തിന്റെയും വിശുദ്ധിയിലേക്ക് വിദ്യാർത്ഥി
                സമൂഹത്തെ കൈപിടിച്ചുയർത്താനുള്ള ഒരു സർഗ്ഗാത്മക
                മുന്നേറ്റമാണിത്.
              </p>

              {/* CTA Button */}
              <div>
                <Link href="/results">
                  <Button className="bg-[#FACC15] hover:bg-[#EAB308] text-black font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                    Click to Dive in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Score Pulse Section */}
      <section className="bg-[#fffcf5] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <LiveScorePulse
            teams={initialTeams}
            liveScores={initialLiveScores}
          />
        </div>
      </section>

      {/* 6-Photo Festival Highlights Gallery Section */}
      <section className="bg-[#fffcf5] py-6 sm:py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-3 text-xs sm:text-sm font-semibold">
              Festival Highlights · ഓർമ്മച്ചിത്രങ്ങൾ
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#8B4513] mb-3">
              Glimpses of Maerika
            </h2>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Capturing the vibrant moments, scholarly blessings, and artistic spirit of our cultural fest
            </p>
          </div>

          {/* Festival Highlights Gallery Section */}
          <div className="max-w-6xl mx-auto">
            {/* Responsive Grid for Festival Posters (3:4 portrait aspect) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-5 md:gap-6">
              {(showAllPhotos ? galleryPhotos : galleryPhotos.slice(0, 6)).map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer bg-amber-950/5 border border-amber-900/10"
                >
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Quick zoom badge */}
                  <div className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                  </div>

                  {/* Elegant overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 text-white">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Maerika Moment #{idx + 1}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base tracking-tight mt-0.5 text-white">
                      {photo.title}
                    </h4>
                    <p className="text-xs text-white/80 line-clamp-2 mt-1">
                      {photo.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* View All / Show Less Button */}
            {galleryPhotos.length > 6 && (
              <div className="text-center mt-8 sm:mt-10">
                <Button
                  variant="outline"
                  onClick={() => setShowAllPhotos(!showAllPhotos)}
                  className="border-amber-400/50 hover:bg-amber-100 text-[#8B4513] font-semibold px-6 sm:px-8 py-2.5 rounded-full shadow-sm hover:shadow transition-all text-sm sm:text-base"
                >
                  {showAllPhotos
                    ? "Show Less · കുറച്ചു കാണിക്കുക"
                    : `View All Posters (${galleryPhotos.length}) · കൂടുതൽ കാണുക`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Maerika Logo Section */}
      <section className="bg-[#fffcf5] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center max-w-3xl mx-auto px-4">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-3 sm:mb-4 text-xs sm:text-sm">
                About Maerika2k26
              </Badge>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#8B4513] mb-3 sm:mb-4">
                കലായുഗ ഭാവുകം
              </h2>

              <p className="text-gray-700 text-base sm:text-lg md:text-xl leading-relaxed">
                'കലായുഗ ഭാവുകം' എന്ന പ്രമേയത്തിലൂടെ, യുവത്വത്തെ കാർന്നുതിന്നുന്ന ലഹരിയെന്ന വിപത്തിനെതിരെ കലയെയും അറിവിനെയും ഞങ്ങൾ ആയുധമാക്കുന്നു. ചിന്തകൾക്ക് മൂർച്ചകൂട്ടാനും സർഗശേഷികളെ നാടിന്റെ നന്മയ്ക്കായി വഴിതിരിച്ചുവിടാനും ഈ വേദി കരുത്തുപകരുന്നു. വിനാശകരമായ ലഹരിയുടെ വഴികളിൽ നിന്ന് കലയുടെയും സംസ്കാരത്തിന്റെയും വിശുദ്ധിയിലേക്ക് വിദ്യാർത്ഥി സമൂഹത്തെ കൈപിടിച്ചുയർത്താനുള്ള ഒരു സർഗ്ഗാത്മക മുന്നേറ്റമാണിത്.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
              {[
                {
                  title: "Cultural Heritage",
                  copy: "We celebrate the diverse and rich art forms rooted in Islamic culture, from traditional calligraphy to contemporary expressions, preserving and promoting cultural appreciation.",
                  tag: "Cultural showcase",
                  icon: "🎨",
                },
                {
                  title: "Student Excellence",
                  copy: "A premier platform designed for students to showcase their talents, creativity, and artistic expression in a supportive and competitive environment.",
                  tag: "Talent platform",
                  icon: "⭐",
                },
                {
                  title: "Transparent Judging",
                  copy: "All scoring rules are codified in the platform. Every entry is auto-scored before human review, ensuring fairness and transparency in every evaluation.",
                  tag: "Fair evaluation",
                  icon: "⚖️",
                },
                {
                  title: "Live Updates",
                  copy: "Once admins approve submissions, both team and student scores refresh in seconds, keeping everyone connected to the action in real-time.",
                  tag: "Realtime sync",
                  icon: "⚡",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="bg-white border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 sm:p-6"
                >
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">
                    {item.icon}
                  </div>

                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-2 sm:mb-3 text-xs">
                    {item.tag}
                  </Badge>

                  <CardTitle className="text-lg sm:text-xl text-gray-900 mb-2 sm:mb-3">
                    {item.title}
                  </CardTitle>

                  <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.copy}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Control Room Section */}
      <section className="bg-gradient-to-br from-[#8B4513]/5 to-[#0d7377]/5 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 md:p-12 mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-8">
              <div className="flex-1">
                <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 mb-3 sm:mb-4 text-xs sm:text-sm">
                  Need help?
                </Badge>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#8B4513] mb-3 sm:mb-4">
                  Maerika 2k26 Control Room
                </h2>

                <p className="text-gray-700 text-base sm:text-lg leading-relaxed max-w-2xl">
                  Contact us for support, inquiries, or assistance with the
                  platform. Our team is here to help ensure a smooth and
                  enjoyable experience.
                </p>

                <div className="mt-4">
                  <Link href="/admin/login">
                    <Button
                      variant="secondary"
                      className="text-sm text-black font-normal"
                    >
                      Admin Login
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                  href="/jury/login"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:bg-gray-100 border border-gray-300 w-full sm:w-auto text-sm sm:text-base"
                  >
                    Jury Login
                  </Button>
                </Link>

                <Link
                  href="/team/login"
                  className="w-full sm:w-auto"
                >
                  <Button className="bg-[#8B4513] hover:bg-[#6B3410] text-white w-full sm:w-auto text-sm sm:text-base">
                    Team Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Lightbox Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl sm:max-w-3xl md:max-w-4xl w-full bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top controls: Counter and Close */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
              {currentPhotoIndex !== -1 && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-black/60 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                  {currentPhotoIndex + 1} / {galleryPhotos.length}
                </span>
              )}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors border border-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo with Prev / Next Navigation */}
            <div className="relative h-[65vh] sm:h-[75vh] max-h-[820px] w-full bg-black/95 flex items-center justify-center select-none">
              <Image
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                fill
                className="object-contain p-2 sm:p-4"
                sizes="(max-width: 1280px) 100vw, 1200px"
                priority
                unoptimized
              />

              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all border border-white/20 hover:scale-105"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all border border-white/20 hover:scale-105"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Info Bar */}
            <div className="p-4 sm:p-6 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-white/10">
              <div>
                <h3 className="text-base sm:text-xl font-bold text-amber-300">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">
                  {selectedPhoto.caption}
                </p>
              </div>
              <div className="text-xs text-gray-400 hidden sm:block shrink-0">
                Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono">→</kbd> keys to navigate
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}