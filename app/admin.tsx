import { Feather } from "@expo/vector-icons";
import type { ComponentProps, PropsWithChildren } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from "react-native";
import { budgetTiers, skinTypes, useApp } from "@/shared/AppContext";
import { Body, Button, H1, H2, Pill, Screen, SectionLabel, Segment } from "@/shared/components";
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
type AdminTone = "primary" | "secondary" | "accent" | "danger" | "success";

const adminLogo = require("../assets/brand/prabha-icon-1024.png");

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

const adminFx = {
  bg: "#100A0D",
  bg2: "#1B0F17",
  panel: "rgba(34, 20, 28, 0.92)",
  panel2: "rgba(49, 27, 40, 0.86)",
  line: "rgba(255, 213, 169, 0.18)",
  lineStrong: "rgba(255, 213, 169, 0.42)",
  text: "#FFF7F0",
  muted: "#D9B8AD",
  gold: "#F4B95B",
  rose: "#FF6E96",
  cyan: "#67E8F9",
  green: "#78E08F",
  red: "#FF6B6B",
  violet: "#A78BFA"
};

export default function AdminDashboard() {
  const { themeMode, setThemeMode, paymentRequests, refreshPaymentRequests, approvePaymentRequest, rejectPaymentRequest, signInWithEmail } = useApp();
  const c = palettes.dark;
  const adminSidebar = getAdminSidebarPalette("dark");
  const [reducedMotion, setReducedMotion] = useState(false);
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
  const activeSection = sections.find((item) => item.id === section) ?? sections[0];

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
    if (themeMode !== "dark") setThemeMode("dark");
  }, [setThemeMode, themeMode]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => setReducedMotion(false));
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
      <Screen showQuickActions={false}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdminPanel variant="hero" style={styles.lockedPanel}>
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
          </AdminPanel>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen showQuickActions={false}>
      <View style={styles.adminStage}>
      <AdminAtmosphere reducedMotion={reducedMotion} />
      <View style={styles.shell}>
        <View style={[styles.sidebar, { backgroundColor: adminSidebar.bg, borderColor: adminSidebar.border }]}>
          <View style={styles.brandConsole}>
            <View style={styles.brandOrb}>
              <Image source={adminLogo} style={styles.brandLogoImage} resizeMode="cover" />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.sidebarTitle, { color: adminSidebar.title }]}>Prabha Admin</Text>
              <Text style={[styles.sidebarSubtitle, { color: adminSidebar.muted }]}>Founder Command Center</Text>
            </View>
          </View>
          <View style={styles.sidebarStatusStack}>
            <AdminStatusChip label={firebaseReady ? "Firebase live" : "Local mode"} tone={firebaseReady ? "success" : "accent"} />
            <AdminStatusChip label={lastCheckedAt ? `Synced ${lastCheckedAt}` : "Awaiting sync"} tone="primary" />
          </View>
          <View style={styles.navList}>
            {sections.map((item) => {
              const active = item.id === section;
              return (
                <Pressable key={item.id} onPress={() => setSection(item.id)} style={[styles.navItem, { backgroundColor: active ? adminSidebar.activeBg : "transparent" }]}>
                  {active ? <View style={styles.navActiveRail} /> : null}
                  <Feather name={item.icon} color={active ? adminSidebar.activeText : adminSidebar.text} size={18} />
                  <Text style={[styles.navText, { color: active ? adminSidebar.activeText : adminSidebar.text }]}>{item.label}</Text>
                  {active ? <Feather name="zap" color={adminFx.gold} size={14} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.sidebarFooter}>
            <Text style={styles.sidebarFooterText}>Private ops surface</Text>
            <Text style={styles.sidebarFooterMuted}>No screenshots or payment IDs in public portfolios.</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <AdminPanel variant="hero">
            <View style={styles.headerRow}>
            <View style={styles.heroIcon}>
              <Feather name={activeSection.icon} color={adminFx.gold} size={26} />
            </View>
            <View style={styles.flex}>
              <SectionLabel tone="accent">Founder console</SectionLabel>
              <H1>{activeSection.label}</H1>
              <Body muted>Payments, users, reviews, products, and growth proof in one cinematic control room.</Body>
            </View>
            <View style={styles.actionRow}>
              <AdminStatusChip label={firebaseReady ? "Firebase connected" : "Local mode"} tone={firebaseReady ? "success" : "accent"} />
              <AdminCommandButton label="Refresh console" icon="refresh-cw" onPress={refreshAll} />
            </View>
            </View>
          </AdminPanel>

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
      </View>
    </Screen>
  );
}

function OverviewSection({ metrics, status, lastCheckedAt }: { metrics: AdminMetrics; status: string | null; lastCheckedAt: string | null }) {
  const reviewLoad = metrics.pendingPayments + metrics.rejectedPayments + metrics.approvedPayments;
  return (
    <>
      <AdminHero
        eyebrow="Command snapshot"
        title={`${metrics.pendingPayments} payments need eyes`}
        body={status ?? "Review requests, premium access, products, and proof metrics are ready."}
        icon="activity"
        footer={`Last checked: ${lastCheckedAt ?? "not checked yet"}`}
      />
      <View style={styles.statsGrid}>
        <StatCard label="Total users" value={metrics.totalUsers} icon="users" tone="primary" />
        <StatCard label="Premium users" value={metrics.premiumUsers} icon="award" tone="secondary" />
        <StatCard label="Pending payments" value={metrics.pendingPayments} icon="clock" tone="accent" />
        <StatCard label="Active products" value={metrics.activeProducts} icon="package" tone="primary" />
        <StatCard label="Avg rating" value={metrics.averageRating} icon="star" tone="secondary" />
        <StatCard label="Draft products" value={metrics.draftProducts} icon="edit-3" tone="accent" />
      </View>
      <View style={styles.commandGrid}>
        <AdminPanel>
          <View style={styles.panelTitleRow}>
            <Feather name="radio" color={adminFx.cyan} size={20} />
            <H2>Needs attention</H2>
          </View>
          <CommandLine icon="clock" label="Pending payment reviews" value={String(metrics.pendingPayments)} tone={metrics.pendingPayments ? "accent" : "success"} />
          <CommandLine icon="star" label="Review signals" value={`${metrics.totalReviews} total`} tone="secondary" />
          <CommandLine icon="package" label="Product catalog ops" value={`${metrics.activeProducts} active`} tone="primary" />
        </AdminPanel>
        <AdminPanel>
          <View style={styles.panelTitleRow}>
            <Feather name="bar-chart-2" color={adminFx.gold} size={20} />
            <H2>Operating pulse</H2>
          </View>
          <MiniBar label="Premium conversion" value={metrics.totalUsers ? Math.round((metrics.premiumUsers / metrics.totalUsers) * 100) : 0} />
          <MiniBar label="Payment reviewed" value={reviewLoad ? Math.round(((metrics.approvedPayments + metrics.rejectedPayments) / reviewLoad) * 100) : 0} />
          <MiniBar label="Catalog active" value={metrics.activeProducts + metrics.draftProducts ? Math.round((metrics.activeProducts / (metrics.activeProducts + metrics.draftProducts)) * 100) : 0} />
        </AdminPanel>
      </View>
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
      {!props.visibleRequests.length ? <AdminPanel><H2>No requests</H2><Body muted>No payment requests match this filter.</Body></AdminPanel> : null}
    </>
  );
}

function UsersSection({ query, setQuery, users }: { query: string; setQuery: (value: string) => void; users: AdminUserSummary[] }) {
  return (
    <>
      <AdminSearch value={query} onChange={setQuery} placeholder="Search users by name, location, skin type" />
      <AdminPanel>
        <View style={styles.panelTitleRow}>
          <Feather name="users" color={adminFx.gold} size={20} />
          <H2>User command roster</H2>
        </View>
        <TableHeader columns={["User", "Skin", "Subscription", "Check-ins"]} />
        {users.map((user) => (
          <View key={user.id} style={styles.tableRow}>
            <TableCell title={user.name || "Unnamed"} subtitle={user.location || user.id} />
            <TableCell title={user.skinType || "unknown"} />
            <TableCell title={user.subscriptionTier || "free"} subtitle={user.subscriptionStatus} />
            <TableCell title={String(user.checkInCount)} subtitle={user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : undefined} />
          </View>
        ))}
      </AdminPanel>
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
    <AdminPanel>
      <SectionLabel tone="secondary">Portfolio proof</SectionLabel>
      <H2>Non-sensitive growth summary</H2>
      <View style={styles.proofGrid}>
        {proofLines.map((line, index) => (
          <View key={line} style={styles.proofTile}>
            <Text style={styles.proofIndex}>{String(index + 1).padStart(2, "0")}</Text>
            <Body>{line}</Body>
          </View>
        ))}
      </View>
      <Body muted>Use these aggregate numbers in your portfolio. Avoid sharing raw user phone, email, screenshots, or payment IDs publicly.</Body>
    </AdminPanel>
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
      <AdminPanel>
        <SectionLabel tone="accent">Manual product add</SectionLabel>
        <H2>Add earning product</H2>
        <Body muted>Short customer-facing fields first. Internal trust and fake-risk can stay in the data without dominating the shopper UI.</Body>
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
        <AdminCommandButton label="Save product" icon="save" onPress={onSave} />
      </AdminPanel>

      <AdminPanel>
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
          <AdminCommandButton label="Preview CSV" icon="eye" onPress={() => setCsvPreview(parseProductsCsv(csvText))} subtle />
          <AdminCommandButton label={`Import ${csvPreview.valid.length}`} icon="upload" onPress={onImport} subtle={!csvPreview.valid.length} />
        </View>
        {csvPreview.errors.map((error) => <Body key={error} muted>{error}</Body>)}
        {csvPreview.valid.length ? <AdminStatusChip label={`${csvPreview.valid.length} valid rows ready`} tone="success" /> : null}
        {csvPreview.valid.slice(0, 5).map((product) => <Body key={product.id}>{product.name} - {product.price}</Body>)}
      </AdminPanel>

      <AdminPanel>
        <H2>Admin products</H2>
        <TableHeader columns={["Product", "Status", "Price", "Signal"]} />
        {products.map((product) => (
          <View key={product.id} style={styles.tableRow}>
            <TableCell title={product.name} subtitle={product.category} />
            <TableCell title={product.status} subtitle={product.source} />
            <TableCell title={product.price} subtitle={`Trust ${product.trustScore}%`} />
            <View style={styles.tableActionCell}>
              <AdminStatusChip label={product.fakeRisk ? `Internal ${product.fakeRisk}` : "Internal ok"} tone={product.fakeRisk === "high" ? "danger" : product.fakeRisk === "low" ? "success" : "accent"} />
              <Button label="Archive" onPress={() => onArchive(product.id)} secondary />
            </View>
          </View>
        ))}
      </AdminPanel>
    </>
  );
}

function ReviewsSection({ reviews }: { reviews: AppReview[] }) {
  return (
    <AdminPanel>
      <H2>App reviews</H2>
      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewLine}>
          <Text style={styles.stars}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text>
          <Body>{review.experience}</Body>
          <Body muted>{review.profileName || "Anonymous"} - {new Date(review.createdAt).toLocaleString()}</Body>
        </View>
      ))}
      {!reviews.length ? <Body muted>No app reviews yet.</Body> : null}
    </AdminPanel>
  );
}

