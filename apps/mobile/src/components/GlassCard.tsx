// The base frosted-glass surface -- mirrors apps/web's .glass-panel.
// Uses expo-blur's <BlurView> for a real backdrop blur (not achievable
// with plain RN View/opacity), layered under a translucent tint so it
// reads consistently across iOS and Android (Android's blur support is
// weaker, so the tint carries more of the effect there).
import { BlurView } from "expo-blur";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { glass, radii, shadow } from "@/theme";

export interface GlassCardProps {
  children: React.ReactNode;
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, strong, style }: GlassCardProps) {
  return (
    <View style={[styles.wrapper, shadow.glass, style]}>
      <BlurView intensity={strong ? 60 : glass.intensity} tint={glass.tint} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? glass.surfaceStrong : glass.surface, borderRadius: radii.xl },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glass.borderColor,
  },
  content: {
    padding: 20,
  },
});
