// Shared constants used across apps: role names, permission keys, supported
// crops, regions, mobile money providers, units, quality grades.
// This is the single source of truth -- apps/api, apps/web and apps/mobile
// all import from here rather than redefining these lists locally.

// --- Roles ----------------------------------------------------------------
// Mirrors Section 2 (Personas) of the master project documentation.
export const ROLES = [
  "FARMER",
  "BUYER",
  "AGGREGATOR",
  "TRANSPORTER",
  "WAREHOUSE_MANAGER",
  "PROCESSOR_EXPORTER",
  "VILLAGE_AGENT",
  "ADMIN",
] as const;

export type RoleName = (typeof ROLES)[number];

// Human-readable labels for UI (English). Swahili labels live in the i18n
// layer built alongside apps/web and apps/mobile, not here.
export const ROLE_LABELS: Record<RoleName, string> = {
  FARMER: "Farmer",
  BUYER: "Buyer",
  AGGREGATOR: "Aggregator",
  TRANSPORTER: "Transporter",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  PROCESSOR_EXPORTER: "Processor / Exporter",
  VILLAGE_AGENT: "Village Agent",
  ADMIN: "Admin",
};

// Roles whose primary channel is App / USSD / WhatsApp / Agent-assisted,
// vs. desk-based roles the web app is actively designed for.
// See docs/BUILD_ORDER.md.
export const FIELD_ROLES: readonly RoleName[] = ["FARMER", "VILLAGE_AGENT"];
export const DESK_ROLES: readonly RoleName[] = [
  "BUYER",
  "AGGREGATOR",
  "TRANSPORTER",
  "WAREHOUSE_MANAGER",
  "PROCESSOR_EXPORTER",
  "ADMIN",
];

