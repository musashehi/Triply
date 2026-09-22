"use client";

import { useEffect, useState } from "react";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
};

export default function BlurText({
  text,
  className = "",
  delay = 70,
}: BlurTextProps) {
  const words = text.split(" ");
  const [visibleWords, setVisibleWords] = useState(0);

  useEffect(() => {
    setVisibleWords(0);

    const timers = words.map((_, index) =>
      setTimeout(() => {
        setVisibleWords(index + 1);
      }, index * delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [text, delay, words.length]);

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={`inline-block transition-all duration-700 ease-out ${
            index < visibleWords
              ? "translate-y-0 blur-none opacity-100"
              : "translate-y-3 blur-md opacity-0"
          }`}
        >
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}