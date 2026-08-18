// Redirects to /login if there's no authenticated session. UI-level
// gate only, mirroring middleware/auth.ts's role on the API -- the API
// enforces this independently and is the real security boundary.
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/providers";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-leaf-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
