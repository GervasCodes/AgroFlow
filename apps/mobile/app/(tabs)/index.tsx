// Home -- tiles are role-aware: a user sees the tiles for every role
// they hold (most people have exactly one, but the shape supports
// more). FARMER gets the original 6-tile set (Section 9.1); BUYER,
// TRANSPORTER, AGGREGATOR, and WAREHOUSE_MANAGER each get their own
// working tiles (Phase 6). PROCESSOR_EXPORTER/ADMIN don't have mobile
// screens yet, so they see a generic "AgroFlow" placeholder tile that's
// honest about it rather than hiding the whole screen.
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ChartIcon,
  CoinIcon,
  FarmIcon,
  GlassCard,
  HandshakeIcon,
  IconTile,
  LeafIcon,
  PhoneUssdIcon,
  ShieldCheckIcon,
  TruckIcon,
  WarehouseIcon,
} from "@/components";
import { ScreenBackground } from "@/components/ScreenBackground";
import { useSessionStore } from "@/store/session";
import { fonts, colors } from "@/theme";
import type { RoleName } from "@agroflow/types";

interface Tile {
  key: string;
  label: string;
  sub: string;
  icon: typeof FarmIcon;
  route: string | null;
  ready: boolean;
}

const FARMER_TILES: Tile[] = [
  { key: "farm", label: "Shamba Langu", sub: "My Farm", icon: FarmIcon, route: "/(tabs)/farm", ready: true },
  { key: "sell", label: "Uza Mazao", sub: "Sell Produce", icon: LeafIcon, route: "/(tabs)/sell", ready: true },
  { key: "orders", label: "Maagizo Yangu", sub: "My Orders", icon: HandshakeIcon, route: null, ready: false },
  { key: "prices", label: "Bei Karibu Nawe", sub: "Prices Near Me", icon: ChartIcon, route: null, ready: false },
  { key: "payments", label: "Malipo", sub: "Payments", icon: CoinIcon, route: null, ready: false },
  { key: "help", label: "Msaada", sub: "Help", icon: PhoneUssdIcon, route: null, ready: false },
];

const BUYER_TILES: Tile[] = [
  { key: "browse", label: "Bidhaa Zilizopo", sub: "Browse Produce", icon: LeafIcon, route: "/buyer", ready: true },
  { key: "orders", label: "Maagizo Yangu", sub: "My Orders", icon: HandshakeIcon, route: "/buyer", ready: true },
  { key: "payments", label: "Malipo", sub: "Payments", icon: CoinIcon, route: null, ready: false },
];

const TRANSPORTER_TILES: Tile[] = [
  { key: "shipments", label: "Mizigo", sub: "Shipments", icon: TruckIcon, route: "/transporter", ready: true },
];

const AGGREGATOR_TILES: Tile[] = [
  { key: "collect", label: "Mzunguko wa Ukusanyaji", sub: "Collection Run", icon: ShieldCheckIcon, route: "/aggregator", ready: true },
];

const WAREHOUSE_TILES: Tile[] = [
  { key: "warehouse", label: "Maghala Yangu", sub: "My Warehouses", icon: WarehouseIcon, route: "/warehouse", ready: true },
];

const TILE_SETS: Partial<Record<RoleName, Tile[]>> = {
  FARMER: FARMER_TILES,
  VILLAGE_AGENT: FARMER_TILES, // agents work the same field flow on a farmer's behalf
  BUYER: BUYER_TILES,
  TRANSPORTER: TRANSPORTER_TILES,
  AGGREGATOR: AGGREGATOR_TILES,
  WAREHOUSE_MANAGER: WAREHOUSE_TILES,
};

function tilesForRoles(roles: RoleName[]): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];
  for (const role of roles) {
    for (const tile of TILE_SETS[role] ?? []) {
      if (!seen.has(tile.key)) {
        seen.add(tile.key);
        tiles.push(tile);
      }
    }
  }
  return tiles;
}

export default function HomeScreen() {
  const user = useSessionStore((s) => s.user);
  const roles = user?.roles ?? [];
  const tiles = tilesForRoles(roles);

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Karibu, {user?.fullName?.split(" ")[0] ?? "rafiki"}.</Text>
        <Text style={styles.subGreeting}>What would you like to do today?</Text>

        {tiles.length === 0 ? (
          <GlassCard>
            <Text style={styles.tipTitle}>Karibu AgroFlow</Text>
            <Text style={styles.tipBody}>
              Mobile screens for your role are coming soon -- use the AgroFlow web app for the full experience in
              the meantime.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.grid}>
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.key}
                  onPress={() => tile.route && router.push(tile.route as never)}
                  disabled={!tile.ready}
                  style={({ pressed }) => [styles.tile, pressed && tile.ready ? { opacity: 0.85 } : null]}
                >
                  <View style={styles.tileGlass}>
                    <IconTile size="lg">
                      <Icon size={30} />
                    </IconTile>
                    <Text style={styles.tileLabel}>{tile.label}</Text>
                    <Text style={styles.tileSub}>{tile.ready ? tile.sub : `${tile.sub} (soon)`}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {roles.includes("FARMER") && (
          <GlassCard style={{ marginTop: 8 }}>
            <Text style={styles.tipTitle}>Umeshaza mazao?</Text>
            <Text style={styles.tipBody}>
              List what you've harvested and it stays visible to buyers, even if you go offline right after -- it
              will send automatically once you're back online.
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100, gap: 4 },
  greeting: { fontFamily: fonts.display, fontSize: 26, color: colors.leaf[950] },
  subGreeting: { fontFamily: fonts.sans, fontSize: 14, color: colors.leaf[900] + "99", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 24 },
  tile: { width: "47%", borderRadius: 24, overflow: "hidden" },
  tileGlass: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 24,
    padding: 16,
    gap: 10,
    minHeight: 140,
    justifyContent: "center",
  },
  tileLabel: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.leaf[950] },
  tileSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.leaf[900] + "80" },
  tipTitle: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.leaf[950], marginBottom: 4 },
  tipBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "99", lineHeight: 19 },
});
