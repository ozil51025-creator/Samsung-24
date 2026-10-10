import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { AuthProvider, getAuthErrorMessage, useAuth } from '@/auth/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OverviewWalletPanel } from '@/components/overview-wallet-panel';
import { ProductsCatalog } from '@/components/products-catalog';
import { productCatalog } from '@/data/product-catalog';
import NotFound from '@/pages/not-found';
import { ArrowDownRight, ArrowRight, BadgeCheck, Bell, ChevronDown, ChevronRight, Copy, CreditCard, Download, Eye, EyeOff, FileText, Gift, Headphones, History, LayoutDashboard, LockKeyhole, PackageOpen, Share2, ShieldCheck, ShoppingBag, UserRound, UsersRound } from 'lucide-react';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const money = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 });

function Brand({ small = false, inverse = false }: { small?: boolean; inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden="true" className={`brand-mark flex items-center justify-center rounded-[12px] text-[#f7f1dc] ${small ? 'h-9 w-9' : 'h-10 w-10'}`}>
        <span className="font-[Syne] text-[18px] font-bold leading-none">S</span>
      </span>
      <span className={`font-[Syne] text-[15px] font-bold tracking-[-0.045em] ${inverse ? 'text-white' : 'text-[#243b31]'}`}>Samsung Gadgets</span>
    </span>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]" aria-label="Samsung Gadgets home">
        <Brand />
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5" aria-label="Account navigation">
        <span className="hidden text-[13px] text-[#6d786f] sm:inline">Already have an account?</span>
        <Link href="/sign-in" className="inline-flex h-10 items-center justify-center rounded-full border border-[#c9cbbb] bg-[#fffdf7]/80 px-5 text-[13px] font-semibold text-[#294637] transition-colors hover:border-[#315f49] hover:text-[#315f49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]" data-testid="link-sign-in">Sign in</Link>
      </nav>
    </header>
  );
}

