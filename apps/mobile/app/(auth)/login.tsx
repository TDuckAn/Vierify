import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [kybBlocked, setKybBlocked] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setKybBlocked(false);

    try {
      // Placeholder — wire up to Supabase Auth in production
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulate KYB-blocked account for demo
      if (email.toLowerCase().includes("pending")) {
        setKybBlocked(true);
        return;
      }

      router.replace("/(app)/(batches)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="mb-10 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-chain">
              <Text className="text-3xl font-black text-white">V</Text>
            </View>
            <Text className="text-3xl font-extrabold tracking-tight text-slate-950">
              Vierify
            </Text>
            <Text className="mt-1 text-base text-slate-500">
              Truy xuất nguồn gốc chuỗi cung ứng
            </Text>
          </View>

          {/* KYB blocked banner */}
          {kybBlocked && (
            <View className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Text className="text-sm font-bold text-amber-900">
                Tài khoản chờ phê duyệt
              </Text>
              <Text className="mt-1 text-sm text-amber-700">
                Tài khoản của bạn đang chờ xét duyệt KYB. Vui lòng liên hệ{" "}
                <Text className="font-semibold">support@vierify.app</Text> để được
                hỗ trợ.
              </Text>
            </View>
          )}

          {/* Error banner */}
          {error && !kybBlocked && (
            <View className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <Text className="text-sm text-rose-800">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="ten@congty.vn"
                placeholderTextColor="#94A3B8"
                className="h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950"
                style={{ fontSize: 16 }}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Mật khẩu
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                className="h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950"
                style={{ fontSize: 16 }}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              className="mt-2 h-14 items-center justify-center rounded-full bg-chain active:opacity-80"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">Đăng nhập</Text>
              )}
            </Pressable>
          </View>

          <Text className="mt-8 text-center text-xs text-slate-400">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <Text className="text-chain">Điều khoản sử dụng</Text> của Vierify.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
