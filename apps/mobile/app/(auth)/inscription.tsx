import { signUpSchema } from "@wedding-univers/validation";
import { colors, fontSizes, radii, spacing } from "@wedding-univers/ui";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getSupabaseClient } from "../../lib/supabase";

export default function InscriptionScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.fullName } },
    });
    setPending(false);

    if (signUpError) {
      setError("Impossible de créer le compte. Réessayez.");
      return;
    }
    if (!data.session) {
      setMessage("Compte créé — vérifiez votre email pour confirmer votre inscription.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        placeholderTextColor={colors.inkSoft}
        value={fullName}
        onChangeText={setFullName}
      />
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
        placeholder="Mot de passe (8 caractères minimum)"
        placeholderTextColor={colors.inkSoft}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.success}>{message}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={pending}>
        {pending ? <ActivityIndicator color={colors.ivory} /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
      </Pressable>

      <Link href="/(auth)/connexion" style={styles.link}>
        Déjà un compte ? Se connecter
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
  success: {
    color: colors.success,
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
