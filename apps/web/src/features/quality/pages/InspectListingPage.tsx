// Reached from a listing card in Produce > Browse ("Inspect"). Records
// a QualityInspection against the listing, which also updates the
// listing's own qualityGrade (see apps/api's services/quality).
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createQualityInspectionSchema } from "@agroflow/validation";
import { QUALITY_GRADES } from "@agroflow/config";
import { Button, GlassCard, Select, IconTile, ShieldCheckIcon, type SelectOption } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { ApiClientError } from "@agroflow/api-client";

const gradeOptions: SelectOption[] = QUALITY_GRADES.map((g) => ({ value: g, label: g.replaceAll("_", " ") }));

export function InspectListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings } = useQuery({
    queryKey: ["produce-listings", "browse"],
    queryFn: () => client.produceListings.browse(),
  });
  const listing = listings?.find((l) => l.id === listingId);

  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: client.qualityInspections.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produce-listings"] });
      navigate("/produce");
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Could not save inspection."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!listingId) return;

    const parsed = createQualityInspectionSchema.safeParse({
      produceListingId: listingId,
      grade: grade || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setFieldErrors({ grade: parsed.error.flatten().fieldErrors.grade?.[0] ?? "" });
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <IconTile size="md">
          <ShieldCheckIcon size={22} />
        </IconTile>
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-950">Record inspection</h1>
          {listing && (
            <p className="text-sm text-leaf-900/60">
              {listing.quantity} {listing.unit.toLowerCase()} {listing.crop.name.toLowerCase()} from{" "}
              {listing.farm.name}
            </p>
          )}
        </div>
      </div>

      <GlassCard strong className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Select
            label="Quality grade"
            placeholder="Select grade"
            options={gradeOptions}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            error={fieldErrors.grade}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-semibold text-leaf-900">
              Notes
            </label>
            <textarea
              id="notes"
              className="glass-input min-h-[100px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional -- moisture, damage, uniformity, etc."
            />
          </div>

          {formError && (
            <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
              {formError}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <Button type="submit" size="lg" isLoading={mutation.isPending} className="flex-1">
              Save inspection
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
