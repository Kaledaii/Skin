import { premiumPlans } from "../monetization";
import { PaymentProvider, PaymentState, SubscriptionInfo, SubscriptionPlanId } from "../types";

export type CheckoutRequest = {
  plan: SubscriptionPlanId;
  provider: PaymentProvider;
  userId?: string;
};

export type CheckoutSession = {
  id: string;
  plan: SubscriptionPlanId;
  provider: PaymentProvider;
  amount: number;
  currency: "NPR";
  state: PaymentState;
  redirectUrl: string;
  sandbox: boolean;
};

export type PaymentVerification = {
  ok: boolean;
  state: PaymentState;
  subscription?: SubscriptionInfo;
  message: string;
};

const sandboxMode = process.env.EXPO_PUBLIC_PAYMENT_MODE !== "production";

export async function createCheckout({ plan, provider, userId = "local-demo-user" }: CheckoutRequest): Promise<CheckoutSession> {
  const planInfo = premiumPlans[plan];
  const sessionId = `prabha_${provider}_${plan}_${Date.now()}`;
  const encoded = encodeURIComponent(JSON.stringify({ sessionId, plan, provider, userId, amount: planInfo.amount }));
  return {
    id: sessionId,
    plan,
    provider,
    amount: planInfo.amount,
    currency: "NPR",
    state: "pending",
    redirectUrl: sandboxMode ? `prabha://payment/sandbox?payload=${encoded}` : productionPaymentUrl(provider, encoded),
    sandbox: sandboxMode
  };
}

export async function verifyPayment(transactionId: string, provider: PaymentProvider, plan: SubscriptionPlanId): Promise<PaymentVerification> {
  const cleanId = transactionId.trim();
  if (!cleanId) {
    return { ok: false, state: "failed", message: "Transaction ID is required for verification." };
  }

  if (sandboxMode) {
    if (!cleanId.toUpperCase().startsWith("SANDBOX")) {
      return { ok: false, state: "failed", message: "Sandbox mode only accepts transaction IDs starting with SANDBOX." };
    }
    return {
      ok: true,
      state: "active",
      subscription: activateSubscription("local-demo-user", plan, provider, cleanId),
      message: `${provider} sandbox verification accepted. Replace with server verification before launch.`
    };
  }

  return {
    ok: false,
    state: "failed",
    message: "Production verification must happen on a secure backend with Khalti/eSewa merchant credentials."
  };
}

export function activateSubscription(userId: string, plan: SubscriptionPlanId, source: PaymentProvider | "beta", transactionId?: string): SubscriptionInfo {
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + (plan === "yearly" ? 12 : 1));
  return {
    status: plan === "beta" ? "trial" : "premium",
    tier: "premium",
    source,
    plan,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    providerTransactionId: transactionId ?? `${source}-${userId}-${now.getTime()}`,
    paymentState: "active"
  };
}

function productionPaymentUrl(provider: PaymentProvider, payload: string) {
  if (provider === "khalti") return `https://pay.khalti.com/?prabha_payload=${payload}`;
  return `https://esewa.com.np/?prabha_payload=${payload}`;
}
