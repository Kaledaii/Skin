# Prabha Skincare 60-Day Traction Launch Playbook

## Positioning

Prabha Skincare is a Nepal-first smart skincare app made by a Nepali student with AI-assisted development. It gives routine guidance for Nepal's weather, water, food habits, festivals, budgets, and daily lifestyle.

Core promise:

> Not random skincare tips. A Nepal-aware daily routine that adapts to your skin, lifestyle, water source, season, and budget.

Medical-safe wording:

- Use: guidance, routine support, education, matched concern, recommended routine.
- Avoid: diagnosis, prescription, treatment, cure.

## Expo Beta Limits

The Expo Free tier is enough for controlled beta testing, but not a permanent public launch channel.

- Free EAS includes limited Android/iOS builds and low-priority queue.
- Treat the Expo APK link as beta distribution, not final app-store distribution.
- Rebuild only when there is a meaningful change because each EAS cloud build counts.
- For wide public launch, use Google Play closed testing or production once the Play Console fee is worth it.

Current Android beta link:

https://expo.dev/accounts/kale_dai/projects/prabha-skincare/builds/0af71b88-4815-48d7-b6c8-7c7aa2545ca3

## Phase 1: Beta Proof, Days 1-14

Goal: get 50-150 testers and prove the app works on real phones.

Tester asks:

1. Install the APK.
2. Complete onboarding quiz.
3. Use the Today routine for 3 days.
4. Submit a review from Settings.
5. Send screenshots if anything breaks or feels confusing.

Track manually:

- APK link clicks or install attempts
- successful installs
- Android version and phone model when install fails
- onboarding completions
- app reviews and star ratings
- premium requests
- top 3 complaints
- top 3 loved features

Fix only launch blockers:

- payment/review not visible in admin
- Firebase rules/admin access issues
- app crash
- impossible install
- confusing onboarding
- screens that look broken on common Android phones

## Phase 2: Organic Story, Weeks 2-4

Goal: make Prabha feel like a local innovation story, not just another app promotion.

Short video topics:

1. Nepal ko water le skin ma ke garna sakcha?
2. Kathmandu hard water skincare routine.
3. Dashain/Tihar glow prep without expensive products.
4. Junk food and acne tracker.
5. Nepali student made an AI-assisted skincare app.
6. Before buying sunscreen in Nepal, check this.
7. Terai heat and sweat skincare tips.
8. Monsoon humidity and fungal bumps.
9. Exam stress and late-night skincare.
10. Budget routine under Rs. 500.
11. Why oily skin still needs moisturizer.
12. App demo: quiz to routine in 30 seconds.

Posting rhythm:

- 1 demo video per week.
- 2-3 educational reels per week.
- 1 founder/story post per week.
- repost tester reviews/screenshots with permission.

## Phase 3: Brand And Investor Outreach, Days 30-60

Start serious outreach after these minimum signals:

- 300-500 installs, clicks, or serious beta signups
- 50+ completed reviews
- 20+ strong testimonials or screenshots
- 5+ premium/payment attempts
- clear top 3 user problems
- visible retention signal from routine completion or repeat usage

Brand targets:

- local pharmacies
- Daraz sellers
- sunscreen/moisturizer importers
- dermatologist clinics
- beauty stores in Kathmandu, New Road, Bhatbhateni ecosystem
- campus beauty communities

Low-risk offers:

- verified product listing
- sponsored product card with clear label
- discount code for beta users
- expert-reviewed article
- clinic referral trial
- co-branded festival skincare guide

## RONB / Large Page Outreach Timing

Do not approach large pages too early. First prepare:

- clean 30-second app demo video
- 3 polished screenshots
- founder story in 5 lines
- tester count
- review count and average rating
- one honest problem you solved for Nepali users

Pitch angle:

> A Nepali student built a smart skincare app with AI-assisted development, focused on Nepal-specific skin issues like hard water, monsoon humidity, dust, heat, food habits, and budget-friendly routines.

Ask for story coverage, not direct advertising:

> We are collecting beta testers and feedback before launch. If this feels like a useful student innovation story, we would love help reaching Nepali youth.

## Product Readiness Checklist

Must-have before bigger promotion:

- Firebase admin panel shows payment requests and reviews.
- Firestore rules are deployed.
- Admin account works without local override.
- APK install instructions mention Play Protect.
- App disclaimer says guidance only, not medical diagnosis.
- Settings review form works.
- No secrets or proprietary database files are public in GitHub.

Nice-to-have before large-page promotion:

- basic landing page or strong README landing section
- 30-second demo video
- install FAQ
- privacy FAQ
- founder story post
- Google Play closed testing if budget allows

## Success Targets

Day 14:

- 50 testers
- 20 reviews
- 10 bug/feedback reports
- 5 repeat users

Day 30:

- 150-300 testers
- 50 reviews
- 10+ testimonial screenshots
- 3 potential brand conversations

Day 60:

- 300-500 serious users or install attempts
- 20+ strong testimonials
- 5+ partnership leads
- decision on Google Play launch fee
