// Text field styled to match the glass system, with a large touch/tap
// area appropriate for outdoor, one-handed field use.
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radii } from "@/theme";

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.leaf[900] + "66"}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.leaf[900] },
  input: {
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(15,61,40,0.12)",
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.leaf[950],
  },
  inputError: { borderColor: colors.rust[500] },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600] },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.leaf[900] + "80" },
});
