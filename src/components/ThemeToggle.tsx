"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button type="button" aria-label={isDark ? "الوضع الفاتح" : "الوضع الداكن"} title={isDark ? "الوضع الفاتح" : "الوضع الداكن"} onClick={() => setTheme(isDark ? "light" : "dark")} className="grid size-10 place-items-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
