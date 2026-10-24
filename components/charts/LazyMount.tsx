"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders `children` only once the placeholder scrolls near the viewport, so heavy chart code
 * isn't downloaded or executed until the reader gets there.
 */
export function LazyMount({
  children,
  minHeight = 360,
}: {
  children: ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  if (visible) return <>{children}</>;
  return (
    <div
      ref={ref}
      style={{ minHeight }}
      className="rounded-card border border-border bg-surface"
      aria-hidden="true"
    />
  );
}
