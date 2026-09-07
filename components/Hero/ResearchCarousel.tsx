"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  LayoutDashboard,
  Layers,
  BrainCircuit,
  MessageSquare,
  Link2,
  LineChart,
  FileText,
  FolderClosed
} from "lucide-react";
import { CarouselWindow } from "./CarouselWindow";

// ─── Showcase items ────────────────────────────────────────────────────────────
const SHOWCASE_ITEMS = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    title: "Dashboard Overview", 
    subtitle: "Unified knowledge workspace & quick actions",
    icon: LayoutDashboard 
  },
  { 
    id: "workspace", 
    label: "Canvas", 
    title: "Research Workspace", 
    subtitle: "Multi-panel notes, topics & references",
    icon: Layers 
  },
  { 
    id: "ai_results", 
    label: "AI Engine", 
    title: "AI Research Engine", 
    subtitle: "Grounded synthesis with verified citations",
    icon: BrainCircuit 
  },
  { 
    id: "research_thread", 
    label: "Thread", 
    title: "Research Thread", 
    subtitle: "Context-aware conversational assistant",
    icon: MessageSquare 
  },
  { 
    id: "analyze_url", 
    label: "Collector", 
    title: "Quick URL Collector", 
    subtitle: "Instant YouTube transcript & article extractor",
    icon: Link2 
  },
  { 
    id: "insights", 
    label: "Insights", 
    title: "Insights & Takeaways", 
    subtitle: "Semantic summaries & key takeaways",
    icon: LineChart 
  },
  { 
    id: "create_view", 
    label: "Editor", 
    title: "Script Outline Editor", 
    subtitle: "Side-by-side video outline & narration drafting",
    icon: FileText 
  },
  { 
    id: "workspace_overview", 
    label: "Hub", 
    title: "Workspaces Hub", 
    subtitle: "Central library of active creator projects",
    icon: FolderClosed 
  },
];

const AUTOPLAY_DELAY = 4200; // 4.2 seconds per slide

