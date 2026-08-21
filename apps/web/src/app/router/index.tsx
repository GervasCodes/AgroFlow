// Route definitions. Left nav is grouped by workflow stage (Overview ->
// Demand & Supply -> Matching -> Orders -> Quality -> Logistics ->
// Warehousing -> Payments -> Reports -> Admin), not by database entity
// (Section 7.1). Phase 4 wires up auth + a minimal authenticated shell;
// each subsequent phase adds its routes here as that domain lands.
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import type { ReactNode } from "react";
import { LoginPage, RegisterPage } from "@/features/auth";
import { DashboardHomePage } from "@/features/dashboard";
import { FarmsListPage, CreateFarmPage } from "@/features/farms";
import { ProduceListingsPage, CreateListingPage } from "@/features/produce";
import { DemandOrdersPage, CreateDemandOrderPage } from "@/features/demand";
import { MatchesPage, ProposeMatchPage } from "@/features/matches";
import { InspectListingPage } from "@/features/quality";
import { PurchaseOrdersPage } from "@/features/orders";
import { ShipmentsPage, RequestShipmentPage } from "@/features/shipments";
import { WarehousesPage } from "@/features/warehouses";
import { PayOrderPage, PaymentsPage } from "@/features/payments";
import { LogisticsPage } from "@/features/logistics";
import { AggregationPage } from "@/features/aggregation";
import { AnalyticsPage } from "@/features/analytics";
import { AdminConsolePage } from "@/features/admin";
import { ProfilePage } from "@/features/profile";
import { AppShell } from "@/app/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";

function withShell(children: ReactNode) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/", element: withShell(<DashboardHomePage />) },
  { path: "/farms", element: withShell(<FarmsListPage />) },
  { path: "/farms/new", element: withShell(<CreateFarmPage />) },
  { path: "/produce", element: withShell(<ProduceListingsPage />) },
  { path: "/produce/new", element: withShell(<CreateListingPage />) },
  { path: "/demand", element: withShell(<DemandOrdersPage />) },
  { path: "/demand/new", element: withShell(<CreateDemandOrderPage />) },
  { path: "/matches", element: withShell(<MatchesPage />) },
  { path: "/matches/propose/:listingId", element: withShell(<ProposeMatchPage />) },
  { path: "/quality/inspect/:listingId", element: withShell(<InspectListingPage />) },
  { path: "/orders", element: withShell(<PurchaseOrdersPage />) },
  { path: "/shipments", element: withShell(<ShipmentsPage />) },
  { path: "/shipments/request/:purchaseOrderId", element: withShell(<RequestShipmentPage />) },
  { path: "/warehouses", element: withShell(<WarehousesPage />) },
  { path: "/payments", element: withShell(<PaymentsPage />) },
  { path: "/payments/pay/:purchaseOrderId", element: withShell(<PayOrderPage />) },
  { path: "/logistics", element: withShell(<LogisticsPage />) },
  { path: "/aggregation", element: withShell(<AggregationPage />) },
  { path: "/reports", element: withShell(<AnalyticsPage />) },
  { path: "/admin", element: withShell(<AdminConsolePage />) },
  { path: "/profile", element: withShell(<ProfilePage />) },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
