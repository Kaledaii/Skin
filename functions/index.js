/**
 * Firebase Cloud Functions for admin tasks:
 * - `purgeOldScreenshots`: scheduled daily job to delete screenshots older than retentionDays
 * - `stripImageMetadataOnFinalize`: storage trigger to re-encode images without EXIF metadata
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize Sentry if configured
let Sentry;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    console.log('Sentry initialized in functions');
  } catch (e) {
    console.warn('Sentry init failed in functions', e);
    Sentry = null;
  }
}
const os = require("os");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

admin.initializeApp();
const bucket = admin.storage().bucket();

const RETENTION_DAYS = Number(process.env.PAYMENT_SCREENSHOT_RETENTION_DAYS || 90);

exports.purgeOldScreenshots = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  try {
    const [files] = await bucket.getFiles({ prefix: "payment-screenshots/" });
    let deleted = 0;
    for (const file of files) {
      const metadata = (await file.getMetadata())[0];
      const timeCreated = new Date(metadata.timeCreated).getTime();
      if (timeCreated < cutoff) {
        await file.delete();
        deleted++;
      }
    }
    console.log(`purgeOldScreenshots: deleted ${deleted} files older than ${RETENTION_DAYS} days`);
    return { ok: true, deleted };
  } catch (err) {
    console.error("purgeOldScreenshots error", err);
    if (Sentry) Sentry.captureException(err);
    return { ok: false, error: String(err) };
  }
});

// When an image is uploaded, re-encode it to strip metadata.
exports.stripImageMetadataOnFinalize = functions.storage.object().onFinalize(async (object) => {
  const contentType = object.contentType || "";
  if (!contentType.startsWith("image/")) return null;
  const filePath = object.name; // e.g., payment-screenshots/{uid}/{requestId}.jpg
  if (!filePath || !filePath.startsWith("payment-screenshots/")) return null;

  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
  const tempLocalDir = path.dirname(tempFilePath);
  if (!fs.existsSync(tempLocalDir)) fs.mkdirSync(tempLocalDir, { recursive: true });

  const file = bucket.file(filePath);
  try {
    await file.download({ destination: tempFilePath });
    // Re-encode with sharp without metadata
    const processed = await sharp(tempFilePath).jpeg({ quality: 85 }).toBuffer();
    await file.save(processed, { contentType: contentType, metadata: { firebaseStorageDownloadTokens: object.metadata?.firebaseStorageDownloadTokens ?? undefined } });
    fs.unlinkSync(tempFilePath);
    console.log(`stripImageMetadataOnFinalize: processed ${filePath}`);
    return { ok: true };
  } catch (err) {
    console.error("stripImageMetadataOnFinalize error", err);
    if (Sentry) Sentry.captureException(err);
    try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {};
    return { ok: false, error: String(err) };
  }
});

// Lightweight admin HTTP helpers (manual deploy only)
const express = require('express');
const app = express();
app.use(express.json());

async function verifyAdminReq(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Missing auth token' });
    const idToken = auth.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded || !decoded.admin) return res.status(403).json({ ok: false, error: 'Admin claims required' });
    req.adminUid = decoded.uid;
    next();
  } catch (err) {
    if (Sentry) Sentry.captureException(err);
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
}

app.get('/admin/listRequests', verifyAdminReq, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('paymentRequests').orderBy('createdAt', 'desc').limit(200).get();
    const requests = snapshot.docs.map(d => d.data());
    res.json({ ok: true, requests });
  } catch (err) {
    if (Sentry) Sentry.captureException(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/admin/exportCsv', verifyAdminReq, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('paymentRequests').orderBy('createdAt', 'desc').get();
    const rows = [];
    snapshot.docs.forEach(d => {
      const p = d.data();
      rows.push([p.id, p.userId, p.userEmail || '', p.provider, p.transactionId || '', p.amount || '', p.status || '', p.createdAt || ''].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    });
    const csv = ['id,userId,userEmail,provider,transactionId,amount,status,createdAt', ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payment_requests.csv"');
    res.send(csv);
  } catch (err) {
    if (Sentry) Sentry.captureException(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/admin/approve', verifyAdminReq, async (req, res) => {
  try {
    const { requestId, note } = req.body;
    if (!requestId) return res.status(400).json({ ok: false, error: 'requestId required' });
    const ref = admin.firestore().collection('paymentRequests').doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'not found' });
    const reqData = snap.data();
    const reviewedAt = new Date().toISOString();
    await ref.update({ status: 'approved', reviewedAt, reviewNote: note || 'Approved via admin API' });
    // grant subscription for one month
    if (reqData.userId) {
      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + 1);
      const subscription = {
        status: 'premium',
        tier: 'premium',
        source: reqData.provider === 'esewa' ? 'manual_esewa' : 'manual_khalti',
        plan: reqData.plan || 'monthly',
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        providerTransactionId: reqData.transactionId,
        paymentState: 'active',
        paymentRequestId: requestId
      };
      await admin.firestore().collection('users').doc(reqData.userId).set({ subscription, paymentState: 'active', lastPaymentRequestId: requestId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    // log admin action
    const actionId = `admin_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await admin.firestore().collection('adminActions').doc(actionId).set({ id: actionId, actionType: 'approve', requestId, adminId: req.adminUid, payload: { note }, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (err) {
    if (Sentry) Sentry.captureException(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

exports.adminApi = functions.https.onRequest(app);

