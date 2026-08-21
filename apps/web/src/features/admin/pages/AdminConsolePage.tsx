// Admin Console -- three tabs: Users (verify/monitor who's registered),
// Role Requests (approve/reject, Phase 1's role-request flow), and
// Disputes (resolve/dismiss, Phase 3's Trust domain). All three actions
// this page exposes are gated server-side by role:approve/dispute:approve
// (see middleware/rbac.ts) -- the "Admin" nav item itself is only shown
// to users with role:approve (see AppShell), but the API is the real
// boundary regardless of what this page renders.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROLE_LABELS } from "@agroflow/config";
import type { DisputeStatus, RoleRequestStatus } from "@agroflow/types";
import { useAuth } from "@/app/providers";
import { Badge, Button, EmptyState, GlassCard, IconTile, ShieldCheckIcon, UserIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ApiClientError } from "@agroflow/api-client";

const ROLE_REQUEST_TONE: Record<RoleRequestStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const DISPUTE_TONE: Record<DisputeStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED: "success",
  DISMISSED: "neutral",
};

const TABS = ["users", "role-requests", "disputes"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { users: "Users", "role-requests": "Role requests", disputes: "Disputes" };

export function AdminConsolePage() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("role-requests");

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => client.users.list(),
    enabled: tab === "users",
  });
  const roleRequestsQuery = useQuery({
    queryKey: ["admin", "role-requests"],
    queryFn: () => client.roleRequests.listPending(),
    enabled: tab === "role-requests",
  });
  const disputesQuery = useQuery({
    queryKey: ["admin", "disputes"],
    queryFn: () => client.disputes.listOpen(),
    enabled: tab === "disputes",
  });

  const approveRoleMutation = useMutation({
    mutationFn: (id: string) => client.roleRequests.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "role-requests"] }),
  });
  const rejectRoleMutation = useMutation({
    mutationFn: (id: string) => client.roleRequests.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "role-requests"] }),
  });
  const resolveDisputeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "RESOLVED" | "DISMISSED" }) =>
      client.disputes.resolve(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] }),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-950">Admin Console</h1>
        <p className="text-sm text-leaf-900/60">Verify users, review role requests, and resolve disputes.</p>
      </div>

      <div className="mb-6 inline-flex rounded-2xl bg-leaf-900/5 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t ? "bg-white shadow-glass-sm text-leaf-900" : "text-leaf-900/50",
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "users" &&
        (usersQuery.isLoading ? (
          <p className="text-sm text-leaf-900/50">Loading...</p>
        ) : (usersQuery.data ?? []).length === 0 ? (
          <EmptyState icon={<UserIcon size={30} />} title="No users yet" description="Registered accounts show up here." />
        ) : (
          <div className="grid gap-3">
            {usersQuery.data!.map((u) => (
              <GlassCard key={u.id} className="animate-rise-in">
                <div className="flex items-center gap-3">
                  <IconTile size="sm">
                    <UserIcon size={16} />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-leaf-950">{u.fullName}</p>
                    <p className="text-sm text-leaf-900/60">{u.phoneNumber}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {u.roles.length === 0 ? (
                      <Badge tone="neutral">No role yet</Badge>
                    ) : (
                      u.roles.map((ur) => (
                        <Badge key={ur.id} tone="success">
                          {ROLE_LABELS[ur.role.name]}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ))}

      {tab === "role-requests" &&
        (roleRequestsQuery.isLoading ? (
          <p className="text-sm text-leaf-900/50">Loading...</p>
        ) : (roleRequestsQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={<ShieldCheckIcon size={30} />}
            title="No pending role requests"
            description="Requests a user submits show up here for review."
          />
        ) : (
          <div className="grid gap-3">
            {roleRequestsQuery.data!.map((rr) => (
              <GlassCard key={rr.id} className="animate-rise-in">
                <div className="flex items-center gap-3">
                  <IconTile size="sm">
                    <ShieldCheckIcon size={16} />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-leaf-950">
                      {rr.user?.fullName ?? "Unknown user"} &rarr; {ROLE_LABELS[rr.requestedRole]}
                    </p>
                    <p className="text-sm text-leaf-900/60">{rr.user?.phoneNumber}</p>
                  </div>
                  <Badge tone={ROLE_REQUEST_TONE[rr.status]}>{rr.status}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    isLoading={approveRoleMutation.isPending && approveRoleMutation.variables === rr.id}
                    onClick={() => approveRoleMutation.mutate(rr.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={rejectRoleMutation.isPending && rejectRoleMutation.variables === rr.id}
                    onClick={() => rejectRoleMutation.mutate(rr.id)}
                  >
                    Reject
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        ))}

      {tab === "disputes" &&
        (disputesQuery.isLoading ? (
          <p className="text-sm text-leaf-900/50">Loading...</p>
        ) : (disputesQuery.data ?? []).length === 0 ? (
          <EmptyState icon={<ShieldCheckIcon size={30} />} title="No open disputes" description="Raised disputes show up here." />
        ) : (
          <div className="grid gap-3">
            {disputesQuery.data!.map((d) => (
              <GlassCard key={d.id} className="animate-rise-in">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm text-leaf-900/80">{d.reason}</p>
                  <Badge tone={DISPUTE_TONE[d.status]}>{d.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-xs text-leaf-900/50">Order {d.purchaseOrderId.slice(0, 8)}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    isLoading={
                      resolveDisputeMutation.isPending && resolveDisputeMutation.variables?.id === d.id &&
                      resolveDisputeMutation.variables?.status === "RESOLVED"
                    }
                    onClick={() => resolveDisputeMutation.mutate({ id: d.id, status: "RESOLVED" })}
                  >
                    Mark resolved
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={
                      resolveDisputeMutation.isPending && resolveDisputeMutation.variables?.id === d.id &&
                      resolveDisputeMutation.variables?.status === "DISMISSED"
                    }
                    onClick={() => resolveDisputeMutation.mutate({ id: d.id, status: "DISMISSED" })}
                  >
                    Dismiss
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        ))}
    </div>
  );
}