function getCardOffset(index: number, activeIndex: number, total: number) {
  let diff = (index - activeIndex) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export function ResearchCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = SHOWCASE_ITEMS.length;

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((index + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay management
  useEffect(() => {
    if (!isPlaying || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, AUTOPLAY_DELAY);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const activeItem = SHOWCASE_ITEMS[currentIndex];

  return (
    <div 
      className="w-full max-w-[680px] flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Feature Pills Navigation ────────────────────────────────────── */}
      <div className="w-full mb-4 flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
        {SHOWCASE_ITEMS.map((item, idx) => {
          const isActive = idx === currentIndex;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => goToSlide(idx)}
              className={`relative px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
                isActive 
                  ? "text-primary-foreground font-semibold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Dynamic 3-Card Carousel Track (Center Card + 2 Side Cards) ───── */}
      <div className="relative w-full aspect-[16/10.2] min-h-[350px] sm:min-h-[380px] flex items-center justify-center overflow-hidden rounded-2xl py-2">
        
        {/* Soft Edge Fade to blend outer cards seamlessly */}
        <div 
          aria-hidden
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: "linear-gradient(to right, rgba(9,9,9,0.75) 0%, transparent 12%, transparent 88%, rgba(9,9,9,0.75) 100%)"
          }}
        />

        {/* Ambient Orange Glow behind center active card */}
        <div 
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full pointer-events-none opacity-35 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(235,69,17,0.4) 0%, rgba(235,69,17,0.08) 60%, transparent 80%)",
          }}
        />

        {/* Dynamic Cards Track */}
        <div className="relative w-full h-full flex items-center justify-center">
          {SHOWCASE_ITEMS.map((item, idx) => {
            const offset = getCardOffset(idx, currentIndex, total);
            const isCenter = offset === 0;
            const isLeft = offset === -1;
            const isRight = offset === 1;
            const isVisible = Math.abs(offset) <= 1;

            // Compute positions:
            // Center: x = 0%, scale = 1, zIndex = 25
            // Left: x = -66%, scale = 0.85, zIndex = 15
            // Right: x = 66%, scale = 0.85, zIndex = 15
            // Outside: offscreen with fade
            let xPos = "0%";
            let scale = 1;
            let opacity = 1;
            let zIndex = 25;

            if (isCenter) {
              xPos = "0%";
              scale = 1;
              opacity = 1;
              zIndex = 25;
            } else if (isLeft) {
              xPos = "-66%";
              scale = 0.85;
              opacity = 0.55;
              zIndex = 15;
            } else if (isRight) {
              xPos = "66%";
              scale = 0.85;
              opacity = 0.55;
              zIndex = 15;
            } else if (offset < -1) {
              xPos = "-120%";
              scale = 0.72;
              opacity = 0;
              zIndex = 5;
            } else {
              xPos = "120%";
              scale = 0.72;
              opacity = 0;
              zIndex = 5;
            }

            return (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  x: xPos,
                  scale,
                  opacity,
                  zIndex,
                }}
                transition={{
                  x: { type: "spring", stiffness: 280, damping: 30 },
                  scale: { type: "spring", stiffness: 280, damping: 30 },
                  opacity: { duration: 0.3 },
                  zIndex: { duration: 0 },
                }}
                onClick={() => {
                  if (isLeft) handlePrev();
                  if (isRight) handleNext();
                }}
                className={`absolute w-[76%] sm:w-[74%] h-full rounded-xl overflow-hidden shadow-2xl transition-shadow ${
                  isCenter 
                    ? "cursor-default shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(235,69,17,0.12)] border border-white/12 ring-1 ring-white/10" 
                    : "cursor-pointer border border-white/[0.06] hover:opacity-80"
                }`}
                style={{
                  top: 0,
                  willChange: "transform, opacity",
                }}
              >
                {/* Dark dimming overlay on side peek cards */}
                {!isCenter && (
                  <div 
                    aria-hidden
                    className="absolute inset-0 z-20 bg-black/45 hover:bg-black/30 transition-colors"
                  />
                )}

                {/* Card Content (Window Mockup) */}
                <div className="w-full h-full pointer-events-none sm:pointer-events-auto">
                  <CarouselWindow viewId={item.id} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Left/Right Arrow Overlays */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black/95 border border-white/15 hover:border-primary/60 text-white/80 hover:text-primary flex items-center justify-center backdrop-blur-md transition-all duration-200 z-40 shadow-xl group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black/95 border border-white/15 hover:border-primary/60 text-white/80 hover:text-primary flex items-center justify-center backdrop-blur-md transition-all duration-200 z-40 shadow-xl group"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>

      {/* ── Reference-style Navigation Dots (Elongated active pill + round dots) ── */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {SHOWCASE_ITEMS.map((_, dotIdx) => {
          const isActive = dotIdx === currentIndex;
          return (
            <button
              key={dotIdx}
              onClick={() => goToSlide(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className="relative py-1 px-0.5 focus:outline-none"
            >
              {isActive ? (
                <motion.div
                  layoutId="referenceActiveDot"
                  className="w-7 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(235,69,17,0.6)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Slide Info & Subtitle ────────────────────────────────────────── */}
      <div className="w-full mt-2.5 px-2 flex items-center justify-between text-xs">
        
        {/* Slide Counter & Title */}
        <div className="flex items-center gap-2 text-muted-foreground truncate">
          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
            {String(currentIndex + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
          <span className="font-semibold text-foreground text-[11px] truncate">
            {activeItem.title}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-muted-foreground/70 truncate">
            • {activeItem.subtitle}
          </span>
        </div>

        {/* Play/Pause Control */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
          title={isPlaying ? "Pause auto-advance" : "Resume auto-advance"}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-primary" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </button>

      </div>

      {/* Progress Bar (indicates autoplay timing) */}
      {isPlaying && !isHovered && (
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mt-2">
          <motion.div
            key={currentIndex}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTOPLAY_DELAY / 1000, ease: "linear" }}
            className="h-full bg-primary/70"
          />
        </div>
      )}
    </div>
  );
}
