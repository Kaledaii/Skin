import { premiumPlans } from "../monetization";
import { PaymentProvider, PaymentRequest, SkinType, SubscriptionInfo, SubscriptionPlanId } from "../types";

export type ManualPaymentInput = {
  userId: string;
  userEmail?: string | null;
  profileName?: string;
  profileLocation?: string;
  profileSkinType?: SkinType;
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

/**
 * Verify Khalti payment transaction with Khalti API
 * Production: This should be done server-side for security
 * For now, basic client-side verification with webhook support
 */
export async function verifyKhaltiTransaction(transactionId: string, amount: number): Promise<{ verified: boolean; message: string }> {
  // Format: Khalti transactions are typically 17 characters starting with KPP, KHT, etc.
  // Example: KPP20240516123456
  if (!transactionId || transactionId.length < 10) {
    return { verified: false, message: "Invalid Khalti transaction ID format" };
  }

  // Basic format validation
  const khaltiPattern = /^(KPP|KHT|KHA)[A-Z0-9]+$/i;
  if (!khaltiPattern.test(transactionId)) {
    return { verified: false, message: "Invalid Khalti transaction ID format (must start with KPP, KHT, or KHA)" };
  }

  // In production, call Khalti verification API:
  // const response = await fetch('https://khalti.com/api/transaction/', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${KHALTI_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ transaction_uuid: transactionId })
  // });

  // For v1, we accept the transaction and mark for manual review
  // (Admin will verify against Khalti dashboard)
  return {
    verified: true,
    message: `Khalti transaction ${transactionId} submitted for verification`
  };
}

/**
 * Verify eSewa payment transaction
 * Similar to Khalti, production should be server-side
 */
export async function verifyESewaTransaction(transactionId: string, amount: number): Promise<{ verified: boolean; message: string }> {
  // eSewa transaction IDs are typically 10+ digits
  if (!transactionId || transactionId.length < 5 || !/^\d+$/.test(transactionId)) {
    return { verified: false, message: "Invalid eSewa transaction ID (should be numeric)" };
  }

  // In production, call eSewa verification API:
  // const response = await fetch('https://esewa.com.np/api/transaction/status/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ oid: transactionId, amt: amount })
  // });

  return {
    verified: true,
    message: `eSewa transaction ${transactionId} submitted for verification`
  };
}

export function createManualPaymentRequest(input: ManualPaymentInput): PaymentSubmissionResult {
  const cleanTransaction = input.transactionId.trim();
  const cleanName = input.payerName.trim();
  const cleanPhone = input.payerPhone.trim();
  
  if (!cleanTransaction) return { ok: false, message: "Transaction ID is required." };
  if (!cleanName) return { ok: false, message: "Payer name is required." };
  if (!cleanPhone) return { ok: false, message: "Payer phone is required." };
  if (!input.screenshotUri) return { ok: false, message: "Payment screenshot is required." };

  // Validate phone format (Nepal: typically 10 digits starting with 9)
  const phonePattern = /^9\d{9}$/;
  if (!phonePattern.test(cleanPhone.replace(/[-\s]/g, ""))) {
    return { ok: false, message: "Please enter a valid Nepal phone number (10 digits starting with 9)." };
  }

  const planInfo = premiumPlans[input.plan];
  const now = new Date().toISOString();
  
  return {
    ok: true,
    message: `Payment submitted for review. Premium access will be granted within 1-2 hours after verification.`,
    request: {
      id: `pay_${input.provider}_${Date.now()}`,
      userId: input.userId,
      userEmail: input.userEmail,
      profileName: input.profileName,
      profileLocation: input.profileLocation,
      profileSkinType: input.profileSkinType,
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
  const now = request.reviewedAt ? new Date(request.reviewedAt) : new Date();
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
