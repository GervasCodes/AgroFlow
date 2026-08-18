// Empty-state block -- an invitation to act, not a dead end. Used
// wherever a list has zero items (no farms yet, no listings yet, ...).
import type { ReactNode } from "react";
import { IconTile } from "./IconTile";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-leaf-900/15 px-6 py-12 text-center">
      <IconTile size="lg">{icon}</IconTile>
      <h3 className="font-display text-lg font-semibold text-leaf-950">{title}</h3>
      <p className="max-w-sm text-sm text-leaf-900/60">{description}</p>
      {action}
    </div>
  );
}
