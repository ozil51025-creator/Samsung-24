import './_group.css';
import { LayoutDashboard, PackageOpen, ShoppingBag, UserRound, UsersRound } from 'lucide-react';
import { type ReactNode } from 'react';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Products', icon: ShoppingBag },
  { label: 'Purchased', icon: PackageOpen },
  { label: 'Referral', icon: UsersRound },
  { label: 'Account', icon: UserRound },
];

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f0e7] px-4 pb-28 pt-4 text-[#243b31] sm:px-7 sm:py-7">
      <div className="mx-auto max-w-[920px]">
        <header className="flex items-center justify-between gap-4 border-b border-[#d8d4c7] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315f49] font-[Syne] font-bold text-white">R</span>
            <span className="font-[Syne] text-sm font-bold">Rewards Program</span>
          </div>
          <button disabled className="rounded-full border border-[#c9cbbb] px-4 py-2 text-xs font-semibold text-[#68756a]">Sign out</button>
          <nav className="hidden gap-1 md:flex" aria-label="Member navigation">
            {navItems.map(({ label }) => <span key={label} className={`rounded-full px-3 py-2 text-xs font-semibold ${label === 'Referral' ? 'bg-[#315f49] text-white' : 'text-[#617166]'}`}>{label}</span>)}
          </nav>
        </header>
        <div className="py-7">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Rewards Program · Uganda</p>
          <h1 className="mt-2 font-[Syne] text-[32px] font-bold tracking-[-.06em]">Referral</h1>
          {children}
        </div>
        <footer className="border-t border-[#d8d4c7] py-4 text-[11px] text-[#758078]">Rewards Program · Uganda · Rewards, referral tracking, and checkout are not active.</footer>
      </div>
      <nav className="fixed bottom-3 left-1/2 z-50 grid w-[min(calc(100%-1.5rem),520px)] -translate-x-1/2 grid-cols-5 gap-1 rounded-[22px] border border-white/10 bg-[#12171d]/95 p-2 shadow-xl backdrop-blur-xl md:hidden" aria-label="Member navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <span key={label} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 py-2 text-center ${label === 'Referral' ? 'text-white' : 'text-white/55'}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${label === 'Referral' ? 'bg-white text-[#10151a]' : ''}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
            <span className="max-w-full truncate text-[9px] font-semibold leading-none">{label}</span>
          </span>
        ))}
      </nav>
    </main>
  );
}

export function Current() {
  return (
    <Frame>
      <section className="mt-7 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-[23px] border border-[#355944] bg-[#244735] p-6 text-[#f8f3e5] sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e4a16f] text-[#253b30]"><UsersRound className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[.16em] text-[#b9cdb4]">Referral program</p>
          <h2 className="mt-2 font-[Syne] text-[27px] font-semibold leading-tight tracking-[-.045em]">Not active yet.</h2>
          <p className="mt-3 text-[13px] leading-6 text-[#d6dfd0]">Referral tracking and commissions are not active. There is no referral link or reward to share.</p>
        </div>
        <div className="rounded-[23px] border border-[#dedbce] bg-[#fffdf7]/90 p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#75816f]">What this means</p>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d27e52]" /><p className="text-[13px] leading-6 text-[#657168]">No invitations or referral activity are recorded here.</p></div>
            <div className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d27e52]" /><p className="text-[13px] leading-6 text-[#657168]">Commission amounts and eligibility rules have not been configured.</p></div>
            <div className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d27e52]" /><p className="text-[13px] leading-6 text-[#657168]">No referral rewards or payout balance are available.</p></div>
          </div>
        </div>
      </section>
    </Frame>
  );
}
