import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { budgetTiers, skinTypes, useApp } from "@/shared/AppContext";
import { Body, Button, Card, H1, H2, Pill, Screen, SectionLabel, Segment } from "@/shared/components";
import { firebaseReady } from "@/shared/services/firebase";
import {
  archiveAdminProduct,
  bulkSaveAdminProducts,
  checkCurrentUserAdminAccess,
  getAdminMetrics,
  getCurrentAuthEmail,
  getCurrentAuthUid,
  listAdminActions,
  listAdminProducts,
  listAdminUsers,
  listAppReviews,
  saveAdminProduct
} from "@/shared/services/firebaseSync";
import { palettes, spacing } from "@/shared/theme";
import { AdminMetrics, AdminProduct, AdminUserSummary, AppReview, BudgetTier, PaymentRequest, SkinType } from "@/shared/types";

type AdminSection = "overview" | "review" | "users" | "data" | "products" | "reviews" | "settings";
type ReviewFilter = "pending_review" | "approved" | "rejected" | "all";

const sections: Array<{ id: AdminSection; label: string; icon: ComponentProps<typeof Feather>["name"] }> = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "review", label: "Review", icon: "credit-card" },
  { id: "users", label: "Users", icon: "users" },
  { id: "data", label: "Data", icon: "bar-chart-2" },
  { id: "products", label: "Products", icon: "package" },
  { id: "reviews", label: "Reviews", icon: "star" },
  { id: "settings", label: "Settings", icon: "settings" }
];

const emptyMetrics: AdminMetrics = {
  totalUsers: 0,
  premiumUsers: 0,
  pendingPayments: 0,
  approvedPayments: 0,
  rejectedPayments: 0,
  totalReviews: 0,
  averageRating: 0,
  activeProducts: 0,
  draftProducts: 0
};

const emptyProductForm = {
  name: "",
  category: "Cleanser",
  price: "",
  priceMin: "",
  priceMax: "",
  budgetTier: "200to500" as BudgetTier,
  fit: "oily|combination",
  ingredients: "",
  affiliateUrl: "https://www.daraz.com.np/",
  imageUrl: "",
  trustScore: "80",
  fakeRisk: "medium" as NonNullable<AdminProduct["fakeRisk"]>,
  sponsored: false,
  whereToBuy: "Daraz|local pharmacy",
  whyMatched: "",
  whyNot: "",
  safetyNote: "",
  status: "active" as AdminProduct["status"]
};

