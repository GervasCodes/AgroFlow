// A react-router <Link> styled identically to <Button> -- for
// navigation actions ("Add farm", "View details") that should look
// like buttons but must render an <a>, not a <button>.
import { Link, type LinkProps } from "react-router-dom";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "./Button";

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
