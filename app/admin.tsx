import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { firebaseReady } from "@/shared/services/firebase";
import { getCurrentAuthEmail, listAdminActions, listAppReviews } from "@/shared/services/firebaseSync";
import { palettes, spacing } from "@/shared/theme";
import { AppReview, PaymentRequest } from "@/shared/types";

type ReviewFilter = "pending_review" | "approved" | "rejected" | "all";

const filterLabels: Record<ReviewFilter, string> = {
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  all: "All"
};

export default function AdminReview() {
  const { themeMode, paymentRequests, refreshPaymentRequests, approvePaymentRequest, rejectPaymentRequest } = useApp();
  const c = palettes[themeMode];
  const [filter, setFilter] = useState<ReviewFilter>("pending_review");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const adminMode = process.env.EXPO_PUBLIC_ADMIN_MODE === "true";
  const adminUnlocked = Boolean(__DEV__) && process.env.EXPO_PUBLIC_ADMIN_UNLOCKED === "true";
  const adminEmails = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean);
  const currentEmail = getCurrentAuthEmail();
  const emailAllowed = !firebaseReady || (Boolean(currentEmail) && adminEmails.includes(String(currentEmail).toLowerCase()));
  const allowed = adminUnlocked || (adminMode && emailAllowed);

  useEffect(() => {
    if (!allowed) return;
    refreshPaymentRequests("all")
      .then(setStatus)
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load payment requests."));
    listAppReviews()
      .then((result) => {
        if (result.ok) setReviews(result.reviews);
        else setReviewStatus("Could not load app reviews yet.");
      })
      .catch(() => setReviewStatus("Could not load app reviews yet."));
  }, [allowed]);

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const pending = paymentRequests.filter((item) => item.status === "pending_review").length;
    const approvedToday = paymentRequests.filter((item) => item.status === "approved" && item.reviewedAt?.slice(0, 10) === today).length;
    const rejected = paymentRequests.filter((item) => item.status === "rejected").length;
    const reviewed = paymentRequests.filter((item) => item.status !== "pending_review").length;
    return { pending, approvedToday, rejected, reviewed };
  }, [paymentRequests, today]);

  const visibleRequests = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return paymentRequests
      .filter((item) => (filter === "all" ? true : item.status === filter))
      .filter((item) => {
        if (!clean) return true;
        return [
          item.id,
          item.userId,
          item.userEmail ?? "",
          item.profileName ?? "",
          item.profileLocation ?? "",
          item.payerName,
          item.payerPhone,
          item.transactionId,
          item.provider,
          item.plan
        ].some((value) => value.toLowerCase().includes(clean));
      });
  }, [filter, paymentRequests, query]);

  if (!allowed) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Card variant="hero">
            <SectionLabel tone="accent">Admin only</SectionLabel>
            <H1>Payment review is locked</H1>
            <Body muted>
              {!adminMode
                ? "Set EXPO_PUBLIC_ADMIN_MODE=true and sign in with an allowed admin email to open this beta admin panel."
                : firebaseReady
                  ? "Firebase is configured, so this route also requires your signed-in email to be listed in EXPO_PUBLIC_ADMIN_EMAILS."
                  : "Admin access is unavailable."}
            </Body>
            <Body muted>Local beta override: {adminUnlocked ? "enabled" : "disabled"}</Body>
            {firebaseReady ? <Body muted>Current email: {currentEmail ?? "not signed in"}</Body> : null}
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <SectionLabel tone="accent">Manual QR review</SectionLabel>
            <H1>Admin payment panel</H1>
            <Body muted>Review eSewa/Khalti screenshots, approve premium, or reject with a clear note.</Body>
          </View>
          <Pill tone="secondary">{adminUnlocked ? "Local admin unlocked" : "Admin mode"}</Pill>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Pending" value={stats.pending} icon="clock" tone="accent" />
          <StatCard label="Approved today" value={stats.approvedToday} icon="check-circle" tone="secondary" />
          <StatCard label="Rejected" value={stats.rejected} icon="x-circle" tone="danger" />
          <StatCard label="Reviewed" value={stats.reviewed} icon="clipboard" tone="primary" />
        </View>

        <Card>
          <View style={styles.toolbar}>
            <View style={styles.flex}>
              <SectionLabel tone="secondary">Beta feedback</SectionLabel>
              <H2>Latest app reviews</H2>
              <Body muted>Star ratings and tester experience notes submitted from Settings.</Body>
            </View>
            <Button
              label="Refresh reviews"
              onPress={async () => {
                const result = await listAppReviews();
                if (result.ok) {
                  setReviews(result.reviews);
                  setReviewStatus(`Loaded ${result.reviews.length} review${result.reviews.length === 1 ? "" : "s"}.`);
                } else {
                  setReviewStatus("Could not load app reviews yet.");
                }
              }}
              secondary
            />
          </View>
          {reviewStatus ? <Body muted>{reviewStatus}</Body> : null}
          {reviews.length === 0 ? <Body muted>No app reviews submitted yet.</Body> : null}
          <View style={styles.reviewList}>
            {reviews.slice(0, 8).map((review) => (
              <View key={review.id} style={[styles.reviewCard, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewStars, { color: c.accent }]}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text>
                  <Text style={[styles.reviewMeta, { color: c.muted }]}>{new Date(review.createdAt).toLocaleString()}</Text>
                </View>
                <Body>{review.experience}</Body>
                <Body muted>{review.profileName || "Anonymous tester"}{review.profileLocation ? ` • ${review.profileLocation}` : ""}</Body>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <View style={styles.toolbar}>
            <View style={[styles.searchBox, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
              <Feather name="search" color={c.muted} size={18} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name, phone, txn, request ID"
                placeholderTextColor={c.muted}
                style={[styles.searchInput, { color: c.text }]}
              />
            </View>
            <Button
              label="Refresh"
              onPress={async () => {
                setStatus(await refreshPaymentRequests("all"));
              }}
              secondary
            />
          </View>
          <View style={styles.filterRow}>
            {(["pending_review", "approved", "rejected", "all"] as ReviewFilter[]).map((item) => {
              const active = item === filter;
              return (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: active ? c.primary : c.surfaceAlt,
                      borderColor: active ? c.borderStrong : c.border,
                      transform: [{ scale: pressed ? 0.96 : 1 }]
                    }
                  ]}
                >
                  <Text style={[styles.filterText, { color: active ? "#FFFFFF" : c.text }]}>{filterLabels[item]}</Text>
                </Pressable>
              );
            })}
          </View>
          {status ? <Body muted>{status}</Body> : null}
        </Card>

        {visibleRequests.length === 0 ? (
          <Card>
            <H2>No requests here</H2>
            <Body muted>Try another filter or refresh after a user submits a payment screenshot.</Body>
          </Card>
        ) : null}

        {visibleRequests.map((request) => (
          <PaymentReviewCard
            key={request.id}
            request={request}
            rejectNote={rejectNotes[request.id] ?? ""}
            onRejectNote={(value) => setRejectNotes((current) => ({ ...current, [request.id]: value }))}
            onApprove={async () => {
              setStatus(await approvePaymentRequest(request.id, "Manual QR payment confirmed"));
              await refreshPaymentRequests("all");
            }}
            onReject={async () => {
              const note = rejectNotes[request.id]?.trim() || "Could not verify payment screenshot/transaction.";
              setStatus(await rejectPaymentRequest(request.id, note));
              await refreshPaymentRequests("all");
            }}
          />
        ))}

        <Card variant="seasonal">
          <H2>Production safety note</H2>
          <Body muted>
            This beta panel can be opened with local admin unlock for founder testing. Before public launch, approval/rejection should move behind Firestore security rules or Cloud Functions so only real admin claims can modify subscriptions.
          </Body>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ComponentProps<typeof Feather>["name"]; tone: "primary" | "secondary" | "accent" | "danger" }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const color = tone === "secondary" ? c.secondary : tone === "accent" ? c.accent : tone === "danger" ? c.danger : c.primary;
  return (
    <View style={[styles.statCard, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: tone === "secondary" ? c.secondarySoft : tone === "accent" ? c.accentSoft : c.primarySoft }]}>
        <Feather name={icon} color={color} size={18} />
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

function PaymentReviewCard({
  request,
  rejectNote,
  onRejectNote,
  onApprove,
  onReject
}: {
  request: PaymentRequest;
  rejectNote: string;
  onRejectNote: (value: string) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const screenshot = request.screenshotDownloadUrl ?? request.screenshotUri;
  const statusTone = request.status === "approved" ? "secondary" : request.status === "rejected" ? "danger" : "accent";
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditActions, setAuditActions] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await listAdminActions(request.id);
      if (res.ok) setAuditActions(res.actions ?? []);
    } catch {
      // ignore
    }
    setLoadingAudit(false);
  };

  return (
    <Card>
      <View style={styles.requestHeader}>
        <View style={styles.flex}>
          <Pill tone={statusTone}>{request.status.replace("_", " ")}</Pill>
          <Pill tone={request.cloudSyncStatus === "local_only" ? "danger" : "secondary"}>
            {request.cloudSyncStatus === "local_only" ? "Local only" : "Cloud synced"}
          </Pill>
          <H2>{request.profileName || request.payerName || "Unnamed user"}</H2>
          <Body muted>{request.userEmail || request.userId}</Body>
        </View>
        <View style={styles.amountBox}>
          <Text style={[styles.amount, { color: c.text }]}>Rs. {request.amount}</Text>
          <Text style={[styles.amountMeta, { color: c.muted }]}>{request.provider} • {request.plan}</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <Detail label="Payer" value={request.payerName} />
        <Detail label="Phone" value={request.payerPhone} />
        <Detail label="Transaction ID" value={request.transactionId} />
        <Detail label="Location" value={request.profileLocation ?? "Not provided"} />
        <Detail label="Skin type" value={request.profileSkinType ?? "Not provided"} />
        <Detail label="Submitted" value={formatDate(request.createdAt)} />
      </View>

      {screenshot ? (
        <View style={[styles.screenshotBox, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
          <Image source={{ uri: screenshot }} style={styles.screenshot} resizeMode="cover" />
          <Button label="Open screenshot" onPress={() => Linking.openURL(screenshot)} secondary />
        </View>
      ) : (
        <Body muted>No screenshot link attached.</Body>
      )}

      {request.status === "pending_review" ? (
        <>
          <TextInput
            value={rejectNote}
            onChangeText={onRejectNote}
            placeholder="Reject note, if payment cannot be verified"
            placeholderTextColor={c.muted}
            multiline
            style={[styles.noteInput, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]}
          />
          <View style={styles.actionRow}>
            <Button label="Approve premium" onPress={onApprove} />
            <Button label="Reject" onPress={onReject} secondary />
            <Button
              label={auditOpen ? (loadingAudit ? "Loading…" : "Hide audit") : "Show audit"}
              onPress={async () => {
                if (!auditOpen) await fetchAudit();
                setAuditOpen((v) => !v);
              }}
              secondary
            />
          </View>
        </>
      ) : (
        <View style={[styles.reviewedBox, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
          <Body muted>Reviewed: {formatDate(request.reviewedAt)} • {request.reviewNote ?? "No note"}</Body>
          <View style={{ marginTop: 8 }}>
            <Button
              label={auditOpen ? (loadingAudit ? "Loading…" : "Hide audit") : "Show audit"}
              onPress={async () => {
                if (!auditOpen) await fetchAudit();
                setAuditOpen((v) => !v);
              }}
              secondary
            />
            {auditOpen && (
              <View style={{ marginTop: 8 }}>
                {auditActions.length === 0 ? (
                  <Body muted>No admin actions found.</Body>
                ) : (
                  auditActions.map((a) => (
                    <View key={a.id} style={{ paddingVertical: 6 }}>
                      <Body muted>{a.actionType} • {a.adminId ?? 'unknown'} • {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : String(a.createdAt)}</Body>
                      {a.payload?.note ? <Body>{a.payload.note}</Body> : null}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.detail, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
      <Text style={[styles.detailLabel, { color: c.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function formatDate(value?: string) {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { flexGrow: 1, flexBasis: 148, borderWidth: 1, borderRadius: 16, padding: spacing.md, gap: spacing.xs },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 28, fontWeight: "900" },
  statLabel: { fontSize: 13, fontWeight: "800" },
  toolbar: { gap: spacing.sm },
  searchBox: { borderWidth: 1, borderRadius: 999, minHeight: 46, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  searchInput: { flex: 1, minHeight: 44, fontSize: 15 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  filterChip: { borderWidth: 1, borderRadius: 999, minHeight: 38, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  filterText: { fontSize: 13, fontWeight: "900" },
  reviewList: { gap: spacing.sm },
  reviewCard: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.xs },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  reviewStars: { fontSize: 16, fontWeight: "900" },
  reviewMeta: { fontSize: 12, fontWeight: "800" },
  requestHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  amountBox: { alignItems: "flex-end", gap: 2 },
  amount: { fontSize: 22, fontWeight: "900" },
  amountMeta: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  detail: { flexGrow: 1, flexBasis: 160, borderWidth: 1, borderRadius: 12, padding: spacing.sm, gap: 2 },
  detailLabel: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailValue: { fontSize: 14, fontWeight: "800" },
  screenshotBox: { borderWidth: 1, borderRadius: 14, padding: spacing.sm, gap: spacing.sm },
  screenshot: { width: "100%", height: 220, borderRadius: 10 },
  noteInput: { borderWidth: 1, borderRadius: 12, minHeight: 78, padding: spacing.sm, fontSize: 14, textAlignVertical: "top" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reviewedBox: { borderWidth: 1, borderRadius: 12, padding: spacing.sm }
});
