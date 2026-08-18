// Business logic for the "produce" (ProduceListing) domain. A listing
// can only be created/edited by the owner of the farm it belongs to
// (or ADMIN) -- mirrors the ownership pattern in services/farms.
// PUBLISHED listings are the only ones visible to buyers/aggregators
// browsing the marketplace (Phase 5's Marketplace-domain read side);
// matching/purchase-order logic itself lands once that domain's schema
// exists.
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateProduceListingInput } from "@agroflow/validation";
import { farmRepository, cropRepository, produceListingRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

async function assertFarmOwnership(user: AuthenticatedUser, farmId: string) {
  const farm = await farmRepository.findFarmById(farmId);
  if (!farm) throw AppError.notFound("Farm not found");
  if (farm.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only list produce from your own farms");
  }
  return farm;
}

export function listMyListings(user: AuthenticatedUser) {
  return produceListingRepository.findListingsByFarmOwner(user.id);
}

export function browsePublishedListings(filters: { crop?: string; regionId?: string }) {
  return (async () => {
    const cropId = filters.crop ? (await cropRepository.findCropByName(filters.crop))?.id : undefined;
    return produceListingRepository.findPublishedListings({ cropId, regionId: filters.regionId });
  })();
}

export async function createListing(user: AuthenticatedUser, input: CreateProduceListingInput) {
  await assertFarmOwnership(user, input.farmId);

  const crop = await cropRepository.findCropByName(input.crop);
  if (!crop) throw AppError.badRequest(`Unknown crop: ${input.crop}`);

  return produceListingRepository.createListing({
    farmId: input.farmId,
    cropId: crop.id,
    quantity: input.quantity,
    unit: input.unit,
    qualityGrade: input.qualityGrade,
    pricePerUnit: input.pricePerUnit,
    availableFrom: new Date(input.availableFrom),
    images: input.images,
    createdByChannel: "WEB",
  });
}

export async function publishListing(user: AuthenticatedUser, listingId: string) {
  const listing = await produceListingRepository.findListingById(listingId);
  if (!listing) throw AppError.notFound("Listing not found");
  await assertFarmOwnership(user, listing.farmId);
  return produceListingRepository.updateListingStatus(listingId, "PUBLISHED");
}

export async function withdrawListing(user: AuthenticatedUser, listingId: string) {
  const listing = await produceListingRepository.findListingById(listingId);
  if (!listing) throw AppError.notFound("Listing not found");
  await assertFarmOwnership(user, listing.farmId);
  return produceListingRepository.updateListingStatus(listingId, "WITHDRAWN");
}
