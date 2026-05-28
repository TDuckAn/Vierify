import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type KybStatus = "pending" | "approved" | "rejected" | "suspended";

const KYB_CONFIG: Record<KybStatus, { bg: string; border: string; text: string; label: string }> = {
  approved:  { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", label: "✓ Đã xác minh KYB" },
  pending:   { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", label: "⏳ Chờ xét duyệt KYB" },
  rejected:  { bg: "#FFF1F2", border: "#FECDD3", text: "#BE123C", label: "✕ KYB bị từ chối" },
  suspended: { bg: "#F8FAFC", border: "#E2E8F0", text: "#64748B", label: "⏸ Tài khoản tạm dừng" }
};

function KybBadge({ status }: { status: KybStatus }) {
  const c = KYB_CONFIG[status];
  return (
    <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[s.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const appVersion = Constants.expoConfig?.version ?? "0.0.0";

  // Hardcoded demo — real data wired when Supabase session is read
  const profile = {
    nodeName: "Công ty TNHH Vierify Demo",
    email: "demo@vierify.app",
    kybStatus: "approved" as KybStatus,
    plan: "Professional"
  };

  async function handleLogout() {
    try {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
      const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
      if (url && key) {
        await createClient(url, key).auth.signOut();
      }
    } finally {
      router.replace("/(auth)/login");
    }
  }

  const settings = [
    { label: "Đổi mật khẩu", icon: "🔑" },
    { label: "Thông báo", icon: "🔔" },
    { label: "Liên hệ hỗ trợ", icon: "💬" }
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Heading */}
        <Text style={s.heading}>Hồ sơ</Text>

        {/* Identity card */}
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{profile.nodeName.charAt(0)}</Text>
          </View>
          <Text style={s.name}>{profile.nodeName}</Text>
          <Text style={s.email}>{profile.email}</Text>
          <KybBadge status={profile.kybStatus} />
        </View>

        {/* Plan */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Gói dịch vụ</Text>
          <View style={s.planRow}>
            <Text style={s.planName}>{profile.plan}</Text>
            <View style={s.activePill}>
              <Text style={s.activePillText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>

        {/* Settings list */}
        <View style={s.settingsList}>
          {settings.map((item, i) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                s.settingRow,
                i < settings.length - 1 && s.settingRowBorder,
                pressed && s.settingRowPressed
              ]}
            >
              <Text style={s.settingIcon}>{item.icon}</Text>
              <Text style={s.settingLabel}>{item.label}</Text>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={() => void handleLogout()}
          style={({ pressed }) => [s.logoutBtn, pressed && s.logoutBtnPressed]}
        >
          <Text style={s.logoutText}>Đăng xuất</Text>
        </Pressable>

        <Text style={s.version}>Vierify MerchantApp v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  scroll: { padding: 20, gap: 12 },
  heading: { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4, marginBottom: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    gap: 10
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#14B8A6",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarLetter: { fontSize: 22, fontWeight: "800", color: "#fff" },
  name: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  email: { fontSize: 13, color: "#64748B" },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94A3B8"
  },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planName: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  activePill: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  activePillText: { fontSize: 11, fontWeight: "700", color: "#0F766E" },
  settingsList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden"
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  settingRowPressed: { backgroundColor: "#F8FAFC" },
  settingIcon: { fontSize: 18 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#334155" },
  chevron: { fontSize: 20, color: "#CBD5E1" },
  logoutBtn: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  logoutBtnPressed: { backgroundColor: "rgba(239,68,68,0.14)" },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  version: { textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 4 }
});
