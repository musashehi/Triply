"use client";

import { useEffect, useState } from "react";

type CountUpProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
};

export default function CountUp({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(value * easedProgress)
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    }

    animationFrame =
      requestAnimationFrame(animate);

    return () =>
      cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </>
  );
}