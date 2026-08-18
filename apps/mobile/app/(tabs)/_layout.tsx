// Core tab navigation. Sell/My Farm are FARMER-and-VILLAGE_AGENT-only
// (hidden via href:null for other roles, per Phase 15's role-aware Home
// screen -- a BUYER tapping into a farm-only screen would just get a
// 403 from the API, so hide the tab rather than let that happen).
// Buyer/transporter companion screens (browse, shipments) are pushed
// routes from Home's tiles rather than tabs, since AgroFlow's full
// per-role tab sets (Section 9.2) are a larger restructure saved for
// when aggregator/warehouse/admin mobile screens also exist.
import { Redirect, Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { ChartIcon, FarmIcon, LeafIcon, UserIcon } from "@/components";
import { useSessionStore } from "@/store/session";
import { colors, fonts } from "@/theme";

export default function TabsLayout() {
  const user = useSessionStore((s) => s.user);
  if (!user) return <Redirect href="/(auth)" />;

  const hasFarmerFlow = user.roles.includes("FARMER") || user.roles.includes("VILLAGE_AGENT");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.leaf[700],
        tabBarInactiveTintColor: colors.leaf[900] + "80",
        tabBarLabelStyle: { fontFamily: fonts.sansSemibold, fontSize: 11 },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ size }) => <ChartIcon size={size} /> }} />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ size }) => <LeafIcon size={size} />,
          href: hasFarmerFlow ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          title: "My Farm",
          tabBarIcon: ({ size }) => <FarmIcon size={size} />,
          href: hasFarmerFlow ? undefined : null,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ size }) => <UserIcon size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    elevation: 0,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
});
