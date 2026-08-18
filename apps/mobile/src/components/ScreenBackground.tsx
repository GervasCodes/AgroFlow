// Shared ambient background -- the "living field behind frosted glass"
// signature look, mirrored from apps/web's AuthLayout blobs. Wraps
// every screen so the app never feels like flat white RN defaults.
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={["#F7FAF5", "#F0F5EC"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.35 },
  blobTop: { width: 280, height: 280, top: -100, left: -80, backgroundColor: "#57AC64" },
  blobBottom: { width: 240, height: 240, bottom: -80, right: -60, backgroundColor: "#F3D98A" },
});
