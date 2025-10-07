import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageShellProps {
  /** Optional additional class names applied to the inner container */
  className?: string;
  /** Content rendered inside the shell */
  children: ReactNode;
  /** Controls how vibrant the gradient background should appear */
  tone?: "soft" | "vibrant";
}

/**
 * PageShell wraps top-level pages in a consistent gradient background and spacing.
 * It keeps decorative blobs behind the content so every page feels part of the same system.
 */
export default function PageShell({
  className,
  children,
  tone = "soft",
}: PageShellProps) {
  const background =
    tone === "vibrant"
      ? "bg-gradient-to-br from-sky-100 via-white to-rose-100"
      : "bg-gradient-to-br from-slate-50 via-white to-sky-50";

  return (
    <main className={cn("relative isolate overflow-hidden", background)}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-1/5 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/4 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute top-1/2 left-[-4rem] h-72 w-72 -translate-y-1/2 rounded-full bg-amber-200/25 blur-3xl" />
      </div>
      <div className={cn("container mx-auto px-4 py-16 sm:py-20 lg:py-24", className)}>
        {children}
      </div>
    </main>
  );
}
