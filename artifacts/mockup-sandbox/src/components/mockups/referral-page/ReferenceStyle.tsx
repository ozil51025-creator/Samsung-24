import './_group.css';
import { Bell, Copy, Home, LockKeyhole, PackageOpen, Share2, ShoppingBag, UserRound, UsersRound } from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: Home },
  { label: 'Products', icon: ShoppingBag },
  { label: 'Purchased', icon: PackageOpen },
  { label: 'Referral', icon: UsersRound },
  { label: 'Account', icon: UserRound },
];

const stats = [
  { label: 'Total team', value: 'Not tracked', icon: UsersRound },
  { label: 'Product purchases', value: 'Not tracked', icon: ShoppingBag },
  { label: 'Commissions', value: 'Not active', icon: LockKeyhole },
];

export function ReferenceStyle() {
  return (
    <main className="min-h-screen bg-[#f3f4f5] px-4 pb-28 pt-4 text-[#22252b] sm:px-7 sm:py-7">
      <div className="mx-auto max-w-[920px]">
        <header className="flex items-center justify-between gap-4 rounded-[16px] border border-[#e8e9eb] bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1e2] text-[#9c4b15]"><UsersRound className="h-5 w-5" aria-hidden="true" /></span>
            <span className="truncate font-[Syne] text-[15px] font-bold tracking-[-.03em]">Team &amp; Referrals</span>
          </div>
          <span title="Notifications are unavailable" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e9ebed] bg-[#f9fafb] text-[#66717a]"><Bell className="h-[18px] w-[18px]" aria-hidden="true" /></span>
        </header>

        <section className="mt-4 rounded-[24px] bg-gradient-to-br from-[#a74c0d] via-[#99420b] to-[#332720] p-4 text-white shadow-[0_14px_30px_rgba(89,47,18,.2)] sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ffd38c]">Community · product rewards</p>
          <h1 className="mt-2 max-w-[620px] font-[Syne] text-[24px] font-bold leading-[1.12] tracking-[-.045em] sm:text-[32px]">3-Tier Team Downline &amp; Rewards</h1>
          <p className="mt-3 max-w-[620px] text-[13px] leading-6 text-white/80">Invite friends to explore the product catalog. Referral tracking and commissions are not active yet.</p>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#e6e7e8] bg-white p-4 shadow-[0_5px_16px_rgba(20,28,36,.06)] sm:p-6" aria-labelledby="referral-code-title">
          <h2 id="referral-code-title" className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9094]">Your referral code</h2>
          <div className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-[16px] border border-[#e8e8e7] bg-[#fafaf9] px-4">
            <span className="text-[14px] font-semibold tracking-[.06em] text-[#747b80]">Not generated</span>
            <span className="rounded-full bg-[#fff3df] px-3 py-1 text-[10px] font-bold uppercase tracking-[.05em] text-[#95500f]">Pending</span>
          </div>
          <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9094]">Your referral link</h3>
          <div className="mt-2 truncate rounded-[14px] border border-[#e8e8e7] bg-[#fafaf9] px-4 py-3 font-mono text-[11px] text-[#7c8184]">Unavailable until referral tracking is configured</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" disabled title="Referral codes are not active" className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[14px] bg-[#9e4b12]/55 px-3 text-[12px] font-bold text-white/90"><Copy className="h-4 w-4" aria-hidden="true" /> Copy link</button>
            <button type="button" disabled title="Referral codes are not active" className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[14px] border border-[#e5e6e7] bg-[#f6f6f5] px-3 text-[12px] font-bold text-[#858b8f]"><Share2 className="h-4 w-4" aria-hidden="true" /> Share link</button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#81868a]">A code and shareable link will appear once tracking and eligibility rules are set up.</p>
        </section>

        <section className="mt-6" aria-labelledby="team-performance-title">
          <h2 id="team-performance-title" className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[.09em] text-[#737a7f]">Overall team performance</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <article key={label} className="min-w-0 rounded-[18px] border border-[#e6e8e9] bg-white px-2.5 py-4 text-center shadow-[0_3px_10px_rgba(25,31,37,.04)] sm:px-4">
                <Icon className="mx-auto h-4 w-4 text-[#9b4a13]" aria-hidden="true" />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-[.04em] text-[#81878b] sm:text-[10px]">{label}</p>
                <p className="mt-2 break-words font-[Syne] text-[12px] font-bold leading-tight text-[#25292c] sm:text-[15px]">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6" aria-labelledby="downline-title">
          <h2 id="downline-title" className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[.09em] text-[#737a7f]">3-tier downline breakdown</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[1, 2, 3].map((level) => (
              <article key={level} className="flex items-center justify-between gap-3 rounded-[17px] border border-[#e5e7e8] bg-white p-4 shadow-[0_3px_10px_rgba(25,31,37,.04)] sm:block">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8b9094]">Level {level}</p>
                  <p className="mt-1 font-[Syne] text-[15px] font-bold text-[#25292c]">Not active</p>
                </div>
                <p className="max-w-[210px] text-right text-[10px] leading-4 text-[#858a8e] sm:mt-2 sm:text-left">No confirmed referral activity is tracked.</p>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-5 rounded-[16px] border border-[#ead6c1] bg-[#fff8ef] px-4 py-3 text-[11px] leading-5 text-[#765b47]">Referral rewards remain inactive until the qualifying purchase, calculation basis, and payout terms are confirmed.</p>
      </div>

      <nav className="fixed bottom-3 left-1/2 z-50 grid w-[min(calc(100%-1.5rem),520px)] -translate-x-1/2 grid-cols-5 gap-1 rounded-[22px] border border-white/10 bg-[#151923]/95 p-2 shadow-[0_14px_44px_rgba(0,0,0,.32)] backdrop-blur-xl" aria-label="Member navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <span key={label} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 py-2 text-center ${label === 'Referral' ? 'bg-[#f5a900] text-[#20180a]' : 'text-white/65'}`}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="max-w-full truncate text-[9px] font-semibold leading-none">{label}</span>
          </span>
        ))}
      </nav>
    </main>
  );
}