function SettingsSection({ adminAccess, lastCheckedAt }: { adminAccess: { allowed: boolean; uid: string | null; source?: string; error?: string }; lastCheckedAt: string | null }) {
  return (
    <AdminPanel variant="warning">
      <H2>Admin safety</H2>
      <Body>Access: {adminAccess.allowed ? "allowed" : "blocked"}</Body>
      <Body muted>UID: {adminAccess.uid ?? "none"}</Body>
      <Body muted>Source: {adminAccess.source ?? "local/config"}</Body>
      <Body muted>Last checked: {lastCheckedAt ?? "not checked yet"}</Body>
      <Body muted>Keep raw payment screenshots, phone numbers, and emails private. Share only aggregate metrics in portfolios.</Body>
    </AdminPanel>
  );
}

function PaymentReviewCard({ request, rejectNote, onRejectNote, onApprove, onReject }: { request: PaymentRequest; rejectNote: string; onRejectNote: (value: string) => void; onApprove: () => Promise<void>; onReject: () => Promise<void> }) {
  const { themeMode } = useApp();
  const c = palettes[themeMode];
  const screenshot = request.screenshotDownloadUrl ?? request.screenshotUri;
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditActions, setAuditActions] = useState<any[]>([]);
  return (
    <AdminPanel variant={request.status === "pending_review" ? "hero" : "default"}>
      <View style={styles.requestHeader}>
        <View style={styles.flex}>
          <AdminStatusChip label={request.status.replace("_", " ")} tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "accent"} />
          <H2>{request.profileName || request.payerName || "Unnamed user"}</H2>
          <Body muted>{request.userEmail || request.userId}</Body>
        </View>
        <View style={styles.amountBox}>
          <Text style={[styles.amount, { color: c.text }]}>Rs. {request.amount}</Text>
          <Text style={[styles.amountMeta, { color: c.muted }]}>{request.provider} - {request.plan}</Text>
        </View>
      </View>
      <AdminTimeline
        items={[
          { label: "Submitted", value: formatDate(request.createdAt), active: true },
          { label: "Proof", value: screenshot ? "Screenshot attached" : "Missing screenshot", active: Boolean(screenshot) },
          { label: "Decision", value: request.status === "pending_review" ? "Waiting" : request.status.replace("_", " "), active: request.status !== "pending_review" }
        ]}
      />
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
            <AdminCommandButton label="Approve premium" icon="check-circle" onPress={onApprove} />
            <AdminCommandButton label="Reject" icon="x-circle" onPress={onReject} subtle />
          </View>
        </>
      ) : <Body muted>Reviewed: {formatDate(request.reviewedAt)} - {request.reviewNote ?? "No note"}</Body>}
      <AdminCommandButton
        label={auditOpen ? "Hide audit" : "Show audit"}
        icon={auditOpen ? "chevron-up" : "activity"}
        onPress={async () => {
          if (!auditOpen) {
            const result = await listAdminActions(request.id);
            if (result.ok) setAuditActions(result.actions);
          }
          setAuditOpen((value) => !value);
        }}
        subtle
      />
      {auditOpen ? (
        <View style={styles.auditList}>
          {auditActions.length ? auditActions.map((action) => (
            <View key={action.id} style={styles.auditLine}>
              <Feather name="terminal" color={adminFx.cyan} size={14} />
              <Body muted>{action.actionType} - {action.adminId ?? "unknown"}</Body>
            </View>
          )) : <Body muted>No audit entries yet.</Body>}
        </View>
      ) : null}
    </AdminPanel>
  );
}

