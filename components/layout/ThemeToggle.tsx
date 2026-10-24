"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readTheme(): Theme {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const next = () => {
    const t = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system";
    setTheme(t);
    try {
      if (t === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", t);
    } catch {
      // storage unavailable; theme still applies for this page view
    }
    apply(t);
  };

  return (
    <button
      type="button"
      onClick={next}
      className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
      aria-label={`Color theme: ${LABEL[theme]}. Click to change.`}
    >
      <span aria-hidden="true">{theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🖥️"}</span>
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </button>
  );
}
