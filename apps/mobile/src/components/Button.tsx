// Large-touch-target button, gradient primary matching apps/web's leaf
// gradient. Farmers using this in a field on a budget Android phone
// need generous hit areas -- min height 52 (vs. web's 44/11 * 4).
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radii, shadow } from "@/theme";

type Variant = "primary" | "secondary" | "danger";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = "primary", isLoading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const content = (
    <>
      {isLoading && <ActivityIndicator color={variant === "secondary" ? colors.leaf[700] : colors.white} />}
      <Text
        style={[
          styles.label,
          variant === "secondary" ? { color: colors.leaf[900] } : { color: colors.white },
        ]}
      >
        {title}
      </Text>
    </>
  );

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, styles.secondary, isDisabled && styles.disabled, style]}
      >
        {content}
      </Pressable>
    );
  }

  const gradientColors: [string, string] =
    variant === "danger" ? [colors.rust[500], colors.rust[600]] : [colors.leaf[600], colors.leaf[700]];

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[isDisabled && styles.disabled, style]}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.base, shadow.glass]}>
        {content}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(15,61,40,0.1)",
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
  },
  disabled: { opacity: 0.5 },
});
