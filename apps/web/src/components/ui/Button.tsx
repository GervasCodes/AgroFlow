// Primary UI button. Every clickable action in the app uses this --
// never a raw <button> with inline Tailwind classes. `buttonClasses` is
// exported so <LinkButton> (react-router <Link> styled identically) can
// share the exact same visual treatment without nesting an <a> inside
// a <button>.
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-leaf-600 to-leaf-700 text-white shadow-glass hover:from-leaf-500 hover:to-leaf-600 active:from-leaf-700 active:to-leaf-800",
  secondary:
    "bg-white/70 backdrop-blur-md text-leaf-900 border border-leaf-900/10 shadow-glass-sm hover:bg-white/90",
  ghost: "bg-transparent text-leaf-800 hover:bg-leaf-900/5",
  danger:
    "bg-gradient-to-br from-rust-500 to-rust-600 text-white shadow-glass hover:from-rust-600 hover:to-rust-600",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-5 text-[15px] rounded-2xl",
  lg: "h-13 px-6 text-base rounded-2xl",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-500",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {isLoading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
