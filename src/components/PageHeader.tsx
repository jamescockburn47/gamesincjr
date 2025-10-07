import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Optional eyebrow copy rendered above the title */
  eyebrow?: string;
  /** Main headline for the page */
  title: string;
  /** Supporting copy shown under the title */
  description?: ReactNode;
  /** Slot for buttons or links that align next to the copy */
  actions?: ReactNode;
  /** Controls text alignment */
  align?: "left" | "center";
}

/**
 * PageHeader keeps hero copy consistent between routes. It optionally renders
 * an action area so pages can surface secondary buttons without bespoke markup.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "center",
}: PageHeaderProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <header className={cn("flex flex-col gap-6 sm:gap-8", alignment)}>
      <div className="flex flex-col gap-4">
        {eyebrow && (
          <span className="inline-flex items-center justify-center rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 shadow-sm ring-1 ring-sky-100">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className={cn("flex flex-col gap-3 sm:flex-row", align === "center" ? "justify-center" : "justify-start")}>{actions}</div>
      )}
    </header>
  );
}
