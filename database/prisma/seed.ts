// Seeds Role and Permission rows (and links them via RolePermission) from
// the single source of truth in @agroflow/config: ROLES, RESOURCES,
// ACTIONS and DEFAULT_ROLE_PERMISSIONS. Also seeds the Crop table from
// CROPS so ProduceListing has valid crops to reference in dev/test.
//
// Idempotent: safe to re-run. Run with `pnpm --filter @agroflow/database seed`.

import { PrismaClient } from "@prisma/client";
import {
  ROLES,
  RESOURCES,
  ACTIONS,
  CROPS,
  permissionKey,
  DEFAULT_ROLE_PERMISSIONS,
} from "@agroflow/config";

const prisma = new PrismaClient();

async function seedPermissions() {
  const rows = RESOURCES.flatMap((resource) =>
    ACTIONS.map((action) => ({
      key: permissionKey(resource, action),
      resource,
      action,
    })),
  );

  for (const row of rows) {
    await prisma.permission.upsert({
      where: { key: row.key },
      update: {},
      create: row,
    });
  }
  console.log(`Seeded ${rows.length} permissions.`);
}

async function seedRoles() {
  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    const permissionKeys = DEFAULT_ROLE_PERMISSIONS[roleName];
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    // Reset and re-link so the matrix in @agroflow/config stays the single
    // source of truth (re-running seed after editing the matrix corrects
    // drift instead of only ever adding).
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`Seeded ${ROLES.length} roles with their default permissions.`);
}

async function seedCrops() {
  const defaultUnitByCrop: Record<string, string> = {
    MAIZE: "BAG_100KG",
    RICE: "BAG_100KG",
    BEANS: "BAG_100KG",
    CASSAVA: "TONNE",
    SUNFLOWER: "BAG_100KG",
    CASHEW: "TONNE",
    COFFEE: "KG",
    COTTON: "BAG_100KG",
    SESAME: "BAG_100KG",
    SORGHUM: "BAG_100KG",
    TOMATO: "CRATE",
    ONION: "BAG_50KG",
  };

  for (const cropName of CROPS) {
    await prisma.crop.upsert({
      where: { name: cropName },
      update: {},
      create: { name: cropName, defaultUnit: defaultUnitByCrop[cropName] ?? "KG" },
    });
  }
  console.log(`Seeded ${CROPS.length} crops.`);
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedCrops();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
