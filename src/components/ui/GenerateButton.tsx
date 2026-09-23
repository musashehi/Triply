"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type GenerateButtonProps = {
  loading?: boolean;
  onClick?: () => void;
};

const loadingSteps = [
  {
    at: 0,
    text: "Preparing your journey...",
  },
  {
    at: 25,
    text: "Finding the best stops...",
  },
  {
    at: 50,
    text: "Building your itinerary...",
  },
  {
    at: 72,
    text: "Planning your days...",
  },
  {
    at: 88,
    text: "Mapping your route...",
  },
];

export default function GenerateButton({
  loading = false,
  onClick,
}: GenerateButtonProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    setProgress(4);

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) {
          return 94;
        }

        let increase = 1;

        if (current < 25) {
          increase = Math.random() * 4 + 2;
        } else if (current < 55) {
          increase = Math.random() * 2.5 + 1;
        } else if (current < 80) {
          increase = Math.random() * 1.5 + 0.5;
        } else {
          increase = Math.random() * 0.6 + 0.2;
        }

        return Math.min(94, current + increase);
      });
    }, 500);

    return () => window.clearInterval(interval);
  }, [loading]);

  const currentStep =
    [...loadingSteps]
      .reverse()
      .find((step) => progress >= step.at)?.text ??
    "Preparing your journey...";

  if (loading) {
    return (
      <div className="mt-2 w-full overflow-hidden rounded-[22px] bg-black px-5 py-4 text-white shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
        
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Triply AI
            </p>

            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="mt-1 text-sm font-semibold"
              >
                {currentStep}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.span
            key={Math.round(progress)}
            className="text-xs font-semibold tabular-nums text-white/60"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>

        
        <div className="relative mt-5 h-8">
          
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-white"
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>

          
          <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-black">
            <motion.div
              className="absolute inset-[-5px] rounded-full border border-white/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>

          
          <motion.div
            className="absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm text-black shadow-[0_4px_18px_rgba(255,255,255,0.25)]"
            animate={{
              left: `calc(${progress}% - 16px)`,
              y: [0, -2, 0, 2, 0],
              rotate: [0, -3, 0, 3, 0],
            }}
            transition={{
              left: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              },
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            ✈
          </motion.div>
        </div>

        
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-white/30">
            Your destination
          </span>

          <span className="flex items-center gap-1.5 text-[10px] text-white/40">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-white"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
              }}
            />
            AI is planning
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative mt-2 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-black px-6 text-sm font-semibold text-white"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        initial={{ x: "-120%" }}
        whileHover={{ x: "120%" }}
        transition={{ duration: 0.7 }}
      />

      <span className="relative z-10 flex items-center gap-2">
        <motion.span
          animate={{
            x: [0, 2, 0],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ✈
        </motion.span>

        Generate my trip

        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </span>
    </motion.button>
  );
}