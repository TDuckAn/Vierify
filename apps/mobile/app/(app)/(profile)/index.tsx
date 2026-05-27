import Constants from "expo-constants";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

type KybStatus = "pending" | "approved" | "rejected" | "suspended";

function KybBadge({ status }: { status: KybStatus }) {
  const config = {
    approved: {
      className: "border-emerald-200 bg-emerald-50",
      textClass: "text-emerald-700",
      label: "✓ Đã xác minh KYB"
    },
    pending: {
      className: "border-amber-200 bg-amber-50",
      textClass: "text-amber-700",
      label: "⏳ Chờ xét duyệt KYB"
    },
    rejected: {
      className: "border-rose-200 bg-rose-50",
      textClass: "text-rose-700",
      label: "✕ KYB bị từ chối"
    },
    suspended: {
      className: "border-slate-200 bg-slate-100",
      textClass: "text-slate-600",
      label: "⏸ Tài khoản tạm dừng"
    }
  };

  const c = config[status];
  return (
    <View className={`rounded-full border px-4 py-1.5 ${c.className}`}>
      <Text className={`text-sm font-bold ${c.textClass}`}>{c.label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  // Placeholder profile data — wire up to Supabase Auth in production
  const profile = {
    nodeName: "Công ty TNHH Vierify Demo",
    email: "demo@vierify.app",
    kybStatus: "approved" as KybStatus,
    plan: "Professional"
  };

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? "—";

  function handleLogout() {
    // In production: call supabase.auth.signOut() then redirect
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="p-5 gap-4">
        {/* Header */}
        <View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            MerchantApp
          </Text>
          <Text className="mt-0.5 text-2xl font-extrabold text-slate-950">
            Hồ sơ
          </Text>
        </View>

        {/* Identity card */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5 gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-chain">
            <Text className="text-3xl font-black text-white">
              {profile.nodeName.charAt(0)}
            </Text>
          </View>

          <View>
            <Text className="text-xl font-bold text-slate-950" numberOfLines={2}>
              {profile.nodeName}
            </Text>
            <Text className="mt-1 text-sm text-slate-500">{profile.email}</Text>
          </View>

          <KybBadge status={profile.kybStatus} />
        </View>

        {/* Plan */}
        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Gói dịch vụ
          </Text>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-950">{profile.plan}</Text>
            <View className="rounded-full border border-chain/30 bg-chain/10 px-3 py-1">
              <Text className="text-xs font-bold text-chain">Đang hoạt động</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {[
            { label: "Đổi mật khẩu", icon: "🔑" },
            { label: "Thông báo", icon: "🔔" },
            { label: "Liên hệ hỗ trợ", icon: "💬" }
          ].map((item, i, arr) => (
            <Pressable
              key={item.label}
              className={`flex-row items-center gap-4 px-5 py-4 active:bg-slate-50 ${
                i < arr.length - 1 ? "border-b border-slate-100" : ""
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-xl">{item.icon}</Text>
              <Text className="flex-1 text-base font-medium text-slate-700">
                {item.label}
              </Text>
              <Text className="text-slate-300">›</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 items-center active:opacity-80"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="font-bold text-rose-700">Đăng xuất</Text>
        </Pressable>

        {/* Version */}
        <Text className="text-center text-xs text-slate-400">
          Vierify MerchantApp v{appVersion}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
