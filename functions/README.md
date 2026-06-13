Functions README

This folder contains lightweight Firebase Cloud Functions to support admin workflows:

1. purgeOldScreenshots
   - Scheduled daily job that deletes files under `payment-screenshots/` older than `PAYMENT_SCREENSHOT_RETENTION_DAYS` (default 90).
   - Configure retention days via environment variable in Firebase project settings.

2. stripImageMetadataOnFinalize
   - Triggered when any file is uploaded to Cloud Storage. If the file is under `payment-screenshots/`, it is downloaded, re-encoded without EXIF metadata using `sharp`, and uploaded back to replace the original.

Deploy

From the `functions` directory:

```bash
npm install
# ensure FIREBASE_PROJECT is set or use firebase login
npx firebase deploy --only functions:purgeOldScreenshots,functions:stripImageMetadataOnFinalize
```

Notes

- `sharp` requires a Node 18 runtime. Confirm in `package.json`.
- Ensure the Cloud Functions service account has Storage Admin permissions.
- Consider running the purge job in the project emulator for testing.

Admin claim helper

To assign the `admin` custom claim to a user (so they can access the admin UI), run the CLI helper.

1) Dry-run:

```bash
cd functions
node setAdminClaim.js --dry-run --uid <USER_UID>
```

2) Real run (requires a service account):

Set environment variable `FIREBASE_SERVICE_ACCOUNT_PATH` to the path of your service account JSON file, or set `FIREBASE_SERVICE_ACCOUNT_JSON` to the JSON contents.

```bash
export FIREBASE_SERVICE_ACCOUNT_PATH=~/keys/service-account.json
node setAdminClaim.js --uid <USER_UID>
```

Or use the `npm` script:

```bash
npm run set-admin-claim -- --uid <USER_UID>
```