function Home() {
  return (
    <main className="shop-shell shop-grain min-h-[100dvh]">
      <div className="relative z-10 mx-auto max-w-[1180px] px-5 pb-10 pt-5 sm:px-8 sm:pt-7 lg:px-12">
        <Header />
        <section className="grid items-center gap-8 pb-11 pt-14 sm:pb-14 sm:pt-20 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:pt-24">
          <div className="rise-in max-w-[640px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8d1bd] bg-[#faf7ed] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#536e59]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d27e52]" />
              Product sales rewards
            </div>
            <h1 className="font-[Syne] text-[clamp(2.8rem,7vw,5.9rem)] font-bold leading-[.98] tracking-[-.075em] text-[#243b31]">
              Samsung gadget ideas.
              <br />
              <span className="text-[#3e7658]">UGX price tiers.</span>
            </h1>
            <p className="mt-6 max-w-[490px] text-[15px] leading-7 text-[#647168] sm:text-[17px] sm:leading-8">
              Browse suggested Samsung gadgets across your UGX price tiers. Exact models, condition and availability still need confirmation.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/sign-up" className="group inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-[#315f49] px-7 text-[14px] font-bold text-[#fffdf7] shadow-[0_9px_20px_rgba(49,95,73,.17)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49] focus-visible:ring-offset-2" data-testid="link-create-account">
                Create an account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center gap-2 text-[12px] text-[#6c786d]"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Ugandan phone and password</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#d8d4c7] pt-5 text-[12px] font-medium text-[#53675b]">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#477553]" aria-hidden="true" /> Account signup only</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d27e52]" /> No checkout or deposits</span>
            </div>
          </div>
          <aside className="rise-in-delay relative overflow-hidden rounded-[26px] border border-[#355944] bg-[#244735] p-6 text-[#f8f3e5] shadow-[0_24px_60px_rgba(36,71,53,.16)] sm:p-8">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute -right-5 -top-9 h-40 w-40 rounded-full border border-white/10" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b9cdb4]">Program status</div>
              <div className="mt-5 flex items-start gap-4">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e4a16f] text-[#253b30]"><ArrowDownRight className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <h2 className="font-[Syne] text-[24px] font-semibold leading-tight tracking-[-.04em] sm:text-[28px]">Rewards are not active yet.</h2>
                  <p className="mt-3 max-w-[390px] text-[13px] leading-6 text-[#d6dfd0]">Reward amounts and payout rules are not active or configured yet. Signing up does not create a reward balance or guarantee a payment.</p>
                </div>
              </div>
              <div className="mt-7 border-t border-white/15 pt-5">
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[.12em] text-[#b9cdb4]">
                  <span>What you can do now</span><span className="font-mono text-[#e5b28e]">01 / 02</span>
                </div>
                <p className="mt-2 text-[14px] font-medium text-[#fff9eb]">Review product sale price tiers and create an account.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-[#d8d4c7] pt-8 sm:pt-10" aria-labelledby="prices-title">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Uganda · UGX</p>
              <h2 id="prices-title" className="mt-2 font-[Syne] text-[30px] font-bold tracking-[-.055em] text-[#243b31] sm:text-[38px]">Suggested product tiers</h2>
            </div>
            <p className="max-w-[400px] text-[12px] leading-5 text-[#70796f]">Daily and hourly figures are user-provided estimates, not verified or guaranteed returns. No payouts are active; confirm exact models and availability before listing.</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {productCatalog.map((product, index) => (
              <article key={product.id} className="product-row rounded-[15px] border border-[#dedbce] bg-[#fffdf7]/80 p-4 transition-colors hover:border-[#9eae9a] sm:p-5" style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#819080]">{product.name}</p>
                <p className="price-figure mt-3 text-[clamp(1.1rem,2.3vw,1.55rem)] font-medium tracking-[-.07em] text-[#294637]"><span className="mr-1 text-[11px] tracking-normal text-[#728073]">UGX</span>{money.format(product.price)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#ece8dc] pt-2 text-[9px] text-[#647168]">
                  <div>
                    <p>Daily · 25%</p>
                    <p className="price-figure mt-1 font-semibold text-[#294637]">UGX {money.format(product.daily)}</p>
                  </div>
                  <div>
                    <p>Hourly · 1.0417%</p>
                    <p className="price-figure mt-1 font-semibold text-[#294637]">UGX {money.format(product.hourly)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-10 flex flex-col gap-4 rounded-[20px] border border-[#ddcdbb] bg-[#f4eadb] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#9a6749]">A transparent start</p>
            <p className="mt-1 font-[Syne] text-[19px] font-semibold tracking-[-.035em] text-[#3b4638]">Join now to create your account.</p>
            <p className="mt-1 text-[12px] leading-5 text-[#746d5f]">Rewards will remain inactive until their amounts and payout rules are configured.</p>
          </div>
          <Link href="/sign-up" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#315f49] px-5 text-[13px] font-bold text-white hover:bg-[#244b38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]" data-testid="link-footer-signup">Create account <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
        <footer className="mt-8 flex flex-col gap-3 border-t border-[#d8d4c7] pt-5 text-[11px] leading-5 text-[#758078] sm:flex-row sm:items-center sm:justify-between">
          <span>Samsung Gadgets · Independent retailer · Uganda</span>
          <span>Not affiliated with Samsung. Reward amounts and payout rules are not active or configured yet.</span>
        </footer>
      </div>
    </main>
  );
}

function HomeRedirect() {
  const { user, status } = useAuth();
  if (status === 'loading') return <Home />;
  return user ? <Redirect to="/overview" /> : <Home />;
}

const memberNav = [
  { href: '/overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', shortLabel: 'Products', icon: ShoppingBag },
  { href: '/purchased-products', label: 'Purchased Products', shortLabel: 'Purchased', icon: PackageOpen },
  { href: '/referral', label: 'Referral', shortLabel: 'Referral', icon: UsersRound },
  { href: '/account', label: 'My Account', shortLabel: 'Account', icon: UserRound },
];

function MemberFrame({ active, children }: { active: string; children: ReactNode }) {
  const { user, status, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const activePage = memberNav.find((item) => item.href === active);
  const isOverview = active === '/overview';
  const isReferral = active === '/referral';
  const isProducts = active === '/products';
  const isAccount = active === '/account';
  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
      setLocation('/');
    } catch (error) {
      setSignOutError(getAuthErrorMessage(error, 'Could not sign you out. Try again.'));
    } finally {
      setSigningOut(false);
    }
  };
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const ogTitleTag = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const ogDescriptionTag = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const previousDescription = descriptionTag?.content;
    const previousOgTitle = ogTitleTag?.content;
    const previousOgDescription = ogDescriptionTag?.content;
    const pageTitle = `${activePage?.label ?? 'Member portal'} — Samsung Gadgets`;
    document.title = pageTitle;
    const description = 'Member account portal for Samsung Gadgets, an independent retailer in Uganda. Product sale prices are shown in UGX; checkout, rewards, and referral tracking are not active.';
    if (descriptionTag) descriptionTag.content = description;
    if (ogTitleTag) ogTitleTag.content = pageTitle;
    if (ogDescriptionTag) ogDescriptionTag.content = description;
    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription) descriptionTag.content = previousDescription;
      if (ogTitleTag && previousOgTitle) ogTitleTag.content = previousOgTitle;
      if (ogDescriptionTag && previousOgDescription) ogDescriptionTag.content = previousOgDescription;
    };
  }, [activePage?.label]);
  if (status === 'loading') {
    return <main className="shop-shell min-h-[100dvh] p-6 text-center text-sm text-[#657168]" role="status">Checking your account…</main>;
  }
  if (status === 'error') {
    return <main className="shop-shell min-h-[100dvh] p-6 text-center text-sm text-[#657168]"><p>We couldn’t check your account right now.</p><Link href="/sign-in" className="mt-3 inline-block font-semibold text-[#315f49]">Try signing in</Link></main>;
  }
  if (!user) return <Redirect to="/sign-in" />;

  return (
    <>
        <main className={`shop-grain min-h-[100dvh] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:py-7 sm:pb-28 ${isOverview ? 'overview-shell' : isReferral ? 'referral-shell' : isProducts ? 'products-shell' : isAccount ? 'account-shell' : 'shop-shell'}`}>
          <div className="member-frame relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-[1240px] flex-col sm:min-h-[calc(100dvh-3.5rem)]">
            <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-4 border-b pb-4 sm:pb-5 ${isOverview ? 'border-white/10' : isProducts ? 'border-[#9bbfce]' : 'border-[#d8d4c7]'}`}>
              <Link href="/overview" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd0a0]" aria-label="Samsung Gadgets overview"><Brand small inverse={isOverview || isAccount} /></Link>
              <div className="flex items-center gap-3">
                 <span className={`hidden max-w-[180px] truncate text-[12px] sm:inline ${isOverview ? 'text-white/60' : 'text-[#68756a]'}`}>{user.phoneNumber}</span>
                 <button type="button" onClick={handleSignOut} disabled={signingOut} className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60 ${isOverview ? 'border-white/15 bg-white/[.06] text-white/80 hover:border-white/35 hover:bg-white/10 focus-visible:ring-[#6dd0a0]' : isProducts ? 'border-[#9fb9c5] bg-white/60 text-[#405c6a] hover:border-[#547f92] hover:text-[#183b50] focus-visible:ring-[#547f92]' : 'border-[#c9cbbb] bg-[#fffdf7]/80 text-[#34513f] hover:border-[#315f49] hover:text-[#315f49] focus-visible:ring-[#315f49]'}`} data-testid="button-sign-out">{signingOut ? 'Signing out…' : 'Sign out'}</button>
              </div>
              <nav className={`member-nav order-3 hidden w-full gap-1 overflow-x-auto border-t pt-3 md:order-none md:flex md:w-auto md:border-0 md:pt-0 ${isOverview ? 'border-white/10' : 'border-[#e4e0d4]'}`} aria-label="Member navigation">
                {memberNav.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} aria-current={active === href ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49] sm:px-3.5 ${isOverview ? (active === href ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white') : isProducts ? (active === href ? 'bg-[#142438] text-white' : 'text-[#476675] hover:bg-white/50 hover:text-[#173448]') : (active === href ? 'bg-[#315f49] text-[#fffdf7]' : 'text-[#617166] hover:bg-[#e9eadf] hover:text-[#294637]')}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" /><span>{label}</span>
                  </Link>
                ))}
             </nav>
             {signOutError && <p className="w-full text-right text-[11px] text-red-500" role="alert">{signOutError}</p>}
            </header>
            <div className={`flex-1 ${isOverview ? 'py-5 sm:py-8' : 'py-7 sm:py-10'}`}>
              {!isOverview && !isReferral && <div className="mb-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Samsung Gadgets · Uganda</p>
                <h1 className="mt-2 font-[Syne] text-[32px] font-bold leading-tight tracking-[-.06em] text-[#243b31] sm:text-[42px]">{activePage?.label}</h1>
              </div>}
              {children}
            </div>
            {!isOverview && <footer className={`border-t py-4 text-[11px] leading-5 ${isReferral ? 'border-[#e1e4e6] text-[#788087]' : isProducts ? 'border-[#9bbfce] text-[#547181]' : 'border-[#d8d4c7] text-[#758078]'}`}>
              Independent retailer · Not affiliated with Samsung · Rewards, referral tracking, and checkout are not active.
            </footer>}
          </div>
          <nav className={`member-bottom-nav fixed left-1/2 z-50 grid -translate-x-1/2 grid-cols-5 gap-1 p-2 backdrop-blur-xl md:hidden ${isProducts ? 'products-bottom-nav' : 'bottom-3 w-[min(calc(100%-1.5rem),520px)] rounded-[22px] border border-white/10 bg-[#12171d]/95 shadow-[0_14px_44px_rgba(0,0,0,.45)]'}`} aria-label="Member navigation">
            {memberNav.map(({ href, shortLabel, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active === href ? 'page' : undefined} data-testid={`link-mobile-nav-${shortLabel.toLowerCase()}`} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74d6a4] ${isProducts ? (active === href ? 'text-[#142438]' : 'text-[#304d5c]/70 hover:bg-white/30 hover:text-[#142438]') : (active === href ? 'text-white' : 'text-white/55 hover:bg-white/[.06] hover:text-white')}`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${active === href ? 'bg-white text-[#10151a]' : 'bg-transparent'}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">{shortLabel}</span>
              </Link>
            ))}
          </nav>
        </main>
    </>
  );
}

function OverviewPage() {
  const { user } = useAuth();
  return <MemberFrame active="/overview">
    <section className="overview-dashboard relative mx-auto max-w-[850px]" aria-labelledby="overview-title">
      <div className="overview-aura pointer-events-none absolute -inset-x-8 -inset-y-5 -z-10 rounded-[42px]" aria-hidden="true" />
      <div className="overview-panel relative overflow-hidden rounded-[28px] border border-white/[.14] p-5 text-[#f5f6f5] shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:rounded-[32px] sm:p-8">
        <div className="overview-panel-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b3c7bd]">
            <span className="overview-crown flex h-5 w-5 items-center justify-center rounded-md text-[11px]" aria-hidden="true">✦</span>
            Samsung Gadgets · Uganda
          </div>
          <h1 id="overview-title" data-testid="text-overview-welcome" className="mt-4 max-w-[670px] font-[Syne] text-[clamp(1.9rem,6vw,3.15rem)] font-semibold leading-[1.12] tracking-[-.055em] text-white">
            Welcome — explore your gadget rewards.
          </h1>
          <p className="mt-3 max-w-[620px] text-[13px] leading-6 text-white/65 sm:text-[14px]">
            Your member overview for product price tiers and program updates. All listed amounts are in UGX.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="overview-status-card" data-testid="card-overview-welcome-bonus">
              <div className="flex items-center gap-2 text-[12px] font-medium text-white/65"><Gift className="h-4 w-4 text-[#edbd76]" aria-hidden="true" /> Welcome bonus</div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="price-figure text-[20px] font-semibold tracking-[-.04em] text-white" data-testid="text-welcome-bonus-amount">UGX 5,000</p>
                <span className="rounded-full border border-[#e3b67a]/25 bg-[#e3b67a]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#f0c98e]">Pending terms</span>
              </div>
              <p className="mt-2 text-[11px] leading-[1.55] text-white/50">Not credited or withdrawable; eligibility and payout rules are not set.</p>
            </article>

            <article className="overview-status-card" data-testid="card-overview-products">
              <div className="flex items-center gap-2 text-[12px] font-medium text-white/65"><ShoppingBag className="h-4 w-4 text-[#9ee0c2]" aria-hidden="true" /> Product catalog</div>
              <p className="mt-2 text-[20px] font-semibold tracking-[-.04em] text-white" data-testid="text-overview-product-count">12 price tiers</p>
              <p className="mt-2 text-[11px] leading-[1.55] text-white/50">UGX 20,000–2,000,000. Product details and checkout are unavailable.</p>
              <Link href="/products" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#a4e6c8] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74d6a4]" data-testid="link-overview-products">Browse products <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            </article>

            <article className="overview-status-card" data-testid="card-overview-rewards">
              <div className="flex items-center gap-2 text-[12px] font-medium text-white/65"><BadgeCheck className="h-4 w-4 text-[#9ee0c2]" aria-hidden="true" /> Rewards status</div>
              <p className="mt-2 text-[20px] font-semibold tracking-[-.04em] text-white" data-testid="status-overview-rewards">Not active</p>
              <p className="mt-2 text-[11px] leading-[1.55] text-white/50">No daily earnings, reward balance, or payouts are being tracked.</p>
            </article>

            <article className="overview-status-card" data-testid="card-overview-referrals">
              <div className="flex items-center gap-2 text-[12px] font-medium text-white/65"><UsersRound className="h-4 w-4 text-[#d3b3ff]" aria-hidden="true" /> Referral program</div>
              <p className="mt-2 text-[20px] font-semibold tracking-[-.04em] text-white" data-testid="status-overview-referrals">Not active</p>
              <p className="mt-2 text-[11px] leading-[1.55] text-white/50">Referral links, sale attribution, and bonus terms are not configured.</p>
            </article>
          </div>

          <OverviewWalletPanel />

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[460px] text-[11px] leading-5 text-white/45">Purchases are not accepted here. Pending amounts are informational only and do not represent an available balance.</p>
            <Link href="/products" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#e9b975] px-5 text-[12px] font-bold text-[#211d18] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" data-testid="link-overview-browse">
              Explore products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  </MemberFrame>;
}

function ProductsPage() {
  return <MemberFrame active="/products">
    <ProductsCatalog products={productCatalog} formatPrice={(price) => money.format(price)} />
  </MemberFrame>;
}

function PurchasedProductsPage() {
  return <MemberFrame active="/purchased-products">
    <section className="mx-auto max-w-[760px] rounded-[24px] border border-[#dedbce] bg-[#fffdf7]/90 px-6 py-12 text-center shadow-[0_18px_48px_rgba(36,59,49,.05)] sm:px-12 sm:py-16">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e6eadc] text-[#315f49]"><PackageOpen className="h-7 w-7" aria-hidden="true" /></span>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Order history</p>
      <h2 className="mt-2 font-[Syne] text-[27px] font-bold tracking-[-.05em] text-[#243b31] sm:text-[32px]">No purchase records</h2>
      <p className="mx-auto mt-3 max-w-[480px] text-[13px] leading-6 text-[#657168]">There are no real order records connected to this account. Purchases cannot be made from this portal yet.</p>
      <Link href="/products" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#315f49] px-5 text-[12px] font-bold text-[#fffdf7] hover:bg-[#244b38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]">Review sale prices <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </section>
  </MemberFrame>;
}

function ReferralPage() {
  const { user } = useAuth();
  const [referralNotice, setReferralNotice] = useState('');
  const stats = [
    { label: 'Total team', value: 'Not shown', icon: UsersRound },
    { label: 'Product purchases', value: 'Not tracked', icon: ShoppingBag },
    { label: 'Commissions', value: 'Not active', icon: LockKeyhole },
  ];

  const referralLink = user?.referralCode
    ? `${window.location.origin}${basePath}/sign-up?ref=${encodeURIComponent(user.referralCode)}`
    : '';

  async function copyReferralLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralNotice('Referral link copied.');
    } catch {
      setReferralNotice('Copy unavailable. Select and copy the referral link above.');
    }
  }

  async function shareReferralLink() {
    if (!user?.referralCode || !referralLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join Samsung Gadgets',
          text: `Register using my referral code ${user.referralCode}.`,
          url: referralLink,
        });
        setReferralNotice('Referral link shared.');
      } else {
        await navigator.clipboard.writeText(referralLink);
        setReferralNotice('Sharing is unavailable. Referral link copied instead.');
      }
    } catch {
      setReferralNotice('Could not share the referral link. You can copy it above.');
    }
  }

  return <MemberFrame active="/referral">
    <section className="mx-auto max-w-[920px] space-y-5" data-testid="page-referral">
      <header className="flex items-center justify-between gap-4 rounded-[17px] border border-[#e7e9eb] bg-white px-4 py-3 shadow-[0_3px_12px_rgba(25,31,37,.04)]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e2] text-[#9b4b14]"><UsersRound className="h-5 w-5" aria-hidden="true" /></span>
          <h1 className="truncate font-[Syne] text-[15px] font-bold tracking-[-.03em] text-[#25292d]">Team &amp; Referrals</h1>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8eaec] bg-[#fafbfb] text-[#68727a]" title="Notifications are unavailable">
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </header>

      <section className="rounded-[24px] bg-gradient-to-br from-[#a84b0d] via-[#98420d] to-[#312720] p-4 text-white shadow-[0_14px_30px_rgba(89,47,18,.2)] sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ffd48e]">Community · product rewards</p>
        <h2 className="mt-2 max-w-[640px] font-[Syne] text-[24px] font-bold leading-[1.12] tracking-[-.045em] sm:text-[32px]">3-Tier Team Downline &amp; Rewards</h2>
        <p className="mt-3 max-w-[640px] text-[13px] leading-6 text-white/80">Invite friends to explore the Samsung gadget catalog. Signups through your link record who invited them; commissions are not active yet.</p>
      </section>

      <section className="rounded-[24px] border border-[#e5e7e9] bg-white p-4 shadow-[0_5px_16px_rgba(20,28,36,.06)] sm:p-6" aria-labelledby="referral-code-title">
        <h2 id="referral-code-title" className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9094]">Your referral code</h2>
        <div className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-[16px] border border-[#e7e8e7] bg-[#fafaf9] px-4">
          <span className="font-mono text-[14px] font-bold tracking-[.12em] text-[#25292d]">{user?.referralCode ?? 'Generating…'}</span>
          <span className="rounded-full bg-[#e7f2e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[.05em] text-[#356746]">Generated</span>
        </div>
        <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9094]">Your referral link</h3>
        <div className="mt-2 truncate rounded-[14px] border border-[#e7e8e7] bg-[#fafaf9] px-4 py-3 font-mono text-[11px] text-[#697178]" title={referralLink}>{referralLink || 'Preparing your referral link…'}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={copyReferralLink} disabled={!referralLink} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-[#9e4b12] px-3 text-[12px] font-bold text-white hover:bg-[#813c0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e4b12] disabled:cursor-not-allowed disabled:opacity-55"><Copy className="h-4 w-4" aria-hidden="true" /> Copy link</button>
          <button type="button" onClick={shareReferralLink} disabled={!referralLink} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-[#e5e6e7] bg-[#f6f6f5] px-3 text-[12px] font-bold text-[#343a3f] hover:bg-[#eeefed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e4b12] disabled:cursor-not-allowed disabled:opacity-55"><Share2 className="h-4 w-4" aria-hidden="true" /> Share link</button>
        </div>
        <p className="mt-3 min-h-5 text-[11px] leading-5 text-[#81868a]" role="status" aria-live="polite">{referralNotice}</p>
      </section>

      <section aria-labelledby="team-performance-title">
        <h2 id="team-performance-title" className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[.09em] text-[#737a7f]">Overall team performance</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <article key={label} className="min-w-0 rounded-[18px] border border-[#e5e7e9] bg-white px-2.5 py-4 text-center shadow-[0_3px_10px_rgba(25,31,37,.04)] sm:px-4">
              <Icon className="mx-auto h-4 w-4 text-[#9b4a13]" aria-hidden="true" />
              <p className="mt-2 text-[9px] font-bold uppercase tracking-[.04em] text-[#81878b] sm:text-[10px]">{label}</p>
              <p className="mt-2 break-words font-[Syne] text-[12px] font-bold leading-tight text-[#25292c] sm:text-[15px]">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="downline-title">
        <h2 id="downline-title" className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[.09em] text-[#737a7f]">3-tier downline breakdown</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3].map((level) => (
            <article key={level} className="min-w-0 rounded-[17px] border border-[#e5e7e9] bg-white p-3 shadow-[0_3px_10px_rgba(25,31,37,.04)] sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-[.06em] text-[#8b9094] sm:text-[10px]">Level {level}</p>
              <p className="mt-2 font-[Syne] text-[13px] font-bold leading-tight text-[#25292c] sm:text-[15px]">Not shown</p>
              <p className="mt-2 text-[9px] leading-4 text-[#858a8e] sm:text-[10px]">Referral team counts are not displayed yet.</p>
            </article>
          ))}
        </div>
      </section>

      <p className="rounded-[16px] border border-[#ead6c1] bg-[#fff8ef] px-4 py-3 text-[11px] leading-5 text-[#765b47]">Referral rewards remain inactive until the qualifying purchase, calculation basis, and payout terms are confirmed.</p>
    </section>
  </MemberFrame>;
}

function AccountPage() {
  const { user } = useAuth();
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const accountActions = [
    { id: 'password', label: 'Change password', icon: ShieldCheck, detail: 'Password changes are handled by an administrator. Self-service password changes are not available yet.' },
    { id: 'gift', label: 'Redeem gift code', icon: Gift, detail: 'Gift-code redemption is not available yet.' },
    { id: 'help', label: 'Help & community', icon: Headphones, detail: 'Help and community links have not been configured yet.' },
    { id: 'install', label: 'Install Samsung Gadgets', icon: Download, detail: 'If your browser offers an Install app option in its menu, you can use it to add this site to your device.' },
    { id: 'terms', label: 'Terms & conditions', icon: FileText, detail: 'Terms have not been published yet. Product availability, checkout, rewards, and wallet services are not active.' },
  ];

  return <MemberFrame active="/account">
    <section className="account-content mx-auto w-full max-w-[580px]" data-testid="page-account">
      <div className="account-quick-actions" aria-label="Wallet and notifications">
        <button type="button" disabled title="PesaJet wallet service is not connected" className="account-deposit-button" data-testid="button-account-deposit">
          <Download className="h-4 w-4" aria-hidden="true" /> Deposit
        </button>
        <button type="button" disabled aria-label="Notifications unavailable" title="Notifications are not available yet" className="account-bell-button" data-testid="button-account-notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <section className="account-profile-card" aria-labelledby="account-profile-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="account-eyebrow">Samsung Gadgets · Member account</p>
            <h1 id="account-profile-title" className="mt-2 font-[Syne] text-[30px] font-semibold tracking-[-.055em] text-white">Your account</h1>
            <p className="mt-2 break-all text-[14px] text-white/75" data-testid="text-account-phone">{user?.phoneNumber}</p>
          </div>
          <span className="account-profile-icon" aria-hidden="true"><UserRound className="h-6 w-6" /></span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="account-status-pill">Phone sign-in</span>
          <span className="account-status-pill">Number not verified</span>
        </div>
      </section>

      <section className="account-menu-card" aria-label="Account options">
        <Link href="/overview#wallet-history" className="account-menu-row" data-testid="link-account-history">
          <History className="account-menu-icon" aria-hidden="true" />
          <span>Transaction history</span>
          <ChevronRight className="account-menu-chevron" aria-hidden="true" />
        </Link>
        {accountActions.map(({ id, label, icon: Icon, detail }) => {
          const isExpanded = expandedAction === id;
          return (
            <div className="account-menu-item" key={id}>
              <button type="button" className="account-menu-row" aria-expanded={isExpanded} onClick={() => setExpandedAction(isExpanded ? null : id)} data-testid={`button-account-${id}`}>
                <Icon className="account-menu-icon" aria-hidden="true" />
                <span>{label}</span>
                {id === 'help' ? <ArrowRight className="account-menu-chevron -rotate-45" aria-hidden="true" /> : isExpanded ? <ChevronDown className="account-menu-chevron" aria-hidden="true" /> : <ChevronDown className="account-menu-chevron" aria-hidden="true" />}
              </button>
              {isExpanded && <p className="account-menu-detail" role="status" data-testid={`status-account-${id}`}>{detail}</p>}
            </div>
          );
        })}
      </section>
    </section>
  </MemberFrame>;
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell grid min-h-[100dvh] place-items-center p-4 sm:p-6" data-testid="page-phone-auth">
      <div className="w-full max-w-[460px]">{children}</div>
    </main>
  );
}

function PhoneAuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const { user, status, signIn, register } = useAuth();
  const [localNumber, setLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('ref') ?? params.get('referralCode') ?? '').trim().toUpperCase().slice(0, 10);
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === 'sign-up';

  if (user) return <Redirect to="/overview" />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (isSignUp && password !== confirmPassword) {
      setError('Your passwords do not match. Please check both fields.');
      return;
    }
    setSubmitting(true);
    try {
      const phoneNumber = `+256${localNumber}`;
      if (isSignUp) {
        const code = referralCode.trim().toUpperCase();
        await register({
          phoneNumber,
          password,
          ...(code ? { referralCode: code } : {}),
        });
      } else {
        await signIn({ phoneNumber, password });
      }
    } catch (reason) {
      setError(getAuthErrorMessage(
        reason,
        isSignUp ? 'Could not create your account. Check your details and try again.' : 'Invalid phone number or password.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthFrame>
    {isSignUp && (
      <div className="auth-register-brand">
        <Brand inverse />
      </div>
    )}
    <section className="auth-card" aria-label={isSignUp ? 'Register' : 'Login'} data-testid={`panel-${mode}`}>
      <nav className="auth-mode-switch" aria-label="Choose account action">
        <Link href="/sign-in" aria-current={!isSignUp ? 'page' : undefined} className={`auth-mode-link ${!isSignUp ? 'is-active' : ''}`} data-testid="link-auth-login">Login</Link>
        <Link href="/sign-up" aria-current={isSignUp ? 'page' : undefined} className={`auth-mode-link ${isSignUp ? 'is-active' : ''}`} data-testid="link-auth-register">Register</Link>
      </nav>

      <form className="auth-form" onSubmit={handleSubmit} data-testid={`form-${mode}`}>
        <div>
          <label htmlFor="phone-number" className="auth-label">Ugandan mobile number</label>
          <div className="auth-phone-control">
            <span className="auth-phone-prefix" aria-label="Uganda country code">+256</span>
            <input
              id="phone-number"
              name="phoneNumber"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              minLength={9}
              maxLength={9}
              pattern="7[0-9]{8}"
              placeholder="7XXXXXXXX"
              value={localNumber}
              onChange={(event) => {
                let value = event.target.value.replace(/\D/g, '');
                if (value.startsWith('256')) value = value.slice(3);
                if (value.startsWith('0')) value = value.slice(1);
                setLocalNumber(value.slice(0, 9));
              }}
              className="auth-input auth-phone-input"
              data-testid="input-phone-number"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="auth-label">Password</label>
          <div className="auth-password-control">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={isSignUp ? 12 : undefined}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="auth-input"
              data-testid="input-password"
            />
            <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} data-testid="button-toggle-password">
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {isSignUp && <p className="auth-field-hint">Use at least 12 characters.</p>}
        </div>

        {isSignUp && <>
          <div>
            <label htmlFor="confirm-password" className="auth-label">Confirm password</label>
            <div className="auth-password-control">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="auth-input"
                data-testid="input-confirm-password"
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirmPassword} data-testid="button-toggle-confirm-password">
                {showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="referral-code" className="auth-label">Referral code <span className="auth-optional">Optional</span></label>
            <input
              id="referral-code"
              name="referralCode"
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={10}
              placeholder="Enter an invite code"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              className="auth-input auth-referral-input"
              data-testid="input-referral-code"
            />
            {referralCode && <p className="auth-field-hint">This code will be attached to your registration.</p>}
          </div>
        </>}

        {error && <p className="auth-error" role="alert" data-testid="status-auth-error">{error}</p>}
        {status === 'error' && <p className="auth-session-note" role="status" data-testid="status-session-check">We couldn’t check an existing session. You can still try signing in or creating an account.</p>}

        <button type="submit" disabled={submitting || status === 'loading'} className="auth-submit" data-testid="button-submit-auth">
          {submitting ? 'Please wait…' : status === 'loading' ? 'Checking account…' : isSignUp ? 'Create account' : 'Sign in'}
          {!submitting && status !== 'loading' && <ArrowRight aria-hidden="true" />}
        </button>
      </form>

    </section>
  </AuthFrame>;
}

function SignInPage() {
  return <PhoneAuthPage mode="sign-in" />;
}

function SignUpPage() {
  return <PhoneAuthPage mode="sign-up" />;
}

function AppRoutes() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/user-portal"><Redirect to="/overview" /></Route>
        <Route path="/overview" component={OverviewPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/purchased-products" component={PurchasedProductsPage} />
        <Route path="/referral" component={ReferralPage} />
        <Route path="/account" component={AccountPage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/register"><Redirect to={`/sign-up${window.location.search}`} /></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}><AuthProvider><AppRoutes /></AuthProvider></WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
