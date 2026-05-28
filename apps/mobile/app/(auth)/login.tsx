import { createClient } from "@supabase/supabase-js";
import { router } from "expo-router";
import { useState } from "react";

import { setAuthToken } from "../../lib/auth-token";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

function getSupabase() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(url, key, { auth: { persistSession: true } });
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kybBlocked, setKybBlocked] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }
    setLoading(true);
    setError(null);
    setKybBlocked(false);

    try {
      const supabase = getSupabase();
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authErr || !data.user) {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
        return;
      }

      const role = data.user.app_metadata?.role as string | undefined;
      if (!role || role === "viewer") {
        setKybBlocked(true);
        await supabase.auth.signOut();
        return;
      }

      setAuthToken(data.session?.access_token ?? null);
      router.replace("/(app)/(batches)");
    } catch {
      setError("Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoIcon}>
            <Text style={s.checkmark}>✓</Text>
          </View>
          <Text style={s.brand}>Vierify</Text>
          <Text style={s.tagline}>Truy xuất nguồn gốc</Text>
        </View>

        {/* KYB banner */}
        {kybBlocked && (
          <View style={s.kybBanner}>
            <Text style={s.kybTitle}>Tài khoản chờ phê duyệt KYB</Text>
            <Text style={s.kybSub}>Liên hệ: support@vierify.vn</Text>
          </View>
        )}

        {/* Error */}
        {error && !kybBlocked && (
          <View style={s.errBanner}>
            <Text style={s.errText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ban@congty.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />

          <Text style={[s.label, { marginTop: 14 }]}>Mật khẩu</Text>
          <TextInput
            style={[s.input, { marginBottom: 24 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            style={({ pressed }) => [s.btn, pressed && s.btnPressed, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Đăng nhập</Text>
            }
          </Pressable>
        </View>

        <Text style={s.foot}>
          Chưa có tài khoản?{"  "}
          <Text style={s.footLink}>Liên hệ với chúng tôi</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F8FAFC" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48
  },
  logoWrap: { alignItems: "center", marginBottom: 44 },
  logoIcon: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "#14B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  checkmark: { color: "#fff", fontSize: 34, fontWeight: "700" },
  brand: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4 },
  tagline: { fontSize: 14, color: "#64748B", marginTop: 4 },
  kybBanner: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16
  },
  kybTitle: { fontSize: 13, fontWeight: "700", color: "#92400E" },
  kybSub: { fontSize: 12, color: "#92400E", marginTop: 2 },
  errBanner: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  errText: { fontSize: 13, color: "#BE123C" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0F172A"
  },
  btn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#14B8A6",
    alignItems: "center",
    justifyContent: "center"
  },
  btnPressed: { backgroundColor: "#0F766E" },
  btnDisabled: { backgroundColor: "#94A3B8" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  foot: { marginTop: 28, fontSize: 12, color: "#94A3B8", textAlign: "center" },
  footLink: { color: "#2563EB" }
});
