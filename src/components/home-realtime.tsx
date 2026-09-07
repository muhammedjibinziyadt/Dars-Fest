"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { LiveScorePulse } from "@/components/live-score-pulse";
import { TeamLeadersShowcase } from "@/components/team-leaders-showcase";

import { useScoreboardUpdates } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";

interface HomeRealtimeProps {
  teams: Team[];
  liveScores: Map<string, number>;
}

export function HomeRealtime({ teams: initialTeams, liveScores: initialLiveScores }: HomeRealtimeProps) {
  const router = useRouter();

  useScoreboardUpdates(() => {
    router.refresh();
  });

  return (
    <main className="space-y-16">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FFFCF5]">

        {/* Decorative Sun/Starburst - Left (Half Visible) */}
        <div className="absolute top-3/4 left-0 -translate-y-1/2 -translate-x-1/2 w-20 h-20 md:w-40 md:h-40 opacity-90 animate-[sun-rotate_60s_linear_infinite]">
          <Image
            src="/img/assets/sun.webp"
            alt="Decoration Left"
            fill
            className="object-contain"
          />
        </div>

        {/* Decorative Sun/Starburst - Top Right (Half Visible) */}
        <div className="absolute top-20 right-0 translate-x-1/2 w-26 h-26 md:w-48 md:h-48 opacity-90 animate-[sun-rotate_60s_linear_infinite]">
          <Image
            src="/img/assets/sun.webp"
            alt="Decoration Right"
            fill
            className="object-contain"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-40 flex flex-col items-center text-center px-4 max-w-5xl -mt-10">

          {/* Small Star above Ship */}
          {/* <div className="relative w-8 h-8 sm:w-12 sm:h-12 mb-4 animate-[spin_12s_linear_infinite]">
            <Image
              src="/img/assets/sun.webp"
              alt="Star"
              fill
              className="object-contain"
            />
          </div> */}

          {/* Ship - Center */}
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-[300px] lg:h-[300px] mb-2">
            <Image
              src="/img/assets/ship.webp?v=2"
              alt="Ship"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Main Title - Charutha Font */}
          <div>
            <h1 className="text-[#A13A24] text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 font-['Charutha'] tracking-wide leading-5 md:leading-7">
              MAERIKA 2K26
            </h1>

            {/* Subtitle - Bricolage Font */}
            <h2 className="text-black text-xl sm:text-xl md:text-3xl font-['Bricolage'] mb-6 font-semibold tracking-tight">
              Showcasing Islamic Art & Culture
            </h2>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-3xl mx-auto mb-8 px-4 leading-5 font-light">
            For a hundred years, the Malabar coast has echoed with knowledge, faith, and art. Funoon
            Fiesta 2025–26 bridges this rich legacy with a new generation, honoring Samastha’s
            centenary under the theme “Shathakam Saakshi.”
          </p>

          {/* CTA Buttons */}
          <div className="relative z-50 flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/results">
              <div className="bg-[#F2C04D] hover:bg-[#dbb13d] text-black font-medium text-lg px-8 py-3 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-3 active:scale-95">
                Click to Dive In
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Desktop Waves - Responsive Width */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-[220px] lg:h-[260px] z-30 pointer-events-none overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-[200%] h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 2880 320">
            {/* Wave 3 (Back) - Period 720px (4 cycles) */}
            <path
              fill="#0891b2"
              fillOpacity="1"
              d="M0,230 
                 C240,180 480,280 720,230 
                 C960,180 1200,280 1440,230 
                 C1680,180 1920,280 2160,230 
                 C2400,180 2640,280 2880,230 
                 V320 H0 Z"
              className="animate-[wave-slide_20s_linear_infinite]"
              style={{ transformBox: 'fill-box' }}
            />
            {/* Wave 2 (Middle) - Period 480px (6 cycles) */}
            <path
              fill="#0e7490"
              fillOpacity="1"
              d="M0,260 
                 C160,220 320,300 480,260 
                 C640,220 800,300 960,260 
                 C1120,220 1280,300 1440,260 
                 C1600,220 1760,300 1920,260 
                 C2080,220 2240,300 2400,260 
                 C2560,220 2720,300 2880,260 
                 V320 H0 Z"
              className="animate-[wave-slide_15s_linear_infinite]"
              style={{ animationDirection: 'reverse' }}
            />
            {/* Wave 1 (Front) - Period 720px (4 cycles), Offset Phase */}
            <path
              fill="#155e75"
              fillOpacity="1"
              d="M0,290 
                 C240,340 480,240 720,290 
                 C960,340 1200,240 1440,290 
                 C1680,340 1920,240 2160,290 
                 C2400,340 2640,240 2880,290 
                 V320 H0 Z"
              className="animate-[wave-slide_12s_linear_infinite]"
            />
          </svg>
        </div>

        {/* Mobile Waves - Fixed Width & Taller */}
        <div className="md:hidden absolute bottom-0 left-0 w-full h-[320px] z-30 pointer-events-none overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-[2880px] h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 2880 320">
            {/* Wave 3 (Back) */}
            <path
              fill="#0891b2"
              fillOpacity="1"
              d="M0,230 C240,180 480,280 720,230 C960,180 1200,280 1440,230 C1680,180 1920,280 2160,230 C2400,180 2640,280 2880,230 V320 H0 Z"
              className="animate-[wave-slide_20s_linear_infinite]"
              style={{ transformBox: 'fill-box' }}
            />
            {/* Wave 2 (Middle) */}
            <path
              fill="#0e7490"
              fillOpacity="1"
              d="M0,260 C160,220 320,300 480,260 C640,220 800,300 960,260 C1120,220 1280,300 1440,260 C1600,220 1760,300 1920,260 C2080,220 2240,300 2400,260 C2560,220 2720,300 2880,260 V320 H0 Z"
              className="animate-[wave-slide_15s_linear_infinite]"
              style={{ animationDirection: 'reverse' }}
            />
            {/* Wave 1 (Front) */}
            <path
              fill="#155e75"
              fillOpacity="1"
              d="M0,290 C240,340 480,240 720,290 C960,340 1200,240 1440,290 C1680,340 1920,240 2160,290 C2400,340 2640,240 2880,290 V320 H0 Z"
              className="animate-[wave-slide_12s_linear_infinite]"
            />
          </svg>
        </div>
      </section>

      {/* Live Score Pulse Section */}
      <section className="bg-[#fffcf5] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <LiveScorePulse teams={initialTeams} liveScores={initialLiveScores} />
        </div>
      </section>


      {/* Team Leaders Section */}
      <section className="bg-white py-12 sm:py-16 md:py-20 relative overflow-hidden">

        {/* Decorative Sun - Top Left */}
        <div className="absolute top-10 left-0 -translate-x-1/2 -translate-y-1/4 w-32 h-32 md:w-64 md:h-64 opacity-20 animate-[sun-rotate_60s_linear_infinite] pointer-events-none z-20">
          <Image
            src="/img/assets/sun.webp"
            alt="Decorative Sun"
            fill
            className="object-contain"
          />
        </div>

        {/* Decorative Srang - Bottom Right */}
        <div className="absolute bottom-0 right-0 w-40 h-40 md:w-96 md:h-96 opacity-90 translate-y-1/6 translate-x-1/6 pointer-events-none z-20">
          <Image
            src="/img/assets/srang.png"
            alt="Decorative Srang"
            fill
            className="object-contain"
          />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8 relative z-10">
          <TeamLeadersShowcase teams={initialTeams} />
        </div>
      </section>


      {/* Control Room / Login Box Section */}
      <section className="py-8 sm:py-10 pb-24 sm:pb-28">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#8B4513]/25 via-amber-500/35 to-[#8B4513]/15 shadow-[0_8px_30px_rgba(139,69,19,0.06)]">
            <div className="bg-white/95 backdrop-blur-md rounded-[15px] p-5 sm:p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="flex items-start sm:items-center gap-3.5 flex-1">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-[#8B4513]/10 border border-amber-500/20 flex items-center justify-center text-[#8B4513] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-['Bricolage'] font-bold text-[#2A1810] tracking-tight">
                      Funoon Fiesta Control Room
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Portals
                    </span>
                  </div>
                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-xl">
                    Contact us for support, inquiries, or sign in to access Jury evaluations and Team dashboards.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                <Link
                  href="/jury/login"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-2xs"
                >
                  <span>Jury Login</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                </Link>

                <Link
                  href="/team/login"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-[#8B4513] to-[#A13A24] hover:from-[#75380c] hover:to-[#8c311c] shadow-sm shadow-[#8B4513]/25 hover:shadow-md hover:shadow-[#8B4513]/35 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Team Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Admin Portal"
                >
                  Admin
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
