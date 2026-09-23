"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import Image from "next/image";
import { Crown, ChevronLeft, ChevronRight, Phone, Mail, Quote, Sparkles } from "lucide-react";
import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TeamLeadersShowcaseProps {
  teams: Team[];
}

import { getTeamPalette } from "@/lib/team-colors";

function parseLeaders(leaderString: string): string[] {
  return leaderString
    .split(/[&,]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /^(https?:\/\/|\/)/i.test(url);
}

function getLeaderPhoto(leaderPhoto: string | undefined | null, leaderIndex: number): string {
  if (!isValidImageUrl(leaderPhoto) || leaderPhoto?.includes("1546456073-92b9f0a8d1d6")) {
    return `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80&seed=${leaderIndex}`;
  }
  if (leaderPhoto?.includes('?')) {
    return leaderPhoto;
  }
  return `${leaderPhoto}?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
}

export function TeamLeadersShowcase({ teams }: TeamLeadersShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Configuration
  const CARD_WIDTH = 340;
  const GAP = 32;

  // Handle resize to keep centering correct
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? teams.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % teams.length);
  };

  // Calculate the center position
  useEffect(() => {
    if (!isDragging && containerWidth > 0) {
      const centerOffset = (containerWidth - CARD_WIDTH) / 2;
      const targetX = centerOffset - (currentIndex * (CARD_WIDTH + GAP));
      animate(x, targetX, {
        type: "spring",
        stiffness: 150,
        damping: 20,
        mass: 0.8
      });
    }
  }, [currentIndex, isDragging, containerWidth, x]);

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentX = x.get();
    const centerOffset = (containerWidth - CARD_WIDTH) / 2;
    // Reverse calculation to find index
    // x = centerOffset - (index * (width + gap))
    // index * (width + gap) = centerOffset - x
    // index = (centerOffset - x) / (width + gap)
    const rawIndex = (centerOffset - currentX) / (CARD_WIDTH + GAP);
    const newIndex = Math.round(rawIndex);
    const clampedIndex = Math.max(0, Math.min(newIndex, teams.length - 1));

    setCurrentIndex(clampedIndex);
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Abstract Background Shapes */}


      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm"
          >
            <Crown className="w-4 h-4 text-[#8B4513]" />
            <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">Team Captains</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif text-gray-900 tracking-tight"
          >
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B4513] to-[#D2691E]">Visionaries</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto font-light"
          >
            Meet the inspiring leaders guiding their teams towards excellence
          </motion.p>
        </div>

        {/* Carousel Container */}
        <div className="relative" ref={containerRef}>
          {/* Navigation Buttons (Desktop) */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 hidden lg:block">
            <button
              onClick={handlePrev}
              className="p-4 rounded-full bg-white shadow-xl border border-gray-100 text-gray-700 hover:text-[#8B4513] hover:scale-110 transition-all disabled:opacity-50"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 hidden lg:block">
            <button
              onClick={handleNext}
              className="p-4 rounded-full bg-white shadow-xl border border-gray-100 text-gray-700 hover:text-[#8B4513] hover:scale-110 transition-all disabled:opacity-50"
              disabled={currentIndex === teams.length - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Draggable Track */}
          <div className="overflow-hidden py-12 -my-12">
            <motion.div
              style={{ x }}
              drag="x"
              dragConstraints={{
                left: -((teams.length - 1) * (CARD_WIDTH + GAP)),
                right: 0
              }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              className="flex items-center cursor-grab active:cursor-grabbing"
            >
              {teams.map((team, index) => {
                const leaders = parseLeaders(team.leader);
                const colors = getTeamPalette(team.color, index);

                const isActive = index === currentIndex;

                return (
                  <motion.div
                    key={team.id}
                    className="shrink-0 relative"
                    style={{
                      width: CARD_WIDTH,
                      marginRight: index === teams.length - 1 ? 0 : GAP
                    }}
                    animate={{
                      scale: isActive ? 1 : 0.9,
                      opacity: isActive ? 1 : 0.6,
                      y: isActive ? 0 : 20,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Card */}
                    <div
                      className={cn(
                        "relative bg-white rounded-[2rem] overflow-hidden transition-all duration-500 group",
                        isActive ? "shadow-2xl" : "shadow-lg"
                      )}
                      style={{
                        boxShadow: isActive ? `0 25px 50px -12px ${colors.glow}` : undefined
                      }}
                    >
                      {/* Decorative Header */}
                      <div
                        className="h-32 relative overflow-hidden"
                        style={{ background: colors.gradient }}
                      >
                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold tracking-widest uppercase">
                            {team.name}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="px-8 pb-8 pt-16 text-center relative">
                        {/* Floating Avatar(s) */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                          {leaders.length > 1 && !isValidImageUrl(team.leader_photo) ? (
                            <div className="flex -space-x-4">
                              {leaders.slice(0, 2).map((leader, i) => (
                                <div key={i} className={cn(
                                  "relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100",
                                  i === 1 ? "mt-4" : "z-10"
                                )}>
                                  <Image
                                    src={getLeaderPhoto(team.leader_photo, i)}
                                    alt={leader}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-gray-100 relative z-10">
                                <Image
                                  src={getLeaderPhoto(team.leader_photo, 0)}
                                  alt={leaders[0]}
                                  fill
                                  sizes="128px"
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              </div>
                              {/* Glowing Ring */}
                              <div
                                className="absolute inset-0 rounded-full blur-xl opacity-50 -z-10 scale-110"
                                style={{ backgroundColor: colors.primary }}
                              />

                              <div className="absolute bottom-2 right-0 z-20 bg-yellow-400 text-white p-2 rounded-full border-4 border-white shadow-lg">
                                <Crown className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Names */}
                        <div className="mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {leaders.length > 1 ? (
                              <span className="flex flex-col">
                                <span>{leaders[0]}</span>
                                <span className="text-lg text-gray-500 font-medium">& {leaders[1]}</span>
                              </span>
                            ) : (
                              leaders[0]
                            )}
                          </h3>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Captain</span>
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                          </div>
                        </div>

                        {/* Quote */}
                        <div className="relative mb-8">
                          <Quote className="w-8 h-8 text-gray-100 absolute -top-4 -left-2 -z-10" />
                          <p className="text-gray-600 text-sm italic leading-relaxed relative z-10">
                            "{team.description || "Leading with passion, inspiring with action, and striving for victory."}"
                          </p>
                        </div>

                        {/* Contact Action */}
                        {team.contact ? (
                          <a
                            href={`tel:${team.contact}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 w-full justify-center group/btn hover:opacity-90"
                            style={{
                              backgroundColor: colors.light,
                              color: colors.primary,
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            <Phone className="w-4 h-4" />
                            <span>Contact Captain</span>
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium w-full justify-center cursor-not-allowed">
                            <Mail className="w-4 h-4" />
                            <span>Private Contact</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {teams.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  currentIndex === idx ? "w-8 bg-[#8B4513]" : "w-2 bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
