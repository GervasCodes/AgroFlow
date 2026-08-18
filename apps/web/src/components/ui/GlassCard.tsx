// The base frosted-glass surface every panel, card and modal sits on.
// `strong` uses a more opaque/blurred variant for content that needs to
// stay legible over busier backgrounds (e.g. a map).
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  noPadding?: boolean;
}

export function GlassCard({ className, strong, noPadding, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(strong ? "glass-panel-strong" : "glass-panel", !noPadding && "p-6", className)}
      {...props}
    >
      <span className="glass-edge-highlight" aria-hidden="true" />
      {children}
    </div>
  );
}
