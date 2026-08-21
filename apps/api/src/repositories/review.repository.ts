// Data-access for Review (Trust domain).
import { prisma } from "../lib/prisma.js";

export function findReviewByOrderAndAuthor(purchaseOrderId: string, authorId: string) {
  return prisma.review.findUnique({
    where: { purchaseOrderId_authorId: { purchaseOrderId, authorId } },
  });
}

export function findReviewsForSubject(subjectId: string) {
  return prisma.review.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
  });
}

export function createReview(input: {
  purchaseOrderId: string;
  authorId: string;
  subjectId: string;
  rating: number;
  comment?: string;
}) {
  return prisma.review.create({ data: input });
}
