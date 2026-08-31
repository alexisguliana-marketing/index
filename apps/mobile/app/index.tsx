import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, fontSizes, spacing } from "@wedding-univers/ui";

import { useAuth } from "../lib/auth-context";

/**
 * Landing route — the root layout's redirect effect sends the user to
 * `/(auth)/connexion` or `/mon-mariage` right after mount. This just covers
 * that brief moment, and doubles as the "no Supabase project configured"
 * screen (mirrors apps/web's graceful-degradation pattern).
 */
export default function IndexScreen() {
  const { isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Configuration requise</Text>
        <Text style={styles.subtitle}>
          Aucun projet Supabase n&apos;est encore connecté. Voir apps/mobile/.env.example.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.gold} />
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
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: "center",
  },
});
