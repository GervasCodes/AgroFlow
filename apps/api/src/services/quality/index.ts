// Business logic for the "quality" (QualityInspection) domain. Unlike
// farms/produce-listings, inspections are NOT ownership-scoped to the
// caller -- an inspector (typically AGGREGATOR, sometimes ADMIN) can
// inspect any listing they're physically handling. quality_inspection:
// create is a pure capability check (middleware/rbac.ts); there is no
// additional per-instance ownership rule here.
//
// Recording an inspection also updates the listing's own qualityGrade
// field, so the grade shown in browse/detail views reflects the most
// recent inspection rather than only the seller's self-reported grade
// at listing time.
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateQualityInspectionInput } from "@agroflow/validation";
import { produceListingRepository, qualityInspectionRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

export async function listInspectionsForListing(listingId: string) {
  const listing = await produceListingRepository.findListingById(listingId);
  if (!listing) throw AppError.notFound("Produce listing not found");
  return qualityInspectionRepository.findInspectionsForListing(listingId);
}

export async function recordInspection(user: AuthenticatedUser, input: CreateQualityInspectionInput) {
  const listing = await produceListingRepository.findListingById(input.produceListingId);
  if (!listing) throw AppError.notFound("Produce listing not found");

  const inspection = await qualityInspectionRepository.createInspection({
    produceListingId: input.produceListingId,
    inspectorId: user.id,
    grade: input.grade,
    notes: input.notes,
    images: input.images,
  });

  await produceListingRepository.updateListingQualityGrade(input.produceListingId, input.grade);

  return inspection;
}