export default function AdminDashboard() {
  const { themeMode, paymentRequests, refreshPaymentRequests, approvePaymentRequest, rejectPaymentRequest, signInWithEmail } = useApp();
  const c = palettes[themeMode];
  const adminSidebar = getAdminSidebarPalette(themeMode);
  const [section, setSection] = useState<AdminSection>("overview");
  const [status, setStatus] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [adminAccess, setAdminAccess] = useState<{ allowed: boolean; uid: string | null; source?: string; error?: string }>({ allowed: false, uid: getCurrentAuthUid() });
  const [metrics, setMetrics] = useState<AdminMetrics>(emptyMetrics);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("pending_review");
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ valid: AdminProduct[]; errors: string[] }>({ valid: [], errors: [] });
  const adminMode = process.env.EXPO_PUBLIC_ADMIN_MODE === "true";
  const adminUnlocked = Boolean(__DEV__) && process.env.EXPO_PUBLIC_ADMIN_UNLOCKED === "true";
  const allowed = firebaseReady ? adminAccess.allowed : adminUnlocked || adminMode;

  const refreshAdminAccess = async () => {
    const result = await checkCurrentUserAdminAccess();
    setAdminAccess({ allowed: result.allowed, uid: result.uid, source: "source" in result ? result.source : undefined, error: "error" in result ? result.error : undefined });
    return result;
  };

  const refreshAll = async () => {
    const [paymentMessage, metricsResult, usersResult, reviewsResult, productsResult] = await Promise.all([
      refreshPaymentRequests("all"),
      getAdminMetrics(),
      listAdminUsers(),
      listAppReviews(100),
      listAdminProducts(true)
    ]);
    setStatus(paymentMessage);
    if (metricsResult.ok) setMetrics(metricsResult.metrics);
    if (usersResult.ok) setUsers(usersResult.users);
    if (reviewsResult.ok) setReviews(reviewsResult.reviews);
    if (productsResult.ok) setAdminProducts(productsResult.products);
    setLastCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  };

  useEffect(() => {
    refreshAdminAccess().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    refreshAll().catch((error) => setStatus(error instanceof Error ? error.message : "Could not refresh admin data."));
  }, [allowed]);

  const visibleRequests = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return paymentRequests
      .filter((item) => (filter === "all" ? true : item.status === filter))
      .filter((item) => matchesQuery(clean, [item.id, item.userId, item.userEmail, item.profileName, item.payerName, item.payerPhone, item.transactionId, item.provider, item.plan]));
  }, [filter, paymentRequests, query]);

  const visibleUsers = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return users.filter((item) => matchesQuery(clean, [item.id, item.name, item.location, item.skinType, item.subscriptionStatus, item.subscriptionTier]));
  }, [query, users]);

  if (!allowed) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Card variant="hero">
            <SectionLabel tone="accent">Admin only</SectionLabel>
            <H1>Prabha admin is locked</H1>
            <Body muted>
              {firebaseReady ? "Sign in with an admin account that has an adminUsers/{uid} document or admin custom claim." : "Firebase is not configured. Local admin UI testing needs EXPO_PUBLIC_ADMIN_MODE=true."}
            </Body>
            <Body muted>Current email: {getCurrentAuthEmail() ?? "not signed in"}</Body>
            <Body muted>Current UID: {adminAccess.uid ?? "not signed in"}</Body>
            {adminAccess.error ? <Body muted>{adminAccess.error}</Body> : null}
            <View style={styles.authBox}>
              <TextInput value={adminEmail} onChangeText={setAdminEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Admin email" placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
              <TextInput value={adminPassword} onChangeText={setAdminPassword} secureTextEntry placeholder="Admin password" placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
              <Button
                label="Sign in as admin"
                onPress={async () => {
                  try {
                    const result = await signInWithEmail(adminEmail, adminPassword);
                    const access = await refreshAdminAccess();
                    setAuthStatus(`${result.message} Admin access: ${access.allowed ? "yes" : "no"}.`);
                  } catch (error) {
                    setAuthStatus(error instanceof Error ? error.message : "Could not sign in.");
                  }
                }}
              />
              {authStatus ? <Body muted>{authStatus}</Body> : null}
            </View>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.shell}>
        <View style={[styles.sidebar, { backgroundColor: adminSidebar.bg, borderColor: adminSidebar.border }]}>
          <Text style={[styles.sidebarTitle, { color: adminSidebar.title }]}>Prabha Admin</Text>
          <Text style={[styles.sidebarSubtitle, { color: adminSidebar.muted }]}>Founder dashboard</Text>
          <View style={styles.navList}>
            {sections.map((item) => {
              const active = item.id === section;
              return (
                <Pressable key={item.id} onPress={() => setSection(item.id)} style={[styles.navItem, { backgroundColor: active ? adminSidebar.activeBg : "transparent" }]}>
                  <Feather name={item.icon} color={active ? adminSidebar.activeText : adminSidebar.text} size={18} />
                  <Text style={[styles.navText, { color: active ? adminSidebar.activeText : adminSidebar.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <SectionLabel tone="accent">Admin panel</SectionLabel>
              <H1>{sections.find((item) => item.id === section)?.label ?? "Overview"}</H1>
              <Body muted>Manage payments, users, proof metrics, reviews, and admin-added earning products.</Body>
            </View>
            <View style={styles.actionRow}>
              <Pill tone="secondary">{firebaseReady ? "Firebase connected" : "Local mode"}</Pill>
              <Button label="Refresh" onPress={refreshAll} secondary />
            </View>
          </View>

          {section === "overview" ? <OverviewSection metrics={metrics} status={status} lastCheckedAt={lastCheckedAt} /> : null}
          {section === "review" ? (
            <ReviewSection
              query={query}
              setQuery={setQuery}
              filter={filter}
              setFilter={setFilter}
              visibleRequests={visibleRequests}
              rejectNotes={rejectNotes}
              setRejectNotes={setRejectNotes}
              onApprove={async (id) => {
                setStatus(await approvePaymentRequest(id, "Manual QR payment confirmed"));
                await refreshAll();
              }}
              onReject={async (id, note) => {
                setStatus(await rejectPaymentRequest(id, note || "Could not verify payment screenshot/transaction."));
                await refreshAll();
              }}
            />
          ) : null}
          {section === "users" ? <UsersSection query={query} setQuery={setQuery} users={visibleUsers} /> : null}
          {section === "data" ? <DataSection metrics={metrics} /> : null}
          {section === "products" ? (
            <ProductsAdminSection
              products={adminProducts}
              form={productForm}
              setForm={setProductForm}
              csvText={csvText}
              setCsvText={setCsvText}
              csvPreview={csvPreview}
              setCsvPreview={setCsvPreview}
              onSave={async () => {
                const product = buildAdminProductFromForm(productForm, "admin_form");
                if (!product.ok) {
                  setStatus(product.error);
                  return;
                }
                const result = await saveAdminProduct(product.product);
                setStatus(result.ok ? "Product saved to admin catalog." : ("error" in result ? result.error ?? "Could not save product." : "Could not save product."));
                if (result.ok) {
                  setProductForm(emptyProductForm);
                  await refreshAll();
                }
              }}
              onImport={async () => {
                const result = await bulkSaveAdminProducts(csvPreview.valid);
                setStatus(`Imported ${result.saved.length} product${result.saved.length === 1 ? "" : "s"}. ${result.errors.length ? `${result.errors.length} failed.` : ""}`);
                setCsvText("");
                setCsvPreview({ valid: [], errors: [] });
                await refreshAll();
              }}
              onArchive={async (id) => {
                const result = await archiveAdminProduct(id);
                setStatus(result.ok ? "Product archived." : ("error" in result ? result.error ?? "Could not archive product." : "Could not archive product."));
                await refreshAll();
              }}
            />
          ) : null}
          {section === "reviews" ? <ReviewsSection reviews={reviews} /> : null}
          {section === "settings" ? <SettingsSection adminAccess={adminAccess} lastCheckedAt={lastCheckedAt} /> : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

function OverviewSection({ metrics, status, lastCheckedAt }: { metrics: AdminMetrics; status: string | null; lastCheckedAt: string | null }) {
  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard label="Total users" value={metrics.totalUsers} icon="users" tone="primary" />
        <StatCard label="Premium users" value={metrics.premiumUsers} icon="award" tone="secondary" />
        <StatCard label="Pending payments" value={metrics.pendingPayments} icon="clock" tone="accent" />
        <StatCard label="Active products" value={metrics.activeProducts} icon="package" tone="primary" />
      </View>
      <Card>
        <H2>Admin snapshot</H2>
        <Body muted>{status ?? "Ready."}</Body>
        <Body muted>Last checked: {lastCheckedAt ?? "not checked yet"}</Body>
      </Card>
    </>
  );
}

function ReviewSection(props: {
  query: string;
  setQuery: (value: string) => void;
  filter: ReviewFilter;
  setFilter: (value: ReviewFilter) => void;
  visibleRequests: PaymentRequest[];
  rejectNotes: Record<string, string>;
  setRejectNotes: (value: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)) => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
}) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];

  return (
    <>
      <AdminSearch value={props.query} onChange={props.setQuery} placeholder="Search payer, phone, transaction, request ID" />
      <View style={styles.filterRow}>
        {(["pending_review", "approved", "rejected", "all"] as ReviewFilter[]).map((item) => (
          <Button key={item} label={item.replace("_", " ")} onPress={() => props.setFilter(item)} secondary={props.filter !== item} />
        ))}
      </View>
      {props.visibleRequests.map((request) => (
        <PaymentReviewCard
          key={request.id}
          request={request}
          rejectNote={props.rejectNotes[request.id] ?? ""}
          onRejectNote={(note) => props.setRejectNotes((current) => ({ ...current, [request.id]: note }))}
          onApprove={() => props.onApprove(request.id)}
          onReject={() => props.onReject(request.id, props.rejectNotes[request.id] ?? "")}
        />
      ))}
      {!props.visibleRequests.length ? <Card><H2>No requests</H2><Body muted>No payment requests match this filter.</Body></Card> : null}
    </>
  );
}

function UsersSection({ query, setQuery, users }: { query: string; setQuery: (value: string) => void; users: AdminUserSummary[] }) {
  return (
    <>
      <AdminSearch value={query} onChange={setQuery} placeholder="Search users by name, location, skin type" />
      <Card>
        <TableHeader columns={["User", "Skin", "Subscription", "Check-ins"]} />
        {users.map((user) => (
          <View key={user.id} style={styles.tableRow}>
            <TableCell title={user.name || "Unnamed"} subtitle={user.location || user.id} />
            <TableCell title={user.skinType || "unknown"} />
            <TableCell title={user.subscriptionTier || "free"} subtitle={user.subscriptionStatus} />
            <TableCell title={String(user.checkInCount)} subtitle={user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : undefined} />
          </View>
        ))}
      </Card>
    </>
  );
}

function DataSection({ metrics }: { metrics: AdminMetrics }) {
  const proofLines = [
    `Total users: ${metrics.totalUsers}`,
    `Premium users: ${metrics.premiumUsers}`,
    `Payment proof: ${metrics.approvedPayments} approved, ${metrics.pendingPayments} pending, ${metrics.rejectedPayments} rejected`,
    `Reviews: ${metrics.totalReviews} with ${metrics.averageRating}/5 average rating`,
    `Products managed: ${metrics.activeProducts} active and ${metrics.draftProducts} draft`
  ];
  return (
    <Card>
      <SectionLabel tone="secondary">Portfolio proof</SectionLabel>
      <H2>Non-sensitive growth summary</H2>
      {proofLines.map((line) => <Body key={line}>{line}</Body>)}
      <Body muted>Use these aggregate numbers in your portfolio. Avoid sharing raw user phone, email, screenshots, or payment IDs publicly.</Body>
    </Card>
  );
}

function ProductsAdminSection({
  products,
  form,
  setForm,
  csvText,
  setCsvText,
  csvPreview,
  setCsvPreview,
  onSave,
  onImport,
  onArchive
}: {
  products: AdminProduct[];
  form: typeof emptyProductForm;
  setForm: (value: typeof emptyProductForm | ((current: typeof emptyProductForm) => typeof emptyProductForm)) => void;
  csvText: string;
  setCsvText: (value: string) => void;
  csvPreview: { valid: AdminProduct[]; errors: string[] };
  setCsvPreview: (value: { valid: AdminProduct[]; errors: string[] }) => void;
  onSave: () => Promise<void>;
  onImport: () => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];

  return (
    <>
      <Card>
        <SectionLabel tone="accent">Manual product add</SectionLabel>
        <H2>Add earning product</H2>
        <View style={styles.formGrid}>
          <AdminInput label="Name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
          <AdminInput label="Category" value={form.category} onChange={(category) => setForm((current) => ({ ...current, category }))} />
          <AdminInput label="Price" value={form.price} onChange={(price) => setForm((current) => ({ ...current, price }))} />
          <AdminInput label="Price min" value={form.priceMin} onChange={(priceMin) => setForm((current) => ({ ...current, priceMin }))} keyboardType="numeric" />
          <AdminInput label="Price max" value={form.priceMax} onChange={(priceMax) => setForm((current) => ({ ...current, priceMax }))} keyboardType="numeric" />
          <AdminInput label="Ingredients | separated" value={form.ingredients} onChange={(ingredients) => setForm((current) => ({ ...current, ingredients }))} />
          <AdminInput label="Affiliate URL" value={form.affiliateUrl} onChange={(affiliateUrl) => setForm((current) => ({ ...current, affiliateUrl }))} />
          <AdminInput label="Image URL" value={form.imageUrl} onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} />
          <AdminInput label="Where to buy | separated" value={form.whereToBuy} onChange={(whereToBuy) => setForm((current) => ({ ...current, whereToBuy }))} />
          <AdminInput label="Why matched" value={form.whyMatched} onChange={(whyMatched) => setForm((current) => ({ ...current, whyMatched }))} />
          <AdminInput label="Why not" value={form.whyNot} onChange={(whyNot) => setForm((current) => ({ ...current, whyNot }))} />
          <AdminInput label="Safety note" value={form.safetyNote} onChange={(safetyNote) => setForm((current) => ({ ...current, safetyNote }))} />
        </View>
        <Body muted>Budget tier</Body>
        <Segment value={form.budgetTier} options={budgetTiers} onChange={(budgetTier: BudgetTier) => setForm((current) => ({ ...current, budgetTier }))} />
        <Body muted>Skin fit</Body>
        <Segment value={form.fit.split("|")[0] as SkinType} options={skinTypes} onChange={(fit: SkinType) => setForm((current) => ({ ...current, fit }))} />
        <Body muted>Status</Body>
        <Segment value={form.status} options={["active", "draft", "archived"]} onChange={(status: AdminProduct["status"]) => setForm((current) => ({ ...current, status }))} />
        <Button label="Save product" onPress={onSave} />
      </Card>

      <Card>
        <SectionLabel tone="secondary">CSV import</SectionLabel>
        <H2>Bulk add products</H2>
        <Body muted>Required columns: name, category, price, budgetTier, fit, ingredients, affiliateUrl. Use | for lists.</Body>
        <Button label="Choose CSV file" onPress={async () => setCsvText(await pickCsvText())} secondary />
        <TextInput
          value={csvText}
          onChangeText={setCsvText}
          multiline
          placeholder="Paste CSV here"
          placeholderTextColor={c.muted}
          style={[styles.csvBox, { backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }]}
        />
        <View style={styles.actionRow}>
          <Button label="Preview CSV" onPress={() => setCsvPreview(parseProductsCsv(csvText))} secondary />
          <Button label={`Import ${csvPreview.valid.length}`} onPress={onImport} secondary={!csvPreview.valid.length} />
        </View>
        {csvPreview.errors.map((error) => <Body key={error} muted>{error}</Body>)}
        {csvPreview.valid.slice(0, 5).map((product) => <Body key={product.id}>{product.name} - {product.price}</Body>)}
      </Card>

      <Card>
        <H2>Admin products</H2>
        <TableHeader columns={["Product", "Status", "Price", "Action"]} />
        {products.map((product) => (
          <View key={product.id} style={styles.tableRow}>
            <TableCell title={product.name} subtitle={product.category} />
            <TableCell title={product.status} subtitle={product.source} />
            <TableCell title={product.price} subtitle={`Trust ${product.trustScore}%`} />
            <Button label="Archive" onPress={() => onArchive(product.id)} secondary />
          </View>
        ))}
      </Card>
    </>
  );
}

function ReviewsSection({ reviews }: { reviews: AppReview[] }) {
  return (
    <Card>
      <H2>App reviews</H2>
      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewLine}>
          <Text style={styles.stars}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text>
          <Body>{review.experience}</Body>
          <Body muted>{review.profileName || "Anonymous"} - {new Date(review.createdAt).toLocaleString()}</Body>
        </View>
      ))}
      {!reviews.length ? <Body muted>No app reviews yet.</Body> : null}
    </Card>
  );
}

