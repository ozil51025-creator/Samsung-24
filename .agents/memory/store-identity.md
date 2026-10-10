---
name: Rewards site scope
description: The user's business model direction and branding for this website.
---

For this project, the user wants the public-facing site name "samsung" for a Samsung gadget catalog, without showing the word Uganda in the site copy. The phone flow retains its existing +256 prefix and prices remain in UGX. Present it as an independent retailer, not as Samsung's official store. The user specified a UGX 5,000 welcome bonus credited immediately to every successful signup, including signups with unverified phone numbers. Other payout basis/terms and exact product models/stock remain unverified. They requested six member pages—Overview, Home, Products, Purchased, Referral, and Account—plus the bonus as withdrawable cash. The confirmed referral commission rates are 35%, 2%, and 1% for levels 1–3. A referred member's product purchase triggers the commission chain; the user described the basis as the "first deposit," so whether this means purchase value or a separate wallet deposit still needs clarification.

The user requested Samsung blue, dark neutrals, white, and translucent surfaces across every page.

**Why:** The user asked for Samsung colors and a transparent design throughout the platform.

**How to apply:** Use Samsung blue (#1428A0) with navy and white, and translucent glass-like surfaces consistently across public, auth, and member pages.

Every picture displayed in the site must depict Samsung products or Samsung-related imagery.

**Why:** The user explicitly said every picture inside the site must be for Samsung.

**How to apply:** Use provided or verified Samsung imagery for displayed photos. Do not use unrelated cars, athletes, or other non-Samsung product images.

For screenshot-led page work, the user wants the reference followed closely and does not want agent-invented options, copy, amounts, or terms. If screenshot content conflicts with an earlier confirmed project rule, ask before choosing which data to display.

**Why:** The user explicitly corrected the assistant for adding unprovided choices and asked for pages to match their screenshots exactly.

**How to apply:** Reproduce only the provided reference content and visual elements. Do not fill gaps with guesses; clarify direct conflicts such as currency or payment channels before changing them.

The user does not want an investment chart displayed in the site.

**Why:** The user asked to remove the investment chart from the site.

**How to apply:** Do not add an investment chart to a site page unless the user explicitly asks again.

**Why:** The user first chose the sales-rewards option and sale prices only, then corrected the catalog display after noticing their supplied daily/hourly figures were missing. Their requested values have not been supported by verified payout terms. They also requested member pages, a cash welcome bonus, real checkout, and multi-level referral bonuses. They corrected a preview that showed only three unlabeled icons instead of the five pages.

**How to apply:** Use "samsung" as the site name and keep the independent-retailer disclaimer visible; do not imply Samsung affiliation. Keep persistent mobile and desktop navigation labeled Overview, Home, Products, Purchased, Referral, and Account; do not reduce it to icon-only shortcuts. Keep wallet activity and history on Home, separate from the Overview dashboard. Show supplied daily/hourly amounts as unverified estimates, never as guaranteed payouts. Do not credit other cash rewards until their basis, eligibility, and terms are clear and verified.

**Why:** The user said registration will use a Ugandan phone number.

**How to apply:** Clarify whether the number is a contact field or the primary sign-in method. Do not imply SMS verification unless the configured authentication provider supports it.

Registration and sign-in use a Ugandan mobile number plus password only: no email, SMS code, or number verification. Forgotten passwords require administrator assistance, and existing Clerk accounts do not automatically transfer to this new account system.

**Why:** The user explicitly approved replacing Clerk with phone/password accounts, accepting unverified numbers and admin-assisted resets.

**How to apply:** Keep login/signup screens limited to the mode switch, required form fields, validation/status messages, and submit action. Put account-access disclosures on another page, and do not imply ownership verification or promise self-service recovery.

For the public login and registration screens, the user wants only the samsung brand and login/registration controls with their required fields. The root route should go directly to sign-in rather than showing a public marketing homepage.

**Why:** The user objected to seeing the promotional homepage and asked to leave only registration and login with Samsung branding.

**How to apply:** Redirect unauthenticated visitors from `/` to `/sign-in`; keep `/sign-in` and `/sign-up` limited to the brand mark/name, auth switch, required fields, and status messages. Do not restore the hero, public product marketing, or footer. Preserve the +256 phone flow, password visibility controls, signup confirmation, invite-code prefill, and 12-character minimum.

Every account receives a persistent referral code automatically. Signup links prefill the code, and successful registrations store the direct inviter. Referral commissions and payouts remain inactive until their rules are defined.

**Why:** The user asked for automatic code generation for each new user, then clarified that an inviter's code should appear automatically when a new user opens their registration link.

**How to apply:** Generate each code once, keep it stable across sign-ins, prefill it from shared signup links, and reject invalid provided codes rather than silently discarding them. Direct inviter attribution may be stored, but do not imply commissions or payouts are active.

The user chose a separate UGX wallet with customer top-ups and withdrawals, named PesaJet as the desired gateway, set the minimum withdrawal to UGX 10,000, and confirmed a 20% withdrawal fee. They earlier chose MTN/Airtel for payouts but later supplied withdrawal screenshots with bank-account/card pages. Follow the latest screenshot for the member-page layout; confirm the destination before enabling real payouts. PesaJet payout submission and verified wallet totals/history are not connected.

All displayed currency is UGX. Remove non-Uganda recharge country choices; do not add country-specific payment channels or other payment claims unless the user confirms them.

**Why:** The user wants actual money movement, but there is no connected wallet provider or transaction ledger; mock balances would mislead customers.

**How to apply:** Display the confirmed UGX 10,000 minimum and 20% fee. Do not add payout destination choices beyond the latest supplied screenshot, and do not submit or persist payout details until the user confirms the destination and a provider that supports it is verified. Keep balances and transaction history inactive until server-backed data exists.

The daily 500 UGX Task Center reward is named "Presence," not "Daily Check-in." Task Center task text, goals, and UGX reward terms should be editable in the admin panel. Presence claims are recorded once per Kampala day when enabled and update Presence statistics only; they are not wallet credits or payouts. Keep tasks inactive by default.

**Why:** The user specified the daily reward amount and corrected its label to Presence; referral, purchase, and payout verification systems remain incomplete.

**How to apply:** Keep task definitions persistent and admin-only editable, but do not imply configured rewards are guaranteed or already accruing without verified event tracking and ledger support.

Each successful signup receives the UGX 5,000 welcome bonus immediately, even though phone ownership is not verified. The user wants it reflected in both Pay and Accumulated. Do not show a standalone bonus card.

**Why:** The user confirmed the bonus is already credited and explicitly chose immediate credit for every new signup, including unverified phone numbers.

**How to apply:** Credit UGX 5,000 exactly once as part of successful account creation, and show server-reported wallet balance and accumulated totals on Home and Account without a Pending label. Do not add a separate bonus card.
