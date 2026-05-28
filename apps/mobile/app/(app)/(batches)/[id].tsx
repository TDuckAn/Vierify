import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trpc } from "../../../lib/trpc";

const POLYGONSCAN_AMOY_TX_BASE_URL = "https://amoy.polygonscan.com/tx";

type ParentBatch = {
  id: string;
  name: string;
};

type BatchDetail = {
  id: string;
  name: string;
  quantity: string | number;
  uom: string;
  bcStatus: number;
  txHash?: string | null;
  docHash?: string | null;
  gs1TraceId: string;
  scanCount?: number;
  createdAt?: Date | string;
  parentBatches?: ParentBatch[];
};

function batchIsConfirmed(batch: BatchDetail): boolean {
  return batch.bcStatus === 1 && Boolean(batch.txHash);
}

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const result = await trpc.batches.get.query({ id });
        if (!isMounted) return;
        setBatch(result as BatchDetail);
        setError(undefined);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải thông tin lô hàng.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, [id]);

  const handleCopyHash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewOnPolygonscan = async () => {
    if (!batch?.txHash) return;
    await Linking.openURL(`${POLYGONSCAN_AMOY_TX_BASE_URL}/${batch.txHash}`);
  };

  const handleViewQr = () => {
    // TODO: fetch GET /batches/:id/qr → { qrDataUrl } and show in modal
  };

  if (isLoading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color="#14B8A6" size="large" />
        <Text style={styles.stateText}>Đang tải lô hàng...</Text>
      </View>
    );
  }

  if (error || !batch) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Không tìm thấy lô hàng</Text>
        <Text style={styles.stateText}>{error ?? "Lô hàng không tồn tại."}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const confirmed = batchIsConfirmed(batch);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Identity */}
      <View style={styles.identity}>
        <Text style={styles.batchName}>{batch.name}</Text>
        <Text style={styles.gs1Id}>{batch.gs1TraceId}</Text>
      </View>

      {/* Badge */}
      <View style={[styles.badge, confirmed ? styles.badgeOk : styles.badgePending]}>
        <Text style={[styles.badgeText, confirmed ? styles.badgeOkText : styles.badgePendingText]}>
          {confirmed ? "Đã xác minh trên Polygon" : "Đang xử lý blockchain"}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {([
          ["Khối lượng", `${batch.quantity} ${batch.uom}`],
          ["Lượt quét", String(batch.scanCount ?? "—")],
          ["Trạng thái", confirmed ? "Xác minh" : "Đang xử lý"],
        ] as [string, string][]).map(([label, value], i) => (
          <View key={i} style={[styles.statCell, i > 0 && styles.statCellBorder]}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Blockchain proof */}
      {confirmed && batch.txHash ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bằng chứng Blockchain</Text>
          <View style={styles.txRow}>
            <Text style={styles.txHash} numberOfLines={1}>{batch.txHash}</Text>
            <TouchableOpacity onPress={handleCopyHash} style={styles.actionChip}>
              <Text style={styles.actionChipText}>{copied ? "Đã sao chép" : "Sao chép"}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => void handleViewOnPolygonscan()}>
            <Text style={styles.externalLink}>Xem giao dịch trên Polygonscan Amoy →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingText}>
            Lô hàng đã được ghi nhận và đang chờ xác nhận từ mạng Polygon.
          </Text>
        </View>
      )}

      {/* Document */}
      {batch.docHash ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tài liệu đính kèm</Text>
          <Text style={styles.txHash} numberOfLines={1}>{batch.docHash}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.dottedCard}>
          <Text style={styles.dottedCardText}>+ Upload tài liệu</Text>
        </TouchableOpacity>
      )}

      {/* Parent batches */}
      {(batch.parentBatches ?? []).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lô hàng cha</Text>
          {(batch.parentBatches ?? []).map((parent, i) => (
            <TouchableOpacity
              key={parent.id}
              onPress={() => router.push(`/(app)/(batches)/${parent.id}` as never)}
              style={[styles.parentRow, i > 0 && styles.parentRowBorder]}
            >
              <Text style={styles.parentName}>{parent.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* QR */}
      <TouchableOpacity style={styles.qrBtn} onPress={handleViewQr}>
        <Text style={styles.qrBtnText}>Xem mã QR lô hàng</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, gap: 14 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  stateText: { fontSize: 14, color: "#64748B", textAlign: "center" },
  backLink: { marginTop: 8, paddingVertical: 8 },
  backLinkText: { fontSize: 15, fontWeight: "700", color: "#14B8A6" },
  identity: { gap: 4 },
  batchName: { fontSize: 24, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4 },
  gs1Id: { fontSize: 12, color: "#94A3B8", fontFamily: "monospace" },
  badge: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  badgeOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  badgePending: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  badgeText: { fontSize: 13, fontWeight: "600" },
  badgeOkText: { color: "#065F46" },
  badgePendingText: { color: "#92400E" },
  statsRow: { flexDirection: "row", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden", backgroundColor: "#fff" },
  statCell: { flex: 1, padding: 14, gap: 4 },
  statCellBorder: { borderLeftWidth: 1, borderLeftColor: "#E2E8F0" },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: "#94A3B8" },
  statValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  card: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  txHash: { flex: 1, fontSize: 12, color: "#475569", fontFamily: "monospace" },
  actionChip: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0 },
  actionChipText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  externalLink: { fontSize: 13, fontWeight: "600", color: "#2563EB" },
  pendingCard: { backgroundColor: "#FFFBEB", borderRadius: 10, borderWidth: 1, borderColor: "#FDE68A", padding: 14 },
  pendingText: { fontSize: 13, color: "#92400E", lineHeight: 19 },
  dottedCard: { backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, alignItems: "center" },
  dottedCardText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  parentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  parentRowBorder: { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  parentName: { flex: 1, fontSize: 14, color: "#0F172A" },
  chevron: { fontSize: 18, color: "#94A3B8" },
  qrBtn: { backgroundColor: "#14B8A6", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  qrBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
