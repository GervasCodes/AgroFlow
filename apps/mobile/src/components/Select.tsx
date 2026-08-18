// Simple field-style picker: tapping opens a bottom sheet of options
// (native Modal, not a 3rd-party dependency -- keeps the offline bundle
// lean). Chosen over a native <Picker> for visual consistency with the
// rest of the glass UI kit.
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { colors, fonts, radii } from "@/theme";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, value, onChange, placeholder, error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, error ? { borderColor: colors.rust[500] } : null]}
      >
        <Text style={[styles.fieldText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder ?? "Select"}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.leaf[900] },
  field: {
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(15,61,40,0.12)",
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  fieldText: { fontFamily: fonts.sans, fontSize: 16, color: colors.leaf[950] },
  placeholder: { color: colors.leaf[900] + "66" },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.rust[600] },
  backdrop: { flex: 1, backgroundColor: "rgba(9,39,25,0.35)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: 20,
    paddingBottom: 32,
    overflow: "hidden",
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.leaf[950], marginBottom: 12 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(15,61,40,0.08)" },
  optionText: { fontFamily: fonts.sans, fontSize: 16, color: colors.leaf[900] },
});