function AdminAtmosphere({ reducedMotion }: { reducedMotion: boolean }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, [glow, reducedMotion]);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] });
  const translateX = glow.interpolate({ inputRange: [0, 1], outputRange: [-24, 28] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.adminWash, styles.adminWashOne]} />
      <Animated.View style={[styles.adminWash, styles.adminWashTwo, { opacity, transform: [{ translateX }] }]} />
      <View style={styles.adminGridOverlay} />
    </View>
  );
}

function AdminPanel({ children, variant = "default", style }: PropsWithChildren<{ variant?: "default" | "hero" | "warning"; style?: ViewStyle }>) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    Animated.timing(pulse, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [pulse]);

  const borderColor = variant === "hero" ? adminFx.lineStrong : variant === "warning" ? "rgba(255,107,107,0.45)" : adminFx.line;
  const bg = variant === "hero" ? adminFx.panel2 : adminFx.panel;

  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.adminPanel,
            {
              backgroundColor: bg,
              borderColor: hovered ? adminFx.lineStrong : borderColor,
              opacity: pulse,
              transform: [{ translateY: hovered ? -2 : pressed ? 1 : 0 }, { scale: pressed ? 0.994 : 1 }]
            },
            style
          ]}
        >
          <View style={[styles.adminPanelEdge, { backgroundColor: variant === "warning" ? adminFx.red : variant === "hero" ? adminFx.gold : adminFx.rose }]} />
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}

