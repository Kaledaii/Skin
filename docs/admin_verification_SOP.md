Admin Verification SOP

Purpose

This document describes the manual payment verification workflow, decision matrix, and canned messages for admin reviewers.

Overview

- New payment submissions are saved to `paymentRequests/{requestId}` with `status: pending_review`.
- Admins use the Admin Panel (app/admin.tsx) to review screenshots and metadata, then Approve/Reject/Request Info.
- Every admin action is recorded to `adminActions/{actionId}` for auditability.

Quick Steps for Reviewers

1. Open Admin Panel and filter to `Pending`.
2. Click a request to open details.
3. Run the checklist:
   - Verify `transactionId` format matches provider (Khalti/eSewa).
   - Confirm screenshot clearly shows txn id & amount (use zoom). If uncertain, request more info.
   - Verify `amount` matches plan price.
   - Check user history: account age, recent activity, previous rejections.
   - Search duplicates by txn id or screenshot reuse.
4. Decide:
   - Approve: sets `status=approved`, writes subscription to `users/{userId}` and logs admin action.
   - Reject: sets `status=rejected`, include `reviewNote`, logs action and optionally send rejection message.
   - Request Info: leave `status=pending_review` and send templated request message.

Decision Matrix (examples)

- Accept if:
  - txnId matches provider pattern AND screenshot clearly shows txn id + amount AND user account is not new (<24h) with no flags.
- Reject if:
  - txnId invalid OR screenshot mismatch OR duplicate screenshot previously used by another user.
- Escalate to super-admin if:
  - amount > 2x expected OR account age < 24h AND suspicious behavior OR multiple flags.

Admin Checklist (copy into UI)

- [ ] Transaction ID pattern matched
- [ ] Screenshot shows txn ID
- [ ] Screenshot shows amount
- [ ] Amount matches plan
- [ ] Account age reasonable (>24h)
- [ ] No duplicate screenshot found
- [ ] No prior fraud flags

Canned Messages (copy to reply templates)

- Request more info
Subject: Payment verification - more info needed
Body:
Hi {name},

Thanks for submitting your payment. We couldn't clearly verify the transaction in the screenshot. Could you please send a clearer image showing the transaction ID and amount, or share the transaction ID in text? We'll review quickly once we have that.

Thanks,
Team

- Approved
Subject: Payment verified - premium activated
Body:
Hi {name},

Thanks — we've verified your payment (Txn: {txnId}). Your premium subscription is now active until {expiryDate}. Enjoy the premium features!

Regards,
Team

- Rejected
Subject: Payment could not be verified
Body:
Hi {name},

We couldn't verify the payment (Txn: {txnId}). Reason: {reason}. If you believe this is an error, please reply with a clearer screenshot or transaction confirmation from your payment provider.

Regards,
Team

Escalation rules

- If flagged as fraud or ambiguous AND amount > Rs 1000, escalate to `super-admin` for 2nd review.
- If multiple rejections for the same user, follow up by temporarily blocking new submissions pending investigation.

Data Retention & Privacy

- Keep screenshots for a maximum of 90 days.
- After 90 days, screenshots are purged and a minimal redacted record is kept with `requestId`, `status`, and `decision`.
- Strip EXIF metadata from screenshots on upload.

Audit & Metrics

- Track average time from `pending_review` → final decision by admin.
- Track false-positive rate: count of rejections later overturned.
- Track suspicious patterns: duplicate txn IDs, repeated screenshots, new accounts making high-value submissions.

Appendix: Firestore schema

- `paymentRequests/{id}`: stores payment submission payload and status.
- `adminActions/{id}`: { id, actionType, requestId, adminId, payload, createdAt }

Contact

- Product owner: {your name/email}
- Lead admin: {admin contact}

