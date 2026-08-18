// Neumorphic-glass icon tile -- mirrors apps/web's .neu-glass-tile.
// A soft radial-ish gradient fill plus a dual light/dark shadow so the
// icon reads as embossed into frosted glass. LinearGradient stands in
// for the CSS gradient; the shadow object in theme.ts stands in for
// the CSS box-shadow pair.
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radii, shadow } from "@/theme";

const SIZE_MAP = { sm: 36, md: 48, lg: 64 } as const;

export interface IconTileProps {
  children: React.ReactNode;
  size?: keyof typeof SIZE_MAP;
  style?: StyleProp<ViewStyle>;
}

export function IconTile({ children, size = "md", style }: IconTileProps) {
  const dim = SIZE_MAP[size];
  return (
    <View style={[{ width: dim, height: dim, borderRadius: radii.md }, shadow.neu, style]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.35)"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.md }]}
      />
      <View style={styles.centered}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
