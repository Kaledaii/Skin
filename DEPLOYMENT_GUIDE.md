# 🛠️ Deployment & Troubleshooting Guide

## Quick Start Commands

```bash
# Install dependencies
npm install

# Development server
npm start

# Build for web
expo export --platform web

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Run tests (if configured)
npm test

# Lint & format
npm run lint
npm run format
```

---

## Environment Setup

### Firebase Configuration
Create `.env.local` (or set in EAS secrets):
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Khalti/eSewa Integration (v1.1)
```bash
npm install @khalti/checkout-web
npm install esewa-pay
```

Then update `src/shared/services/payment.ts` to use live APIs.

---

## Common Issues & Solutions

### Issue: App crashes on launch
**Solution**: 
- Check Firebase config is set
- Verify AsyncStorage permissions granted
- Check console for specific error
- Look at ErrorBoundary.tsx for fallback rendering

### Issue: Habit score always 0
**Solution**: 
- Verify tracking.ts minimum 10-point logic is in place
- Check if user has completed any routine steps
- Confirm checkIn data is loading

### Issue: Payment transaction rejected
**Solution**:
- Validate transaction ID format (Khalti: KPP prefix, eSewa: numeric)
- Check phone number format (Nepal: 10 digits starting with 9)
- Verify screenshot uploaded to Firebase Storage
- Check admin console for payment request approval

### Issue: Screens not rendering after error
**Solution**:
- ErrorBoundary should show "Try Again" button
- Click button to retry render
- Check console for specific component error
- If persists, check for data loading issues

### Issue: Slow performance on low-end devices
**Solution**:
- Reduce product list pagination (currently 112 items all at once)
- Disable animations in reduced-motion mode (already done)
- Optimize images for mobile
- Use React DevTools profiler to find bottlenecks

### Issue: Firebase sync not working
**Solution**:
- Check network connection
- Verify Firebase credentials in console
- Look for 5-second sync debounce delay
- Check AsyncStorage is persisting locally as fallback
- Verify Firestore rules allow user writes

### Issue: Onboarding won't submit
**Solution**:
- Check all 8 validation fields:
  1. Name (non-empty)
  2. Age (non-empty)
  3. Age Group (dropdown selected)
  4. Symptoms or Primary Concerns (at least 1)
  5. Diet Pattern (selected)
  6. Water Source (selected)
  7. Sunscreen Question (answered)
  8. Consent (checkbox ticked)
- See app/onboarding.tsx for validation logic

---

## Firebase Console Checklist

Before production launch:
- [ ] **Authentication**: Enable Anonymous Sign-In
- [ ] **Firestore**: Create collections `users`, `payments`, `questions`
- [ ] **Storage**: Create bucket for payment screenshots
- [ ] **Security Rules**: Verify user-based isolation
  ```
  match /users/{document=**} {
    allow read, write: if request.auth.uid == document;
  }
  ```
- [ ] **Backups**: Enable automated backups
- [ ] **Monitoring**: Set up Crashlytics alerts

---

## Deployment Checklist

### Pre-Deployment (24 hours before)
- [ ] All 10 test categories complete ✓
- [ ] No console warnings or errors
- [ ] Firebase production config verified
- [ ] Payment flow tested end-to-end
- [ ] Changelog prepared for app store

### Deployment (Production)
1. **Build**:
   ```bash
   eas build --platform ios --auto-submit
   eas build --platform android --auto-submit
   ```

2. **Review on App Store/Play Store**:
   - Category: Health & Fitness
   - Privacy policy required
   - Terms of service required
   - Screenshot tour (3-5 screenshots)

3. **Monitor**:
   - Watch crash reports (Crashlytics)
   - Monitor Firebase quota usage
   - Track payment flow
   - Check user feedback

### Post-Launch (First 48 hours)
- [ ] Monitor Crashlytics dashboard
- [ ] Check Firebase analytics
- [ ] Respond to app store reviews
- [ ] Have support team ready
- [ ] Be prepared to push hotfix if needed

---

## Manual Admin Operations

### Approve Payment Request
1. Open Firebase Console → Firestore
2. Navigate to `payments` collection
3. Find request with `status: "pending_review"`
4. Update:
   ```json
   {
     "status": "approved",
     "approvedAt": "2026-05-17T...",
     "approvedBy": "admin@prabha.com"
   }
   ```
5. Update user's subscription:
   ```json
   {
     "tier": "premium",
     "subscription": {
       "plan": "monthly_99",
       "activatedAt": "2026-05-17T...",
       "source": "manual_payment"
     }
   }
   ```

### Respond to Expert Question
1. Open Firebase Console → Firestore
2. Navigate to `questions` collection
3. Find question with `answered: false`
4. Add response:
   ```json
   {
     "response": "Expert answer here...",
     "respondedAt": "2026-05-17T...",
     "respondedBy": "expert@prabha.com",
     "answered": true
   }
   ```

### Debug User Data
1. Firebase Console → Authentication
2. Find user by UID
3. Firestore → `users/{uid}`
4. Review profile, subscription, dailyCheckIns

---

## Monitoring & Alerts

### Key Metrics to Watch
- App crashes (target: < 0.1%)
- Firebase quota usage (daily limits)
- Payment success rate (target: > 95%)
- User onboarding completion (target: > 70%)
- DAU/MAU growth
- Routine completion rate

### Alert Thresholds
- Crash rate > 0.5% → CRITICAL
- Firebase writes > 80% quota → WARNING
- Payment failures > 5% in 1 hour → CRITICAL
- Onboarding drop-off > 50% → WARNING

---

## Rollback Procedure

If critical issue found after launch:

1. **Immediate** (within 30 mins):
   - Publish app store update with hotfix
   - Monitor crash reports

2. **If not resolved**:
   - Disable payment processing (manual only)
   - Disable Firebase sync (local-only mode)
   - Push emergency update

3. **Recovery**:
   - Deploy fixed version
   - Gradually roll out (10% → 50% → 100%)
   - Monitor for 1 hour before full release

---

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev/docs
- **Khalti Integration**: https://docs.khalti.com
- **eSewa Integration**: https://esewa.com.np/developers

---

## Contact & Escalation

**Product Issues**: Refer to PRODUCTION_READY_CHECKLIST.md  
**Firebase Issues**: Check Firebase Console logs  
**Payment Issues**: Check payment.ts validation logic  
**UI Crashes**: Check ErrorBoundary.tsx error recovery  

---

**Last Updated**: 2026-05-17  
**Next Review**: 2026-05-20 (post-launch)
