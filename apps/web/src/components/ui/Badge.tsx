// Status chip -- used for ProduceListing/Order/Shipment statuses etc.
// Color is driven by semantic `tone`, not by the raw status string, so
// new statuses in later phases just need a tone assignment, not a new
// component.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-leaf-900/8 text-leaf-900",
  success: "bg-leaf-500/15 text-leaf-700",
  warning: "bg-harvest-400/20 text-harvest-800",
  danger: "bg-rust-500/15 text-rust-600",
  info: "bg-clay-500/15 text-clay-600",
};

export interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