function AdminHero({ eyebrow, title, body, footer, icon }: { eyebrow: string; title: string; body: string; footer: string; icon: ComponentProps<typeof Feather>["name"] }) {
  return (
    <AdminPanel variant="hero">
      <View style={styles.commandHero}>
        <View style={styles.heroIconLarge}>
          <Feather name={icon} color={adminFx.bg} size={30} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.adminEyebrow}>{eyebrow}</Text>
          <Text style={styles.commandHeroTitle}>{title}</Text>
          <Text style={styles.commandHeroBody}>{body}</Text>
        </View>
        <AdminStatusChip label={footer} tone="primary" />
      </View>
    </AdminPanel>
  );
}

function AdminStatusChip({ label, tone = "primary" }: { label: string; tone?: AdminTone }) {
  const color = adminToneColor(tone);
  return (
    <View style={[styles.statusChip, { borderColor: `${color}66`, backgroundColor: `${color}1F` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

function AdminCommandButton({ label, icon, onPress, subtle = false }: { label: string; icon: ComponentProps<typeof Feather>["name"]; onPress: () => void | Promise<void>; subtle?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.commandButton,
        {
          backgroundColor: subtle ? (hovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.055)") : adminFx.gold,
          borderColor: subtle ? adminFx.line : "rgba(255,255,255,0.18)",
          transform: [{ translateY: hovered ? -1 : pressed ? 1 : 0 }, { scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <Feather name={icon} color={subtle ? adminFx.gold : adminFx.bg} size={16} />
      <Text style={[styles.commandButtonText, { color: subtle ? adminFx.text : adminFx.bg }]}>{label}</Text>
    </Pressable>
  );
}

function AdminTimeline({ items }: { items: Array<{ label: string; value: string; active: boolean }> }) {
  return (
    <View style={styles.timeline}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: item.active ? adminFx.green : "rgba(255,255,255,0.24)" }]} />
          {index < items.length - 1 ? <View style={styles.timelineRail} /> : null}
          <Text style={styles.timelineLabel}>{item.label}</Text>
          <Text style={styles.timelineValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function CommandLine({ icon, label, value, tone }: { icon: ComponentProps<typeof Feather>["name"]; label: string; value: string; tone: AdminTone }) {
  const color = adminToneColor(tone);
  return (
    <View style={styles.commandLine}>
      <View style={[styles.commandLineIcon, { backgroundColor: `${color}22` }]}>
        <Feather name={icon} color={color} size={16} />
      </View>
      <Text style={styles.commandLineLabel}>{label}</Text>
      <Text style={[styles.commandLineValue, { color }]}>{value}</Text>
    </View>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return (
    <View style={styles.miniBarBlock}>
      <View style={styles.miniBarTop}>
        <Text style={styles.miniBarLabel}>{label}</Text>
        <Text style={styles.miniBarValue}>{value}%</Text>
      </View>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width }]} />
      </View>
    </View>
  );
}

function adminToneColor(tone: AdminTone) {
  if (tone === "secondary") return adminFx.cyan;
  if (tone === "accent") return adminFx.gold;
  if (tone === "danger") return adminFx.red;
  if (tone === "success") return adminFx.green;
  return adminFx.rose;
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ComponentProps<typeof Feather>["name"]; tone: "primary" | "secondary" | "accent" | "danger" }) {
  const color = adminToneColor(tone);
  return (
    <AdminPanel style={styles.statCard}>
      <Feather name={icon} color={color} size={20} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AdminPanel>
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
  adminStage: { flex: 1, margin: -spacing.md, backgroundColor: adminFx.bg, overflow: "hidden" },
  adminWash: { position: "absolute", width: 430, height: 430, borderRadius: 215, opacity: 0.22 },
  adminWashOne: { top: -150, right: -120, backgroundColor: adminFx.rose },
  adminWashTwo: { bottom: -170, left: "22%", backgroundColor: adminFx.gold },
  adminGridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.16, borderWidth: 1, borderColor: "rgba(255,255,255,0.035)" },
  shell: { flex: 1, flexDirection: "row" },
  sidebar: { width: 260, borderRightWidth: 1, padding: spacing.md, gap: spacing.md, shadowColor: "#000", shadowOpacity: 0.38, shadowRadius: 28, shadowOffset: { width: 8, height: 0 } },
  brandConsole: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  brandOrb: { width: 48, height: 48, borderRadius: 16, backgroundColor: adminFx.gold, alignItems: "center", justifyContent: "center", shadowColor: adminFx.gold, shadowOpacity: 0.48, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  brandLogoImage: { width: 42, height: 42, borderRadius: 13 },
  sidebarTitle: { fontSize: 22, lineHeight: 28, fontWeight: "900", fontFamily: "Georgia" },
  sidebarSubtitle: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  sidebarStatusStack: { gap: spacing.xs },
  navList: { gap: spacing.xs },
  navItem: { minHeight: 48, borderRadius: 10, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, overflow: "hidden" },
  navActiveRail: { width: 4, alignSelf: "stretch", borderRadius: 999, backgroundColor: adminFx.gold, shadowColor: adminFx.gold, shadowOpacity: 0.8, shadowRadius: 8 },
  navText: { fontSize: 14, fontWeight: "900" },
  sidebarFooter: { marginTop: "auto", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: spacing.sm, gap: 2 },
  sidebarFooterText: { color: adminFx.text, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  sidebarFooterMuted: { color: adminFx.muted, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, flexWrap: "wrap" },
  flex: { flex: 1, gap: spacing.xs },
  lockedPanel: { maxWidth: 760, alignSelf: "center", width: "100%" },
  heroIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(244,185,91,0.14)", borderWidth: 1, borderColor: "rgba(244,185,91,0.36)" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  authBox: { gap: spacing.sm, marginTop: spacing.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { flexGrow: 1, flexBasis: 150, minHeight: 126 },
  statValue: { color: adminFx.text, fontSize: 32, fontWeight: "900" },
  statLabel: { color: adminFx.muted, fontSize: 13, fontWeight: "800" },
  adminPanel: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.sm, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.32, shadowRadius: 22, shadowOffset: { width: 0, height: 14 } },
  adminPanelEdge: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, opacity: 0.86 },
  commandHero: { flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" },
  heroIconLarge: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: adminFx.gold, shadowColor: adminFx.gold, shadowOpacity: 0.42, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  adminEyebrow: { color: adminFx.gold, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  commandHeroTitle: { color: adminFx.text, fontSize: 30, lineHeight: 36, fontWeight: "900", fontFamily: Platform.select({ web: "Georgia, serif", default: undefined }) },
  commandHeroBody: { color: adminFx.muted, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  statusChip: { alignSelf: "flex-start", minHeight: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  commandButton: { minHeight: 44, borderRadius: 999, borderWidth: 1, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, shadowColor: adminFx.gold, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  commandButtonText: { fontSize: 14, fontWeight: "900" },
  commandGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  panelTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  commandLine: { minHeight: 48, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  commandLineIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  commandLineLabel: { flex: 1, color: adminFx.muted, fontSize: 14, fontWeight: "800" },
  commandLineValue: { fontSize: 15, fontWeight: "900" },
  miniBarBlock: { gap: spacing.xs },
  miniBarTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  miniBarLabel: { color: adminFx.muted, fontSize: 13, fontWeight: "800" },
  miniBarValue: { color: adminFx.text, fontSize: 13, fontWeight: "900" },
  miniBarTrack: { height: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)", overflow: "hidden" },
  miniBarFill: { height: 9, borderRadius: 999, backgroundColor: adminFx.gold },
  searchBox: { borderWidth: 1, borderRadius: 999, minHeight: 48, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderColor: adminFx.line, backgroundColor: "rgba(255,255,255,0.06)" },
  searchInput: { flex: 1, minHeight: 44, fontSize: 15, color: adminFx.text },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  requestHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  amountBox: { alignItems: "flex-end", gap: 2 },
  amount: { fontSize: 24, fontWeight: "900" },
  amountMeta: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  detail: { flexGrow: 1, flexBasis: 150, borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: 2 },
  detailLabel: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  timeline: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingVertical: spacing.xs },
  timelineItem: { minWidth: 130, flex: 1, gap: 2, position: "relative", paddingLeft: spacing.sm },
  timelineDot: { width: 10, height: 10, borderRadius: 5, position: "absolute", left: 0, top: 5 },
  timelineRail: { position: "absolute", left: 4, top: 18, bottom: -8, width: 1, backgroundColor: "rgba(255,255,255,0.14)" },
  timelineLabel: { color: adminFx.text, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  timelineValue: { color: adminFx.muted, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  screenshotBox: { borderWidth: 1, borderRadius: 8, padding: spacing.sm, gap: spacing.sm },
  screenshot: { width: "100%", height: 220, borderRadius: 8 },
  noteInput: { borderWidth: 1, borderRadius: 8, minHeight: 78, padding: spacing.sm, fontSize: 14, textAlignVertical: "top" },
  tableHeader: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
  tableHeaderText: { flex: 1, fontSize: 11, fontWeight: "900", textTransform: "uppercase", color: "#8A94A6" },
  tableRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(140,148,166,0.18)", paddingVertical: spacing.sm },
  tableCell: { flex: 1, minWidth: 0 },
  tableActionCell: { flex: 1, minWidth: 160, gap: spacing.xs },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  field: { flexGrow: 1, flexBasis: 220, gap: spacing.xs },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, fontSize: 15 },
  csvBox: { minHeight: 130, borderWidth: 1, borderColor: "#D4D8E1", borderRadius: 8, padding: spacing.sm, textAlignVertical: "top" },
  proofGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  proofTile: { flexGrow: 1, flexBasis: 220, borderWidth: 1, borderRadius: 10, borderColor: adminFx.line, backgroundColor: "rgba(255,255,255,0.055)", padding: spacing.sm, gap: spacing.xs },
  proofIndex: { color: adminFx.gold, fontSize: 12, fontWeight: "900" },
  auditList: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)", paddingTop: spacing.sm, gap: spacing.xs },
  auditLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  reviewLine: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(140,148,166,0.18)" },
  stars: { color: "#E59B2E", fontSize: 16, fontWeight: "900" }
});
