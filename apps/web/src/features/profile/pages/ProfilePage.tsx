// Profile -- who you are, which roles you hold (with the role-switcher
// for multi-role accounts, see RoleSwitcher/useActiveRole), and the
// request-a-role flow (Phase 1: registration no longer lets you
// self-select a role, this is how you get one afterwards).
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROLE_LABELS, ROLES, type RoleName } from "@agroflow/config";
import { requestRoleSchema } from "@agroflow/validation";
import type { RoleRequestStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { useActiveRole } from "@/hooks/useActiveRole";
import { Badge, Button, GlassCard, IconTile, Select, UserIcon, ShieldCheckIcon, type SelectOption } from "@/components/ui";
import { RoleSwitcher } from "@/app/layout/RoleSwitcher";
import { ApiClientError } from "@agroflow/api-client";

const REQUEST_TONE: Record<RoleRequestStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

// ADMIN can't be self-requested (see requestRoleSchema); don't offer it.
const REQUESTABLE_ROLES: SelectOption[] = ROLES.filter((r) => r !== "ADMIN").map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

export function ProfilePage() {
  const { user, client } = useAuth();
  const { roles } = useActiveRole();
  const queryClient = useQueryClient();

  const [role, setRole] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const myRequestsQuery = useQuery({ queryKey: ["role-requests", "mine"], queryFn: () => client.roleRequests.listMine() });

  const requestMutation = useMutation({
    mutationFn: client.roleRequests.request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-requests", "mine"] });
      setRole("");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not submit request."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = requestRoleSchema.safeParse({ role: role || undefined });
    if (!parsed.success) {
      setFormError(parsed.error.flatten().fieldErrors.role?.[0] ?? "Select a role to request.");
      return;
    }
    requestMutation.mutate(parsed.data);
  }

  if (!user) return null;

  const heldRoleNames = new Set(roles);
  const requestableOptions = REQUESTABLE_ROLES.filter((opt) => !heldRoleNames.has(opt.value as RoleName));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <IconTile size="md">
          <UserIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">{user.fullName}</h1>
          <p className="text-sm text-leaf-900/60">{user.phoneNumber}</p>
        </div>
      </div>

      <GlassCard className="mb-6 animate-rise-in">
        <h2 className="mb-3 font-display text-lg font-semibold text-leaf-950">Your roles</h2>
        {roles.length === 0 ? (
          <p className="text-sm text-leaf-900/60">You don't have a role yet -- request one below.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <Badge key={r} tone="success">
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
            </div>
            {roles.length > 1 && (
              <>
                <p className="mb-2 text-sm text-leaf-900/60">Acting as:</p>
                <RoleSwitcher />
              </>
            )}
          </>
        )}
      </GlassCard>

      <GlassCard strong className="mb-6 p-7">
        <h2 className="mb-3 font-display text-lg font-semibold text-leaf-950">Request a role</h2>
        <p className="mb-4 text-sm text-leaf-900/60">
          An admin reviews every request before it's granted.
        </p>
        {requestableOptions.length === 0 ? (
          <p className="text-sm text-leaf-900/60">You already hold every requestable role.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Select label="Role" placeholder="Select a role" options={requestableOptions} value={role} onChange={(e) => setRole(e.target.value)} />
            {formError && <p className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">{formError}</p>}
            <Button type="submit" isLoading={requestMutation.isPending}>
              Submit request
            </Button>
          </form>
        )}
      </GlassCard>

      <h2 className="mb-3 font-display text-lg font-semibold text-leaf-950">Your requests</h2>
      {myRequestsQuery.isLoading ? (
        <p className="text-sm text-leaf-900/50">Loading...</p>
      ) : (myRequestsQuery.data ?? []).length === 0 ? (
        <p className="text-sm text-leaf-900/50">No role requests yet.</p>
      ) : (
        <div className="grid gap-3">
          {myRequestsQuery.data!.map((rr) => (
            <GlassCard key={rr.id} className="animate-rise-in">
              <div className="flex items-center gap-3">
                <IconTile size="sm">
                  <ShieldCheckIcon size={16} />
                </IconTile>
                <p className="flex-1 font-semibold text-leaf-950">{ROLE_LABELS[rr.requestedRole]}</p>
                <Badge tone={REQUEST_TONE[rr.status]}>{rr.status}</Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
