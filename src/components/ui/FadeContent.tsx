"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

type FadeContentProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export default function FadeContent({
  children,
  delay = 0,
  className = "",
}: FadeContentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`${className} transition-all duration-700 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}