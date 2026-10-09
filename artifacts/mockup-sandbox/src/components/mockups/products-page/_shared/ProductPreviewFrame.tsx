import { type ReactNode } from 'react';
import { LayoutDashboard, PackageOpen, ShoppingBag, UserRound, UsersRound } from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Products', icon: ShoppingBag },
  { label: 'Purchased', icon: PackageOpen },
  { label: 'Referral', icon: UsersRound },
  { label: 'Account', icon: UserRound },
];

export function ProductPreviewFrame({
  children,
  blue = false,
}: {
  children: ReactNode;
  blue?: boolean;
}) {
  return (
    <main className={`shop-grain min-h-screen px-4 pb-28 pt-4 text-[#243b31] sm:px-7 sm:py-7 ${blue ? 'products-shell' : 'shop-shell'}`}>
      <div className="mx-auto max-w-[920px]">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 border-b border-[#b5d3df] pb-4 sm:pb-5">
          <div className="flex items-center gap-3">
            <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-[12px] font-[Syne] text-[18px] font-bold text-[#f7f1dc]">R</span>
            <span className="font-[Syne] text-[15px] font-bold tracking-[-.045em]">Rewards Program</span>
          </div>
          <button type="button" disabled className="rounded-full border border-[#9fb9c5] bg-white/60 px-4 py-2 text-[12px] font-semibold text-[#536976]">Sign out</button>
          <nav className="order-3 hidden w-full gap-1 overflow-x-auto border-t border-[#b5d3df] pt-3 md:order-none md:flex md:w-auto md:border-0 md:pt-0" aria-label="Member navigation">
            {navItems.map(({ label }) => (
              <span key={label} className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-[12px] font-semibold ${label === 'Products' ? (blue ? 'bg-[#142438] text-white' : 'bg-[#315f49] text-white') : 'text-[#617166] hover:bg-white/40'}`}>
                {label}
              </span>
            ))}
          </nav>
        </header>
        <div className="py-7">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Rewards Program · Uganda</p>
          <h1 className="mt-2 font-[Syne] text-[32px] font-bold leading-tight tracking-[-.06em] text-[#243b31] sm:text-[42px]">Products</h1>
          {children}
        </div>
        <footer className="border-t border-[#b5d3df] py-4 text-[11px] leading-5 text-[#657168]">
          Rewards Program · Uganda · Checkout is not active.
        </footer>
      </div>
      <nav className={`member-bottom-nav fixed left-1/2 z-50 grid -translate-x-1/2 grid-cols-5 gap-1 border p-2 backdrop-blur-xl ${blue ? 'products-bottom-nav border-t' : 'bottom-3 w-[min(calc(100%-1.5rem),520px)] rounded-[22px] border-white/10 bg-[#12171d]/95 shadow-xl'}`} aria-label="Member navigation">
        {navItems.map(({ label, icon: Icon }) => {
          const active = label === 'Products';
          return (
            <span key={label} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 py-2 text-center ${blue ? (active ? 'text-[#142438]' : 'text-[#304d5c]/70') : (active ? 'text-white' : 'text-white/55')}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? (blue ? 'bg-white text-[#142438]' : 'bg-white text-[#10151a]') : ''}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="max-w-full truncate text-[9px] font-semibold leading-none">{label}</span>
            </span>
          );
        })}
      </nav>
    </main>
  );
}
