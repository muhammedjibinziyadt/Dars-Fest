"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Menu, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";
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
            className="object-cover object-bottom"
            priority
            style={{ width: '100%' }}
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
                  alt="Funoon Fiesta Logo"
                  fill
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
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Description - Centered (Mobile) */}
            <div className="text-center space-y-4 px-4">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-lg mx-auto">
                For a hundred years, the Malabar coast has carried the rhythm of a community shaped by knowledge, faith, and artistic expression.
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
                      alt="Funoon Fiesta Logo"
                      fill
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
                      alt="ശതകം സാക്ഷി"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Main Title */}
              <div>
                <h1 className="text-4xl xl:text-5xl 2xl:text-7xl font-serif text-[#8B4513] leading-15 mb-2 ">
                  Funoon Fiesta
                </h1>
                <p className="text-xl xl:text-2xl text-[#8B4513] font-light tracking-widest">
                  2025 - 26
                </p>
              </div>

              {/* Description */}
              <p className="text-xm xl:text-md text-gray-700 leading-relaxed max-w-3xl">
                For a hundred years, the Malabar coast has carried the rhythm of a community shaped by knowledge, faith, and artistic expression. Funoon Fiesta 2025-26 is the creative bridge that connects this century-long legacy to a new generation. Rooted in the centenary of Samastha Kerala Jamiyyathul Ulama, this edition proudly carries the theme "Shathakam Saakshi" – a tribute to the scholars, institutions, and countless individuals who illuminated our path.
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
          <LiveScorePulse teams={initialTeams} liveScores={initialLiveScores} />
        </div>
      </section>

      {/* Team Leaders Section */}
      <section className="bg-white py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <TeamLeadersShowcase teams={initialTeams} />
        </div>
      </section>

      {/* About Funoon Fiesta Section */}
      <section className="bg-[#fffcf5] py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center max-w-3xl mx-auto px-4">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-3 sm:mb-4 text-xs sm:text-sm">About Funoon Fiesta</Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#8B4513] mb-3 sm:mb-4">
                Celebrating Islamic Art & Culture
              </h2>
              <p className="text-gray-700 text-base sm:text-lg md:text-xl leading-relaxed">
                Funoon Fiesta is a premier platform for students to showcase their talents and highlight 
                the rich art forms of Islamic culture. Through music, calligraphy, poetry, traditional 
                dance, visual arts, and more, we present these beautiful expressions to a wider audience, 
                fostering creativity, cultural appreciation, and artistic excellence.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
              {[
                { 
                  title: "Cultural Heritage", 
                  copy: "We celebrate the diverse and rich art forms rooted in Islamic culture, from traditional calligraphy to contemporary expressions, preserving and promoting cultural appreciation.", 
                  tag: "Cultural showcase",
                  icon: "🎨"
                },
                { 
                  title: "Student Excellence", 
                  copy: "A premier platform designed for students to showcase their talents, creativity, and artistic expression in a supportive and competitive environment.", 
                  tag: "Talent platform",
                  icon: "⭐"
                },
                { 
                  title: "Transparent Judging", 
                  copy: "All scoring rules are codified in the platform. Every entry is auto-scored before human review, ensuring fairness and transparency in every evaluation.", 
                  tag: "Fair evaluation",
                  icon: "⚖️"
                },
                { 
                  title: "Live Updates", 
                  copy: "Once admins approve submissions, both team and student scores refresh in seconds, keeping everyone connected to the action in real-time.", 
                  tag: "Realtime sync",
                  icon: "⚡"
                },
              ].map((item) => (
                <Card key={item.title} className="bg-white border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 sm:p-6">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{item.icon}</div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-2 sm:mb-3 text-xs">{item.tag}</Badge>
                  <CardTitle className="text-lg sm:text-xl text-gray-900 mb-2 sm:mb-3">{item.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.copy}</CardDescription>
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
                <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 mb-3 sm:mb-4 text-xs sm:text-sm">Need help?</Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#8B4513] mb-3 sm:mb-4">
                  Funoon Fiesta Control Room
                </h2>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed max-w-2xl">
                  Contact us for support, inquiries, or assistance with the platform. 
                  Our team is here to help ensure a smooth and enjoyable experience.
                  <Link href="/admin/login" className="">
                  <Button variant="secondary" className="text-sm text-black font-normal">
                    Admin Login
                  </Button>
                </Link>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link href="/jury/login" className="w-full sm:w-auto">
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 border border-gray-300 w-full sm:w-auto text-sm sm:text-base">
                    Jury Login
                  </Button>
                </Link>
                <Link href="/team/login" className="w-full sm:w-auto">
                  <Button className="bg-[#8B4513] hover:bg-[#6B3410] text-white w-full sm:w-auto text-sm sm:text-base">
                    Team Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}