// --- Permissions ------------------------------------------------------------
// Convention: "<resource>:<action>". apps/api/src/middleware/rbac.ts is the
// single point of enforcement -- UI-side checks are convenience only.
export const RESOURCES = [
  "farm",
  "crop",
  "produce_listing",
  "demand_order",
  "match",
  "purchase_order",
  "quality_inspection",
  "shipment",
  "warehouse",
  "payment",
  "user",
  "role",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["create", "read", "update", "delete", "approve", "assign"] as const;
export type Action = (typeof ACTIONS)[number];

export function permissionKey(resource: Resource, action: Action): string {
  return `${resource}:${action}`;
}

// --- Crops ------------------------------------------------------------------
// Starting crop list for the pilot region/crop per the "one core loop, one
// region, one or two crops" mission. Expand as onboarding widens.
export const CROPS = [
  "MAIZE",
  "RICE",
  "BEANS",
  "CASSAVA",
  "SUNFLOWER",
  "CASHEW",
  "COFFEE",
  "COTTON",
  "SESAME",
  "SORGHUM",
  "TOMATO",
  "ONION",
] as const;
export type CropName = (typeof CROPS)[number];

// --- Regions ------------------------------------------------------------------
// Tanzania regions (mainland + Zanzibar), used for farm location, buyer
// coverage area and USSD/agent routing.
export const REGIONS = [
  "ARUSHA",
  "DAR_ES_SALAAM",
  "DODOMA",
  "GEITA",
  "IRINGA",
  "KAGERA",
  "KATAVI",
  "KIGOMA",
  "KILIMANJARO",
  "LINDI",
  "MANYARA",
  "MARA",
  "MBEYA",
  "MOROGORO",
  "MTWARA",
  "MWANZA",
  "NJOMBE",
  "PWANI",
  "RUKWA",
  "RUVUMA",
  "SHINYANGA",
  "SIMIYU",
  "SINGIDA",
  "SONGWE",
  "TABORA",
  "TANGA",
  "KASKAZINI_UNGUJA",
  "KUSINI_UNGUJA",
  "MJINI_MAGHARIBI",
  "KASKAZINI_PEMBA",
  "KUSINI_PEMBA",
] as const;
export type RegionName = (typeof REGIONS)[number];

// --- Mobile money & payments -------------------------------------------------
// See Section 3.3 of the master documentation.
export const MOBILE_MONEY_PROVIDERS = [
  "MPESA",
  "MIXX_BY_YAS",
  "AIRTEL_MONEY",
  "HALOPESA",
] as const;
export type MobileMoneyProvider = (typeof MOBILE_MONEY_PROVIDERS)[number];

export const MOBILE_MONEY_LABELS: Record<MobileMoneyProvider, string> = {
  MPESA: "M-Pesa (Vodacom)",
  MIXX_BY_YAS: "Mixx by Yas (Tigo Pesa)",
  AIRTEL_MONEY: "Airtel Money",
  HALOPESA: "HaloPesa",
};

export const CURRENCY = "TZS" as const;

// --- Units & quality ----------------------------------------------------------
export const UNITS = ["KG", "TONNE", "BAG_50KG", "BAG_100KG", "CRATE"] as const;
export type UnitName = (typeof UNITS)[number];

export const QUALITY_GRADES = ["GRADE_A", "GRADE_B", "GRADE_C", "REJECTED"] as const;
export type QualityGradeName = (typeof QUALITY_GRADES)[number];

// --- Channels -----------------------------------------------------------------
export const CHANNELS = ["APP", "WEB", "USSD", "WHATSAPP", "SMS", "AGENT_ASSISTED"] as const;
export type ChannelName = (typeof CHANNELS)[number];

// --- Default RBAC matrix ------------------------------------------------------
// Seed data for the Permission/Role/UserRole tables (Identity domain).
// apps/api/src/middleware/rbac.ts is the enforcement point; this matrix is
// what the database seed script loads on first run. Admin gets every
// resource:action pair; other roles get the minimum needed for their
// persona's core loop (Section 1 of the master documentation).
const ALL_PERMISSIONS: string[] = RESOURCES.flatMap((resource) =>
  ACTIONS.map((action) => permissionKey(resource, action)),
);

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: ALL_PERMISSIONS,
  FARMER: [
    permissionKey("farm", "create"),
    permissionKey("farm", "read"),
    permissionKey("farm", "update"),
    permissionKey("produce_listing", "create"),
    permissionKey("produce_listing", "read"),
    permissionKey("produce_listing", "update"),
    permissionKey("match", "read"),
    permissionKey("match", "approve"),
    permissionKey("purchase_order", "read"),
    permissionKey("quality_inspection", "read"),
    permissionKey("shipment", "read"),
    permissionKey("payment", "read"),
  ],
  BUYER: [
    permissionKey("demand_order", "create"),
    permissionKey("demand_order", "read"),
    permissionKey("demand_order", "update"),
    permissionKey("produce_listing", "read"),
    permissionKey("match", "create"),
    permissionKey("match", "read"),
    permissionKey("purchase_order", "create"),
    permissionKey("purchase_order", "read"),
    permissionKey("payment", "create"),
    permissionKey("payment", "read"),
    permissionKey("quality_inspection", "read"),
    permissionKey("shipment", "create"),
    permissionKey("shipment", "read"),
  ],
  AGGREGATOR: [
    permissionKey("produce_listing", "read"),
    permissionKey("produce_listing", "update"),
    permissionKey("match", "read"),
    permissionKey("purchase_order", "read"),
    permissionKey("quality_inspection", "create"),
    permissionKey("quality_inspection", "read"),
    permissionKey("payment", "read"),
  ],
  TRANSPORTER: [
    permissionKey("shipment", "read"),
    permissionKey("shipment", "update"),
    permissionKey("purchase_order", "read"),
  ],
  WAREHOUSE_MANAGER: [
    permissionKey("warehouse", "create"),
    permissionKey("warehouse", "read"),
    permissionKey("warehouse", "update"),
    permissionKey("purchase_order", "read"),
    permissionKey("shipment", "read"),
  ],
  PROCESSOR_EXPORTER: [
    permissionKey("demand_order", "create"),
    permissionKey("demand_order", "read"),
    permissionKey("purchase_order", "create"),
    permissionKey("purchase_order", "read"),
    permissionKey("quality_inspection", "read"),
  ],
  VILLAGE_AGENT: [
    permissionKey("farm", "create"),
    permissionKey("farm", "read"),
    permissionKey("produce_listing", "create"),
    permissionKey("produce_listing", "read"),
    permissionKey("user", "create"),
  ],
};
