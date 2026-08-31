import { signInSchema } from "@wedding-univers/validation";
import { colors, fontSizes, radii, spacing } from "@wedding-univers/ui";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getSupabaseClient } from "../../lib/supabase";

export default function ConnexionScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Email ou mot de passe invalide.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }

    setPending(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setPending(false);

    if (signInError) {
      setError("Identifiants incorrects.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.inkSoft}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor={colors.inkSoft}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={pending}>
        {pending ? <ActivityIndicator color={colors.ivory} /> : <Text style={styles.buttonText}>Se connecter</Text>}
      </Pressable>

      <Link href="/(auth)/inscription" style={styles.link}>
        Pas encore de compte ? Créer un compte
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontStyle: "italic",
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.ink,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.ivory,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  link: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: colors.gold,
    fontSize: fontSizes.sm,
  },
});