function SettingsSection({ adminAccess, lastCheckedAt }: { adminAccess: { allowed: boolean; uid: string | null; source?: string; error?: string }; lastCheckedAt: string | null }) {
  return (
    <Card>
      <H2>Admin safety</H2>
      <Body>Access: {adminAccess.allowed ? "allowed" : "blocked"}</Body>
      <Body muted>UID: {adminAccess.uid ?? "none"}</Body>
      <Body muted>Source: {adminAccess.source ?? "local/config"}</Body>
      <Body muted>Last checked: {lastCheckedAt ?? "not checked yet"}</Body>
      <Body muted>Keep raw payment screenshots, phone numbers, and emails private. Share only aggregate metrics in portfolios.</Body>
    </Card>
  );
}

function PaymentReviewCard({ request, rejectNote, onRejectNote, onApprove, onReject }: { request: PaymentRequest; rejectNote: string; onRejectNote: (value: string) => void; onApprove: () => Promise<void>; onReject: () => Promise<void> }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const screenshot = request.screenshotDownloadUrl ?? request.screenshotUri;
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditActions, setAuditActions] = useState<any[]>([]);
  return (
    <Card>
      <View style={styles.requestHeader}>
        <View style={styles.flex}>
          <Pill tone={request.status === "approved" ? "secondary" : request.status === "rejected" ? "danger" : "accent"}>{request.status.replace("_", " ")}</Pill>
          <H2>{request.profileName || request.payerName || "Unnamed user"}</H2>
          <Body muted>{request.userEmail || request.userId}</Body>
        </View>
        <View style={styles.amountBox}>
          <Text style={[styles.amount, { color: c.text }]}>Rs. {request.amount}</Text>
          <Text style={[styles.amountMeta, { color: c.muted }]}>{request.provider} - {request.plan}</Text>
        </View>
      </View>
      <View style={styles.detailGrid}>
        <Detail label="Payer" value={request.payerName} />
        <Detail label="Phone" value={request.payerPhone} />
        <Detail label="Transaction" value={request.transactionId} />
        <Detail label="Submitted" value={formatDate(request.createdAt)} />
      </View>
      {screenshot ? (
        <View style={[styles.screenshotBox, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
          <Image source={{ uri: screenshot }} style={styles.screenshot} resizeMode="cover" />
          <Button label="Open screenshot" onPress={() => Linking.openURL(screenshot)} secondary />
        </View>
      ) : <Body muted>No screenshot attached.</Body>}
      {request.status === "pending_review" ? (
        <>
          <TextInput value={rejectNote} onChangeText={onRejectNote} placeholder="Reject note" multiline style={[styles.noteInput, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
          <View style={styles.actionRow}>
            <Button label="Approve premium" onPress={onApprove} />
            <Button label="Reject" onPress={onReject} secondary />
          </View>
        </>
      ) : <Body muted>Reviewed: {formatDate(request.reviewedAt)} - {request.reviewNote ?? "No note"}</Body>}
      <Button
        label={auditOpen ? "Hide audit" : "Show audit"}
        onPress={async () => {
          if (!auditOpen) {
            const result = await listAdminActions(request.id);
            if (result.ok) setAuditActions(result.actions);
          }
          setAuditOpen((value) => !value);
        }}
        secondary
      />
      {auditOpen ? auditActions.map((action) => <Body key={action.id} muted>{action.actionType} - {action.adminId ?? "unknown"}</Body>) : null}
    </Card>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ComponentProps<typeof Feather>["name"]; tone: "primary" | "secondary" | "accent" | "danger" }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const color = tone === "secondary" ? c.secondary : tone === "accent" ? c.accent : tone === "danger" ? c.danger : c.primary;
  return (
    <View style={[styles.statCard, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Feather name={icon} color={color} size={20} />
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

function AdminSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={[styles.searchBox, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
      <Feather name="search" color={c.muted} size={18} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.muted} style={[styles.searchInput, { color: c.text }]} />
    </View>
  );
}

function AdminInput({ label, value, onChange, keyboardType }: { label: string; value: string; onChange: (value: string) => void; keyboardType?: "default" | "numeric" }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  return (
    <View style={styles.field}>
      <Body muted>{label}</Body>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboardType} placeholder={label} placeholderTextColor={c.muted} style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt }]} />
    </View>
  );
}

function TableHeader({ columns }: { columns: string[] }) {
  return <View style={styles.tableHeader}>{columns.map((column) => <Text key={column} style={styles.tableHeaderText}>{column}</Text>)}</View>;
}

function TableCell({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.tableCell}>
      <Body>{title}</Body>
      {subtitle ? <Body muted>{subtitle}</Body> : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];

  return (
    <View style={[styles.detail, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      <Text style={[styles.detailLabel, { color: c.muted }]}>{label}</Text>
      <Body>{value}</Body>
    </View>
  );
}

function matchesQuery(query: string, values: Array<string | undefined | null>) {
  if (!query) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(query));
}

function buildAdminProductFromForm(form: typeof emptyProductForm, source: AdminProduct["source"]): { ok: true; product: AdminProduct } | { ok: false; error: string } {
  if (!form.name.trim() || !form.category.trim() || !form.price.trim() || !form.affiliateUrl.trim()) return { ok: false, error: "Name, category, price, and affiliate URL are required." };
  const ingredients = splitList(form.ingredients);
  const fit = splitList(form.fit).filter((item): item is SkinType => skinTypes.includes(item as SkinType));
  if (!fit.length) return { ok: false, error: "Choose at least one skin type fit." };
  const now = new Date().toISOString();
  const id = `admin_product_${slug(form.name)}_${Date.now()}`;
  return {
    ok: true,
    product: {
      id,
      name: form.name.trim(),
      category: form.category.trim(),
      price: form.price.trim(),
      priceMin: Number(form.priceMin) || undefined,
      priceMax: Number(form.priceMax) || undefined,
      budgetTier: form.budgetTier,
      fit,
      ingredients,
      whereToBuy: splitList(form.whereToBuy),
      localAvailability: true,
      fakeRisk: form.fakeRisk ?? "medium",
      whyMatched: { en: form.whyMatched || `Admin-added ${form.category} product for ${fit.join("/")} skin.`, ne: form.whyMatched || `Admin-added ${form.category} product.` },
      whyNot: { en: form.whyNot || "Skip if it burns, clogs pores, feels too heavy, or seller/expiry looks suspicious.", ne: form.whyNot || "Burn, pore clog, heavy feel, wa suspicious seller bhaye skip." },
      safetyNote: { en: form.safetyNote || "Check seller, seal, batch, expiry, and patch test.", ne: form.safetyNote || "Seller, seal, batch, expiry check ra patch test garnu." },
      ingredientLabel: { en: `${ingredients.join(", ")}. ${form.safetyNote || "Patch test first."}`, ne: `${ingredients.join(", ")}. Patch test garnu.` },
      trustScore: Math.max(0, Math.min(100, Number(form.trustScore) || 80)),
      sponsored: form.sponsored,
      affiliateUrl: form.affiliateUrl.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      visualCategory: form.category.trim(),
      status: form.status,
      source,
      createdAt: now,
      updatedAt: now,
      createdBy: getCurrentAuthUid(),
      updatedBy: getCurrentAuthUid()
    }
  };
}

function parseProductsCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { valid: [] as AdminProduct[], errors: ["CSV needs a header row and at least one product row."] };
  const headers = splitCsvLine(lines[0]).map((item) => item.trim());
  const required = ["name", "category", "price", "budgetTier", "fit", "ingredients", "affiliateUrl"];
  const errors: string[] = [];
  required.forEach((column) => {
    if (!headers.includes(column)) errors.push(`Missing required column: ${column}`);
  });
  const importBatchId = `import_${Date.now()}`;
  const valid: AdminProduct[] = [];
  lines.slice(1).forEach((line, index) => {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));
    const result = buildAdminProductFromForm({
      ...emptyProductForm,
      name: row.name,
      category: row.category,
      price: row.price,
      priceMin: row.priceMin ?? "",
      priceMax: row.priceMax ?? "",
      budgetTier: budgetTiers.includes(row.budgetTier as BudgetTier) ? row.budgetTier as BudgetTier : "200to500",
      fit: row.fit,
      ingredients: row.ingredients,
      affiliateUrl: row.affiliateUrl,
      imageUrl: row.imageUrl ?? "",
      trustScore: row.trustScore ?? "80",
      fakeRisk: ["low", "medium", "high"].includes(row.fakeRisk) ? row.fakeRisk as NonNullable<AdminProduct["fakeRisk"]> : "medium",
      sponsored: row.sponsored === "true",
      whereToBuy: row.whereToBuy ?? "",
      whyMatched: row.whyMatched ?? "",
      whyNot: row.whyNot ?? "",
      safetyNote: row.safetyNote ?? "",
      status: ["active", "draft", "archived"].includes(row.status) ? row.status as AdminProduct["status"] : "active"
    }, "csv_import");
    if (result.ok) valid.push({ ...result.product, importBatchId });
    else errors.push(`Row ${index + 2}: ${result.error}`);
  });
  return { valid, errors };
}

