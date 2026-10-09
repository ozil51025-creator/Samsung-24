---
name: Rewards site scope
description: The user's business model direction and branding for this website.
---

For this project, the user wants their own branding, a Samsung gadget catalog in Uganda, and registration using a Ugandan phone number. They initially selected real-sales rewards over daily investment returns, then most recently asked for the supplied daily (25%) and hourly (1.0417%) figures to appear alongside the UGX prices. The payout basis and terms, exact product models/stock, and cash-bonus terms remain unverified or unspecified. They requested Overview, Products, Purchased, Referral, and Account pages, plus a UGX 5,000 welcome bonus as withdrawable cash. They specified referral bonus rates of 26%, 2%, and 1% for levels 1–3; the calculation base and qualifying event remain undefined.

**Why:** The user first chose the sales-rewards option and sale prices only, then corrected the catalog display after noticing their supplied daily/hourly figures were missing. Their requested values have not been supported by verified payout terms. They also requested member pages, a cash welcome bonus, real checkout, and multi-level referral bonuses. They corrected a preview that showed only three unlabeled icons instead of the five pages.

**How to apply:** Use the user's brand rather than the reference site's identity. Keep persistent mobile and desktop navigation labeled Overview, Products, Purchased, Referral, and Account; do not reduce it to icon-only shortcuts. Show supplied daily/hourly amounts as unverified estimates, never as guaranteed payouts. Keep payouts inactive until their basis, eligibility, and terms are clear and verified; do not credit cash bonuses before rules are configured.

**Why:** The user said registration will use a Ugandan phone number.

**How to apply:** Clarify whether the number is a contact field or the primary sign-in method. Do not imply SMS verification unless the configured authentication provider supports it.

The user also chose a separate UGX wallet with customer top-ups and withdrawals, and named PesaJet as the desired gateway. PesaJet was not available in the current Replit integration search, so the Home/Overview wallet UI keeps actions disabled and totals/history unavailable rather than inventing transactions.

**Why:** The user wants actual money movement, but there is no connected wallet provider or transaction ledger; mock balances would mislead customers.

**How to apply:** Keep wallet actions disabled until a provider that supports UGX collections and Uganda payouts is available and the app can show verified, server-backed wallet data.
