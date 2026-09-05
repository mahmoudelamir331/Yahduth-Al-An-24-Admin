"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
      className="interactive-button grid size-9 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground hover:text-primary"
      aria-label="رجوع"
      title="رجوع"
    >
      <ArrowRight size={17} />
    </button>
  );
}
