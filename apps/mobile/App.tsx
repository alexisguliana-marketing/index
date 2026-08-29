import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSizes, spacing } from "@wedding-univers/ui";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>L&apos;écosystème du mariage</Text>
      <Text style={styles.title}>Wedding Univers</Text>
      <Text style={styles.subtitle}>
        La plateforme qui réunit tout l&apos;univers du mariage.
      </Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.xl,
  },
  eyebrow: {
    fontSize: fontSizes.xs,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.inkSoft,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontStyle: "italic",
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
