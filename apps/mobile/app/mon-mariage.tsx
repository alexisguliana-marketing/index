import { colors, fontSizes, radii, spacing } from "@wedding-univers/ui";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSupabaseClient } from "../lib/supabase";

interface WeddingRow {
  partner1_first_name: string;
  partner2_first_name: string;
  date: string | null;
  location: string | null;
  guest_count_estimate: number | null;
}

interface BudgetSummary {
  total: number | null;
  spent: number;
  remaining: number | null;
  percent_used: number | null;
}

function formatDate(value: string | null): string {
  if (!value) return "Date non définie";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatEuros(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export default function MonMariageScreen() {
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState<WeddingRow | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [hasWedding, setHasWedding] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from("wedding_members")
        .select("wedding_id")
        .eq("user_id", user.id)
        .order("invited_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!membership) {
        setHasWedding(false);
        setLoading(false);
        return;
      }

      const [{ data: weddingRow }, { data: budgetRow }] = await Promise.all([
        supabase
          .from("weddings")
          .select("partner1_first_name, partner2_first_name, date, location, guest_count_estimate")
          .eq("id", membership.wedding_id)
          .maybeSingle(),
        supabase
          .from("budget_summary")
          .select("total, spent, remaining, percent_used")
          .eq("wedding_id", membership.wedding_id)
          .maybeSingle(),
      ]);

      setWedding(weddingRow);
      setBudget(budgetRow);
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!hasWedding) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Aucun mariage pour l&apos;instant</Text>
        <Text style={styles.subtitle}>
          La création d&apos;un mariage depuis l&apos;application mobile arrive dans une prochaine mise à jour —
          créez-le pour l&apos;instant depuis le site web.
        </Text>
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Mon mariage</Text>
      <Text style={styles.title}>
        {wedding?.partner1_first_name} &amp; {wedding?.partner2_first_name}
      </Text>
      <Text style={styles.subtitle}>
        {formatDate(wedding?.date ?? null)} · {wedding?.location ?? "Lieu non défini"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget</Text>
        {budget?.total ? (
          <>
            <Text style={styles.cardValue}>
              {formatEuros(budget.spent)} / {formatEuros(budget.total)}
            </Text>
            <Text style={styles.cardMeta}>Reste {formatEuros(budget.remaining)}</Text>
          </>
        ) : (
          <Text style={styles.cardMeta}>Budget global non défini.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Invités</Text>
        <Text style={styles.cardValue}>
          {wedding?.guest_count_estimate !== null && wedding?.guest_count_estimate !== undefined
            ? `${wedding.guest_count_estimate} personnes`
            : "Non défini"}
        </Text>
      </View>

      <Text style={styles.note}>
        Les tâches, invités détaillés et messages restent gérés depuis le site web pour l&apos;instant — cette
        première version mobile couvre l&apos;essentiel : connexion et vue d&apos;ensemble.
      </Text>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  centered: {
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
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xl,
    fontStyle: "italic",
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.ink,
  },
  cardMeta: {
    fontSize: fontSizes.sm,
    color: colors.inkSoft,
    marginTop: spacing.xs,
  },
  note: {
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  signOutText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.inkSoft,
  },
});
