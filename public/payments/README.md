Payment QR files for web
========================

Drop the official wallet QR images here with these exact names:

- `esewa-qr.png`
- `khalti-qr.png`

The web paywall will try these local paths automatically:

- `/payments/esewa-qr.png`
- `/payments/khalti-qr.png`

For mobile builds, prefer hosted URLs through `.env`:

- `EXPO_PUBLIC_ESEWA_QR_URL`
- `EXPO_PUBLIC_KHALTI_QR_URL`
