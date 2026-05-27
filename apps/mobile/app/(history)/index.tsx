import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { trpc } from "../../lib/trpc";

type HistoryBatch = {
  bcStatus: number;
  createdAt?: Date | string;
  gs1TraceId: string;
  id: string;
  name: string;
  quantity: string;
  txHash?: string | null;
  uom: string;
};

function getProofLabel(batch: HistoryBatch): "Confirmed" | "Pending" {
  return batch.bcStatus === 1 && Boolean(batch.txHash) ? "Confirmed" : "Pending";
}

function formatCreatedAt(value: Date | string | undefined): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
}

export default function HistoryScreen() {
  const [batches, setBatches] = useState<HistoryBatch[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const result = await trpc.batches.list.query({ limit: 20 });

        if (!isMounted) {
          return;
        }

        setBatches(
          result.map((batch) => ({
            bcStatus: batch.bcStatus,
            createdAt: batch.createdAt,
            gs1TraceId: batch.gs1TraceId,
            id: batch.id,
            name: batch.name,
            quantity: batch.quantity,
            txHash: batch.txHash,
            uom: batch.uom
          }))
        );
        setError(undefined);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Unable to load history.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Batch history</Text>
        <Text style={styles.title}>Recent scans</Text>
        <Link href="/(scan)" style={styles.link}>
          Scan
        </Link>
      </View>

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading history</Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>History unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error && batches.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>No batches yet</Text>
          <Text style={styles.stateText}>Scanned batches will appear here.</Text>
        </View>
      ) : null}

      {!isLoading && !error
        ? batches.map((batch) => {
            const proofLabel = getProofLabel(batch);
            const isConfirmed = proofLabel === "Confirmed";

            return (
              <View key={batch.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleGroup}>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.traceId}>{batch.gs1TraceId}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      isConfirmed ? styles.confirmedBadge : styles.pendingBadge
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isConfirmed ? styles.confirmedText : styles.pendingText
                      ]}
                    >
                      {proofLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {batch.quantity} {batch.uom}
                  </Text>
                  <Text style={styles.metaText}>{formatCreatedAt(batch.createdAt)}</Text>
                </View>
                {batch.txHash ? (
                  <Text style={styles.txHash} numberOfLines={1}>
                    {batch.txHash}
                  </Text>
                ) : (
                  <Text style={styles.pendingCopy}>
                    Waiting for Polygon confirmation.
                  </Text>
                )}
              </View>
            );
          })
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  batchName: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700"
  },
  card: {
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  cardTitleGroup: {
    flex: 1,
    gap: 4
  },
  confirmedBadge: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0"
  },
  confirmedText: {
    color: "#047857"
  },
  container: {
    gap: 16,
    padding: 20
  },
  eyebrow: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  header: {
    gap: 6
  },
  link: {
    color: "#1d4ed8",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metaText: {
    color: "#475569",
    fontSize: 13
  },
  pendingBadge: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a"
  },
  pendingCopy: {
    color: "#92400e",
    fontSize: 13
  },
  pendingText: {
    color: "#92400e"
  },
  state: {
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  stateText: {
    color: "#64748b",
    fontSize: 14
  },
  stateTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700"
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800"
  },
  traceId: {
    color: "#64748b",
    fontSize: 12
  },
  txHash: {
    color: "#334155",
    fontFamily: "monospace",
    fontSize: 12
  }
});
