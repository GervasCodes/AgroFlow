// Shared shell for Login/Register: a full-bleed glass card on mobile,
// and on larger screens a two-pane layout with a leaf/harvest gradient
// hero panel on the left carrying the brand moment, form on the right.
// Mobile-first: the hero pane is `hidden` below lg, never squeezed.
import type { ReactNode } from "react";
import { GlassCard, IconTile } from "@/components/ui";

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden lg:flex">
      {/* Decorative ambient blobs -- the "living field behind frosted glass" */}
      <div
        className="pointer-events-none absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-leaf-400/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-[22rem] w-[22rem] rounded-full bg-harvest-300/30 blur-3xl"
        aria-hidden="true"
      />

      {/* Hero pane -- desktop/tablet only */}
      <div className="relative hidden w-1/2 flex-col justify-between p-14 lg:flex">
        <div className="flex items-center gap-3">
          <IconTile size="md">
            <img src="/brand/agroflow-mark.png" alt="AgroFlow" className="h-7 w-7 object-contain" />
          </IconTile>
          <span className="font-display text-xl font-semibold text-leaf-900">AgroFlow</span>
        </div>

        <div className="max-w-md animate-rise-in">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-harvest-700">
            Kutoka shambani hadi sokoni
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-leaf-950">
            One connected market, from farm to buyer.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-leaf-900/70">
            AgroFlow links farmers, aggregators, transporters and buyers across
            Tanzania in one place -- so a harvest finds its buyer faster, and a
            fair price reaches the farmer who grew it.
          </p>
        </div>

        <p className="text-xs text-leaf-900/40">© {new Date().getFullYear()} AgroFlow</p>
      </div>

      {/* Form pane */}
      <div className="relative flex min-h-dvh w-full items-center justify-center p-5 lg:w-1/2 lg:p-14">
        <div className="w-full max-w-md animate-rise-in">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <IconTile size="sm">
              <img src="/brand/agroflow-mark.png" alt="AgroFlow" className="h-5 w-5 object-contain" />
            </IconTile>
            <span className="font-display text-lg font-semibold text-leaf-900">AgroFlow</span>
          </div>

          <GlassCard strong className="p-7 sm:p-9">
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-harvest-700">
              {eyebrow}
            </p>
            <h2 className="mb-1 font-display text-2xl font-semibold text-leaf-950 sm:text-3xl">
              {title}
            </h2>
            <p className="mb-6 text-[15px] text-leaf-900/60">{subtitle}</p>
            {children}
          </GlassCard>

          <div className="mt-6 text-center text-sm text-leaf-900/60">{footer}</div>
        </div>
      </div>
    </div>
  );
}
