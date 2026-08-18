// The neumorphic-glass icon wrapper: an embossed frosted-glass tile
// that any icon from components/ui/icons sits inside. Three sizes cover
// nav rows, dashboard cards, and hero moments (e.g. auth page header).
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const SIZE_MAP = {
  sm: { tile: "h-9 w-9", icon: 18 },
  md: { tile: "h-12 w-12", icon: 24 },
  lg: { tile: "h-16 w-16", icon: 32 },
} as const;

export interface IconTileProps {
  children: ReactNode;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export function IconTile({ children, size = "md", className }: IconTileProps) {
  const { tile } = SIZE_MAP[size];
  return (
    <div className={cn("neu-glass-tile", tile, className)}>
      {children}
    </div>
  );
}
