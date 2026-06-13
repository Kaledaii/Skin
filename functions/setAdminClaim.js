#!/usr/bin/env node
/**
 * setAdminClaim.js
 * Usage:
 *  node setAdminClaim.js --uid <USER_UID> [--dry-run]
 *
 * The script sets the custom claim { admin: true } for the specified Firebase user UID.
 * It supports a dry-run mode which prints the intended action without calling Firebase.
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: false, uid: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--uid" || a === "-u") out.uid = args[i + 1], i++;
    else if (a.startsWith("--uid=")) out.uid = a.split("=")[1];
  }
  return out;
}

async function main() {
  const { dryRun, uid } = parseArgs();
  if (!uid) {
    console.error("Error: missing --uid <USER_UID>");
    process.exit(2);
  }

  const payload = { admin: true };
  if (dryRun) {
    console.log(`[dry-run] would set custom claims for uid='${uid}' to:`, payload);
    process.exit(0);
  }

  // Attempt to initialize firebase-admin using service account JSON or path
  const admin = require("firebase-admin");
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let credential;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(parsed);
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", String(err));
      process.exit(3);
    }
  } else if (serviceAccountPath) {
    try {
      const parsed = require(serviceAccountPath);
      credential = admin.credential.cert(parsed);
    } catch (err) {
      console.error("Failed to load service account from FIREBASE_SERVICE_ACCOUNT_PATH:", String(err));
      process.exit(3);
    }
  } else {
    console.error("No service account provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.");
    process.exit(3);
  }

  try {
    admin.initializeApp({ credential });
    console.log("firebase-admin initialized.");
    await admin.auth().setCustomUserClaims(uid, payload);
    console.log(`Custom claim applied to uid=${uid}:`, payload);
    process.exit(0);
  } catch (err) {
    console.error("Error setting custom claim:", String(err));
    process.exit(4);
  }
}

main();
