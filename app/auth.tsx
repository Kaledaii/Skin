import { Feather } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, Segment } from "@/shared/components";
import { palettes, spacing } from "@/shared/theme";

type AuthMode = "create" | "signin";

export default function AuthScreen() {
  const { themeMode, authReady, authRequired, authStatus, signUpAndSync, signInAndRestore } = useApp();
  const c = palettes[themeMode];
  const [mode, setMode] = useState<AuthMode>("create");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authReady && !authRequired) return <Redirect href="/" />;

  const submit = async () => {
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim().replace(/[-\s]/g, "");
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (!/^9\d{9}$/.test(cleanPhone)) {
      setMessage("Enter a valid Nepal phone number, 10 digits starting with 9.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const result = mode === "create"
        ? await signUpAndSync({ email: cleanEmail, password, phone: cleanPhone })
        : await signInAndRestore({ email: cleanEmail, password, phone: cleanPhone });
      setMessage(result.message);
      if (result.ok) router.replace("/" as never);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen showQuickActions={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card variant="hero">
            <View style={styles.heroRow}>
              <View style={[styles.iconBubble, { backgroundColor: c.primarySoft }]}>
                <Feather name="lock" color={c.primary} size={24} />
              </View>
              <View style={styles.flex}>
                <Pill tone="accent">Prabha account</Pill>
                <H1>Sign in before your skin quiz</H1>
                <Body muted>Use the same email to restore premium and skin data on a new phone.</Body>
              </View>
            </View>
          </Card>

          <Card>
            <H2>{mode === "create" ? "Create account" : "Sign in"}</H2>
            <Segment value={mode} options={["create", "signin"] as AuthMode[]} onChange={setMode} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="Email"
              placeholderTextColor={c.muted}
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              placeholder="Recovery phone / payment phone"
              placeholderTextColor={c.muted}
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={mode === "create" ? "newPassword" : "password"}
              placeholder="Password"
              placeholderTextColor={c.muted}
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
            />
            <Button label={submitting ? "Please wait..." : mode === "create" ? "Create account and continue" : "Sign in and restore"} disabled={submitting} onPress={submit} />
            <Body muted>Phone is used for payment recovery/admin matching. Login restore uses your email and password.</Body>
            {message || authStatus ? <Body>{message ?? authStatus}</Body> : null}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBubble: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 48, paddingHorizontal: spacing.md, fontSize: 15 }
});
