# Prabha Weather Push Functions Scaffold

This is the production path for weather alerts when the app is closed or killed. The app now supports local reminders and stores Expo push tokens in Firebase; a deployed backend can use those tokens to send alerts.

## Collections

- `users/{uid}`: profile, subscription, notification preferences, optional `expoPushToken`.
- `pushTokens/{uid}`: `{ uid, token, updatedAt }`.
- `weatherAlertLogs/{uid}_{date}_{alert}`: dedupe record so users do not get duplicate rain/heat/wind alerts.

## Cloud Function Shape

1. Scheduled function runs every morning and late afternoon Nepal time.
2. Load users with notification preferences enabled.
3. Resolve location from profile or stored coordinates.
4. Fetch Open-Meteo weather/AQI.
5. Trigger alerts:
   - Rain probability `>=45%`
   - UV `>=6`, strong UV `>=8`
   - Feels-like heat `>=32C`, extreme heat `>=38C`
   - Wind gusts `>=35 km/h`
   - AQI `>100`
6. Send Expo push message to the stored token.
7. Write a dedupe log.

## Expo Push Payload

```json
{
  "to": "ExponentPushToken[...]",
  "title": "Strong UV warning",
  "body": "SPF 50, hat/umbrella, and reapply if outdoors. Marks darken fast in high UV.",
  "data": {
    "url": "/(tabs)/home",
    "kind": "weather_alert"
  }
}
```

## Security Note

Only trusted Firebase Functions should write review/admin subscription changes or send server-side weather pushes. Client-side admin mode is beta-only.
