---
name: Rewards site scope
description: The user's business model direction and branding for this website.
---

For this project, the user wants the public-facing store name "Samsung Gadgets" for a Samsung gadget catalog in Uganda, with Ugandan-phone registration. Present it as an independent retailer, not as Samsung's official store. They initially selected real-sales rewards over daily investment returns, then most recently asked for the supplied daily (25%) and hourly (1.0417%) figures to appear alongside the UGX prices. The payout basis and terms, exact product models/stock, and cash-bonus terms remain unverified or unspecified. They requested Overview, Products, Purchased, Referral, and Account pages, plus a UGX 5,000 welcome bonus as withdrawable cash. They specified referral bonus rates of 26%, 2%, and 1% for levels 1–3; the calculation base and qualifying event remain undefined.

**Why:** The user first chose the sales-rewards option and sale prices only, then corrected the catalog display after noticing their supplied daily/hourly figures were missing. Their requested values have not been supported by verified payout terms. They also requested member pages, a cash welcome bonus, real checkout, and multi-level referral bonuses. They corrected a preview that showed only three unlabeled icons instead of the five pages.

**How to apply:** Use "Samsung Gadgets" as the store name and keep the independent-retailer disclaimer visible; do not imply Samsung affiliation. Keep persistent mobile and desktop navigation labeled Overview, Products, Purchased, Referral, and Account; do not reduce it to icon-only shortcuts. Show supplied daily/hourly amounts as unverified estimates, never as guaranteed payouts. Keep payouts inactive until their basis, eligibility, and terms are clear and verified; do not credit cash bonuses before rules are configured.

**Why:** The user said registration will use a Ugandan phone number.

**How to apply:** Clarify whether the number is a contact field or the primary sign-in method. Do not imply SMS verification unless the configured authentication provider supports it.

Registration and sign-in use a Ugandan mobile number plus password only: no email, SMS code, or number verification. Forgotten passwords require administrator assistance, and existing Clerk accounts do not automatically transfer to this new account system.

**Why:** The user explicitly approved replacing Clerk with phone/password accounts, accepting unverified numbers and admin-assisted resets.

**How to apply:** Keep the no-email/no-SMS and unverified-number disclosures visible. Do not imply ownership verification or promise self-service recovery; tell returning Clerk users they must register again.

For the public login and registration screens, follow the user's supplied visual reference: dark plum/black backdrop, metallic silver feature artwork, elegant serif headings, and muted gold actions, using Samsung Gadgets branding. Do not copy the Silver Miners name or identity.

**Why:** The user supplied a login/registration reference and asked for that visual direction on their own branded site.

**How to apply:** Keep this direction on `/sign-in` and `/sign-up`; preserve the +256 phone flow, password visibility controls, signup confirmation, invite-code prefill, 12-character minimum, and accurate no-email/no-SMS disclosure.

Every account receives a persistent referral code automatically. Signup links prefill the code, and successful registrations store the direct inviter. Referral commissions and payouts remain inactive until their rules are defined.

**Why:** The user asked for automatic code generation for each new user, then clarified that an inviter's code should appear automatically when a new user opens their registration link.

**How to apply:** Generate each code once, keep it stable across sign-ins, prefill it from shared signup links, and reject invalid provided codes rather than silently discarding them. Direct inviter attribution may be stored, but do not imply commissions or payouts are active.

The user also chose a separate UGX wallet with customer top-ups and withdrawals, and named PesaJet as the desired gateway. PesaJet was not available in the current Replit integration search, so the Home/Overview wallet UI keeps actions disabled and totals/history unavailable rather than inventing transactions.

**Why:** The user wants actual money movement, but there is no connected wallet provider or transaction ledger; mock balances would mislead customers.

**How to apply:** Keep wallet actions disabled until a provider that supports UGX collections and Uganda payouts is available and the app can show verified, server-backed wallet data.