async function pickCsvText() {
  if (Platform.OS !== "web" || typeof document === "undefined") return "";
  return new Promise<string>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    };
    input.click();
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function splitList(value: string) {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "product";
}

function formatDate(value?: string) {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getAdminSidebarPalette(themeMode: "light" | "dark") {
  if (themeMode === "dark") {
    return {
      bg: "#211316",
      border: "#4D2932",
      title: "#FFF8F5",
      muted: "#E9B8AF",
      text: "#FBEFEB",
      activeText: "#FFFFFF",
      activeBg: "#5A3440"
    };
  }
  return {
    bg: "#2B160F",
    border: "#4B2B20",
    title: "#FFF8F2",
    muted: "#E7B9A8",
    text: "#FFF5EE",
    activeText: "#FFFFFF",
    activeBg: "#65483D"
  };
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row" },
  sidebar: { width: 230, borderRightWidth: 1, padding: spacing.md, gap: spacing.md },
  sidebarTitle: { fontSize: 22, lineHeight: 28, fontWeight: "900", fontFamily: "Georgia" },
  sidebarSubtitle: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  navList: { gap: spacing.xs },
  navItem: { minHeight: 44, borderRadius: 8, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  navText: { fontSize: 14, fontWeight: "900" },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, flexWrap: "wrap" },
  flex: { flex: 1, gap: spacing.xs },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  authBox: { gap: spacing.sm, marginTop: spacing.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { flexGrow: 1, flexBasis: 150, borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
  statValue: { fontSize: 28, fontWeight: "900" },
  statLabel: { fontSize: 13, fontWeight: "800" },
  searchBox: { borderWidth: 1, borderRadius: 999, minHeight: 46, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  searchInput: { flex: 1, minHeight: 44, fontSize: 15 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  requestHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  amountBox: { alignItems: "flex-end", gap: 2 },
  amount: { fontSize: 22, fontWeight: "900" },
  amountMeta: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  detail: { flexGrow: 1, flexBasis: 150, borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: 2 },
  detailLabel: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  screenshotBox: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.sm },
  screenshot: { width: "100%", height: 220, borderRadius: 8 },
  noteInput: { borderWidth: 1, borderRadius: 8, minHeight: 78, padding: spacing.sm, fontSize: 14, textAlignVertical: "top" },
  tableHeader: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
  tableHeaderText: { flex: 1, fontSize: 11, fontWeight: "900", textTransform: "uppercase", color: "#8A94A6" },
  tableRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(140,148,166,0.18)", paddingVertical: spacing.sm },
  tableCell: { flex: 1, minWidth: 0 },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  field: { flexGrow: 1, flexBasis: 220, gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  csvBox: { minHeight: 130, borderWidth: 1, borderColor: "#D4D8E1", borderRadius: 8, padding: spacing.sm, textAlignVertical: "top" },
  reviewLine: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(140,148,166,0.18)" },
  stars: { color: "#E59B2E", fontSize: 16, fontWeight: "900" }
});
