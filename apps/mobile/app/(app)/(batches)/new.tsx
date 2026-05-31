import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { trpc } from "../../../lib/trpc";

const UOM_OPTIONS = ["kg", "tấn", "thùng", "lít", "cái", "bao"];
const GS1_REGEX = /^01[0-9]{14}10[A-Za-z0-9./-]{1,20}$/;

type NodeOption = { id: string; name: string; nodeType: string };

type FormState = {
  expiresAt: string;
  gpsLat: string;
  gpsLng: string;
  gs1TraceId: string;
  name: string;
  nodeId: string;
  quantity: string;
  uom: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  expiresAt: "", gpsLat: "", gpsLng: "", gs1TraceId: "",
  name: "", nodeId: "", quantity: "", uom: "kg"
};

export default function CreateBatchScreen() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [nodes, setNodes] = useState<NodeOption[]>([]);
  const [nodesLoading, setNodesLoading] = useState(true);

  useEffect(() => {
    async function loadNodes() {
      try {
        const result = await trpc.nodes.list.query({ limit: 50 });
        setNodes(result.map((n) => ({ id: n.id, name: n.name, nodeType: n.nodeType })));
      } catch {
        // Non-fatal — node list will appear empty
      } finally {
        setNodesLoading(false);
      }
    }
    void loadNodes();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Vui lòng nhập tên lô hàng";
    const qty = Number(form.quantity);
    if (!form.quantity.trim() || isNaN(qty) || qty <= 0) next.quantity = "Khối lượng không hợp lệ";
    if (!form.gs1TraceId.trim()) {
      next.gs1TraceId = "Vui lòng nhập GS1 Trace ID";
    } else if (!GS1_REGEX.test(form.gs1TraceId.trim())) {
      next.gs1TraceId = "Định dạng: 01[GTIN-14]10[mã lô] — ví dụ: 0108936012345670102024001";
    }
    if (!form.nodeId) next.nodeId = "Vui lòng chọn điểm chuỗi cung ứng";
    if (form.expiresAt && isNaN(new Date(form.expiresAt).getTime())) {
      next.expiresAt = "Ngày không hợp lệ — dùng định dạng YYYY-MM-DD";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await trpc.batches.create.mutate({
        name: form.name.trim(),
        quantity: Number(form.quantity),
        uom: form.uom,
        gs1TraceId: form.gs1TraceId.trim(),
        nodeId: form.nodeId,
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt) } : {}),
        ...(form.gpsLat && form.gpsLng
          ? { gpsLat: Number(form.gpsLat), gpsLng: Number(form.gpsLng) }
          : {})
      });
      setDone(true);
      setTimeout(() => router.back(), 1400);
    } catch (e) {
      Alert.alert("Lỗi", e instanceof Error ? e.message : "Không thể tạo lô hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const gpsLabel = form.gpsLat && form.gpsLng
    ? `${Number(form.gpsLat).toFixed(4)}° N, ${Number(form.gpsLng).toFixed(4)}° E`
    : "Chưa lấy vị trí";

  if (done) {
    return (
      <View style={s.successContainer}>
        <View style={s.successIcon}>
          <Text style={s.successCheck}>✓</Text>
        </View>
        <Text style={s.successTitle}>Đã tạo thành công!</Text>
        <Text style={s.successSub}>Lô hàng đang được ghi lên blockchain Polygon...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Tạo lô hàng mới</Text>

        {/* Name */}
        <View style={s.field}>
          <Text style={s.label}>Tên lô hàng</Text>
          <TextInput
            style={[s.input, errors.name && s.inputError]}
            placeholder="Ví dụ: Xoài Cát Hòa Lộc – Đợt 4"
            placeholderTextColor="#94A3B8"
            value={form.name}
            onChangeText={(v) => setField("name", v)}
            autoFocus
            returnKeyType="next"
          />
          {errors.name && <Text style={s.errorText}>{errors.name}</Text>}
        </View>

        {/* Quantity + UOM */}
        <View style={s.row}>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.label}>Khối lượng</Text>
            <TextInput
              style={[s.input, errors.quantity && s.inputError]}
              placeholder="500"
              placeholderTextColor="#94A3B8"
              value={form.quantity}
              onChangeText={(v) => setField("quantity", v)}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            {errors.quantity && <Text style={s.errorText}>{errors.quantity}</Text>}
          </View>
          <View style={[s.field, { width: 120 }]}>
            <Text style={s.label}>Đơn vị</Text>
            <View style={s.uomGrid}>
              {UOM_OPTIONS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[s.uomChip, form.uom === u && s.uomChipActive]}
                  onPress={() => setField("uom", u)}
                >
                  <Text style={[s.uomChipText, form.uom === u && s.uomChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* GS1 */}
        <View style={s.field}>
          <Text style={s.label}>GS1 Trace ID</Text>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, s.inputFlex, errors.gs1TraceId && s.inputError]}
              placeholder="0108936012345670102024001"
              placeholderTextColor="#94A3B8"
              value={form.gs1TraceId}
              onChangeText={(v) => setField("gs1TraceId", v)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TouchableOpacity style={s.iconBtn}>
              <Text style={s.iconBtnText}>Quét</Text>
            </TouchableOpacity>
          </View>
          {errors.gs1TraceId && <Text style={s.errorText}>{errors.gs1TraceId}</Text>}
        </View>

        {/* Node picker */}
        <View style={s.field}>
          <Text style={s.label}>Điểm chuỗi cung ứng</Text>
          {nodesLoading ? (
            <View style={s.nodeSkeleton} />
          ) : nodes.length === 0 ? (
            <Text style={s.hintText}>Chưa có điểm nào được phê duyệt KYB.</Text>
          ) : (
            <View style={s.nodeList}>
              {nodes.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[s.nodeChip, form.nodeId === n.id && s.nodeChipActive]}
                  onPress={() => setField("nodeId", n.id)}
                >
                  <Text style={[s.nodeChipName, form.nodeId === n.id && s.nodeChipNameActive]} numberOfLines={1}>
                    {n.name}
                  </Text>
                  <Text style={[s.nodeChipType, form.nodeId === n.id && s.nodeChipTypeActive]}>
                    {n.nodeType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.nodeId && <Text style={s.errorText}>{errors.nodeId}</Text>}
        </View>

        {/* Expiry date */}
        <View style={s.field}>
          <Text style={s.label}>
            Ngày hết hạn <Text style={s.optional}>(tùy chọn)</Text>
          </Text>
          <TextInput
            style={[s.input, errors.expiresAt && s.inputError]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            value={form.expiresAt}
            onChangeText={(v) => setField("expiresAt", v)}
            keyboardType="numbers-and-punctuation"
            returnKeyType="next"
          />
          {errors.expiresAt && <Text style={s.errorText}>{errors.expiresAt}</Text>}
        </View>

        {/* GPS */}
        <View style={s.field}>
          <Text style={s.label}>Vị trí GPS</Text>
          <View style={s.gpsRow}>
            <Text style={[s.gpsValue, !form.gpsLat && s.gpsValuePlaceholder]}>{gpsLabel}</Text>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => Alert.alert("GPS", "expo-location sẽ được tích hợp trong bản phát hành tiếp theo.")}
            >
              <Text style={s.iconBtnText}>Lấy tự động</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.dottedBtn}>
          <Text style={s.dottedBtnText}>+ Kết nối lô hàng cha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
        >
          <Text style={s.submitBtnText}>{isSubmitting ? "Đang tạo..." : "Tạo lô hàng"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, gap: 18 },
  heading: { fontSize: 24, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569" },
  optional: { fontWeight: "400", color: "#94A3B8" },
  input: { height: 50, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 14, fontSize: 15, color: "#0F172A" },
  inputFlex: { flex: 1 },
  inputError: { borderColor: "#F43F5E" },
  inputRow: { flexDirection: "row", gap: 8 },
  errorText: { fontSize: 12, color: "#F43F5E" },
  hintText: { fontSize: 13, color: "#94A3B8" },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  uomGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  uomChip: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 7, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff" },
  uomChipActive: { backgroundColor: "#14B8A6", borderColor: "#14B8A6" },
  uomChipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  uomChipTextActive: { color: "#fff" },
  nodeSkeleton: { height: 50, borderRadius: 10, backgroundColor: "#E2E8F0", opacity: 0.5 },
  nodeList: { gap: 6 },
  nodeChip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  nodeChipActive: { backgroundColor: "#F0FDFA", borderColor: "#14B8A6" },
  nodeChipName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0F172A" },
  nodeChipNameActive: { color: "#0F766E" },
  nodeChipType: { fontSize: 11, color: "#94A3B8" },
  nodeChipTypeActive: { color: "#0D9488" },
  gpsRow: { flexDirection: "row", alignItems: "center", minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", paddingHorizontal: 14, gap: 8 },
  gpsValue: { flex: 1, fontSize: 14, color: "#475569" },
  gpsValuePlaceholder: { color: "#94A3B8" },
  iconBtn: { backgroundColor: "#F1F5F9", borderRadius: 7, paddingHorizontal: 11, paddingVertical: 7, flexShrink: 0 },
  iconBtnText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  dottedBtn: { borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", borderStyle: "dashed", backgroundColor: "#F8FAFC", paddingVertical: 14, alignItems: "center" },
  dottedBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  submitBtn: { backgroundColor: "#14B8A6", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  submitBtnDisabled: { backgroundColor: "#94A3B8" },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32, backgroundColor: "#F8FAFC" },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center" },
  successCheck: { fontSize: 36, color: "#10B981" },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  successSub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 21 }
});
