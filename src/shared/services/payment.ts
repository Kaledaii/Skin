import { premiumPlans } from "../monetization";
import { PaymentProvider, PaymentRequest, SubscriptionInfo, SubscriptionPlanId } from "../types";

export type ManualPaymentInput = {
  userId: string;
  provider: PaymentProvider;
  plan: Exclude<SubscriptionPlanId, "beta">;
  transactionId: string;
  payerName: string;
  payerPhone: string;
  screenshotUri: string;
  screenshotDownloadUrl?: string;
};

export type PaymentSubmissionResult = {
  ok: boolean;
  request?: PaymentRequest;
  message: string;
};

export function createManualPaymentRequest(input: ManualPaymentInput): PaymentSubmissionResult {
  const cleanTransaction = input.transactionId.trim();
  const cleanName = input.payerName.trim();
  const cleanPhone = input.payerPhone.trim();
  if (!cleanTransaction) return { ok: false, message: "Transaction ID is required." };
  if (!cleanName) return { ok: false, message: "Payer name is required." };
  if (!cleanPhone) return { ok: false, message: "Payer phone is required." };
  if (!input.screenshotUri) return { ok: false, message: "Payment screenshot is required." };

  const planInfo = premiumPlans[input.plan];
  const now = new Date().toISOString();
  return {
    ok: true,
    message: "Payment submitted for review. Premium unlocks after confirmation.",
    request: {
      id: `pay_${input.provider}_${Date.now()}`,
      userId: input.userId,
      provider: input.provider,
      plan: input.plan,
      amount: planInfo.amount,
      transactionId: cleanTransaction,
      payerName: cleanName,
      payerPhone: cleanPhone,
      screenshotUri: input.screenshotUri,
      screenshotDownloadUrl: input.screenshotDownloadUrl,
      status: "pending_review",
      createdAt: now
    }
  };
}

export function activateSubscriptionFromRequest(request: PaymentRequest): SubscriptionInfo {
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + (request.plan === "yearly" ? 12 : 1));
  return {
    status: "premium",
    tier: "premium",
    source: request.provider === "esewa" ? "manual_esewa" : "manual_khalti",
    plan: request.plan,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    providerTransactionId: request.transactionId,
    paymentState: "active",
    paymentRequestId: request.id
  };
}

export function isSubscriptionActive(subscription: SubscriptionInfo) {
  if (subscription.tier !== "premium") return false;
  if (!subscription.expiresAt) return subscription.status === "premium" || subscription.status === "trial";
  return new Date(subscription.expiresAt).getTime() > Date.now();
}
