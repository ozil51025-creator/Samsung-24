import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { AuthProvider, getAuthErrorMessage, useAuth } from '@/auth/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProductsCatalog } from '@/components/products-catalog';
import { productCatalog, type ProductIllustrationKind } from '@/data/product-catalog';
import samsungPresenceImage from '../../../attached_assets/main_895c72cd-d6f4-4c0e-be9b-6fca99eae985_1791616689408.jpg';
import NotFound from '@/pages/not-found';
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, BarChart3, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleDollarSign, Copy, CreditCard, Download, Eye, EyeOff, FileText, Gift, Headphones, History, LayoutDashboard, LockKeyhole, MapPin, MessageSquare, Package, PackageOpen, Settings2, ShieldCheck, ShoppingBag, Ticket, UserRound, UsersRound, Wallet, WalletCards } from 'lucide-react';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const money = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 });
const memberNoticeKey = 'samsung-gadgets:show-member-notice';
const customerServiceUrl = 'https://t.me/kalljem';
type TaskDefinition = {
  id: string;
  title: string;
  objective: number;
  objectiveUnit: string;
  rewardUgx: number | null;
  rewardFrequency: 'once' | 'daily';
  enabled: boolean;
};
const adminSections = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'users', label: 'Users', Icon: UsersRound },
  { id: 'payments', label: 'Payments', Icon: ArrowDownRight },
  { id: 'withdrawals', label: 'Withdrawals', Icon: WalletCards },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'gift-codes', label: 'Gift Codes', Icon: Ticket },
  { id: 'messages', label: 'Messages', Icon: MessageSquare },
  { id: 'transactions', label: 'Transactions', Icon: CircleDollarSign },
  { id: 'referrals', label: 'Referrals', Icon: UsersRound },
  { id: 'settings', label: 'Settings', Icon: Settings2 },
  { id: 'countries', label: 'Countries', Icon: MapPin },
  { id: 'admins', label: 'Admins', Icon: ShieldCheck },
  { id: 'activity-log', label: 'Activity Log', Icon: Activity },
] as const;
type AdminSectionId = typeof adminSections[number]['id'];
type AdminCatalogItem = { id: string; name: string; priceUgx: number; illustration: ProductIllustrationKind; isActive: boolean };
type CatalogProduct = Pick<AdminCatalogItem, 'id' | 'name' | 'illustration'> & { price: number };
type PayoutAccount = { provider: 'airtel' | 'mtn'; holderName: string; phoneNumber: string; updatedAt: string };

function queueMemberNotice() {
  try {
    window.sessionStorage.setItem(memberNoticeKey, 'true');
  } catch {
    // Authentication should still succeed when browser storage is unavailable.
  }
}

function consumeMemberNotice() {
  try {
    const shouldShow = window.sessionStorage.getItem(memberNoticeKey) === 'true';
    window.sessionStorage.removeItem(memberNoticeKey);
    return shouldShow;
  } catch {
    return false;
  }
}

function Brand({ small = false, inverse = false }: { small?: boolean; inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden="true" className={`brand-mark flex items-center justify-center rounded-[12px] text-[#f7f1dc] ${small ? 'h-9 w-9' : 'h-10 w-10'}`}>
        <span className="font-[Syne] text-[18px] font-bold leading-none">S</span>
      </span>
      <span className={`font-[Syne] text-[15px] font-bold tracking-[-0.045em] ${inverse ? 'text-white' : 'text-[#243b31]'}`}>samsung</span>
    </span>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]" aria-label="samsung home">
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
              <span className="inline-flex items-center gap-2 text-[12px] text-[#6c786d]"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Phone and password</span>
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
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">UGX</p>
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
          <span>samsung · Independent retailer</span>
          <span>Not affiliated with Samsung. Reward amounts and payout rules are not active or configured yet.</span>
        </footer>
      </div>
    </main>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return user ? <Redirect to="/home" /> : <Redirect to="/sign-in" />;
}

const memberNav = [
  { href: '/home', label: 'Home', shortLabel: 'Home', icon: Wallet },
  { href: '/products', label: 'Products', shortLabel: 'Products', icon: ShoppingBag },
  { href: '/purchased-products', label: 'Purchased', shortLabel: 'Purchased', icon: PackageOpen },
  { href: '/referral', label: 'Referral', shortLabel: 'Referral', icon: UsersRound },
  { href: '/account', label: 'Account', shortLabel: 'Account', icon: UserRound },
];

const mobileMemberNav = [
  { href: '/home', shortLabel: 'Home', icon: Wallet },
  { href: '/products', shortLabel: 'Products', icon: ShoppingBag },
  { href: '/referral', shortLabel: 'Team', icon: UsersRound },
  { href: '/account', shortLabel: 'Me', icon: UserRound },
];

function MemberFrame({ active, children }: { active: string; children: ReactNode }) {
  const { user, status, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [showMemberNotice, setShowMemberNotice] = useState(consumeMemberNotice);
  const activePage = memberNav.find((item) => item.href === active);
  const isOverview = false;
  const isHome = active === '/home';
  const isReferral = active === '/referral';
  const isProducts = active === '/products';
  const isAccount = active === '/account';
  const isWithdrawalHistory = active === '/withdrawal-history';
  const activeNavPath = isWithdrawalHistory ? '/account' : active;
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
    const pageTitle = `${activePage?.label ?? 'Member portal'} — samsung`;
    document.title = pageTitle;
    const description = 'Member account portal for samsung, an independent retailer. Product sale prices are shown in UGX; checkout, rewards, and referral tracking are not active.';
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
        <main className={`shop-grain min-h-[100dvh] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:py-7 sm:pb-28 ${isWithdrawalHistory ? 'withdrawal-history-shell' : isHome ? 'home-shell' : isReferral ? 'referral-shell' : isProducts ? 'products-shell' : isAccount ? 'account-shell' : 'shop-shell'}`}>
          <div className="member-frame relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-[1240px] flex-col sm:min-h-[calc(100dvh-3.5rem)]">
            {!isWithdrawalHistory && <>
            <header className={`${isHome ? 'home-member-header ' : ''}flex flex-wrap items-center justify-between gap-x-4 gap-y-4 border-b pb-4 sm:pb-5 ${isProducts ? 'border-[#9bbfce]' : 'border-[#d8d4c7]'}`}>
               <Link href="/overview" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd0a0]" aria-label="samsung overview"><Brand small inverse={isOverview || isAccount} /></Link>
              <div className="flex items-center gap-3">
                    <span className="hidden max-w-[180px] truncate text-[12px] text-[#68756a] sm:inline">{user.phoneNumber}</span>
                  <button type="button" onClick={handleSignOut} disabled={signingOut} className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60 ${isOverview ? 'border-white/15 bg-white/[.06] text-white/80 hover:border-white/35 hover:bg-white/10 focus-visible:ring-[#6dd0a0]' : isProducts ? 'border-[#9fb9c5] bg-white/60 text-[#405c6a] hover:border-[#547f92] hover:text-[#183b50] focus-visible:ring-[#547f92]' : 'border-[#c9cbbb] bg-[#fffdf7]/80 text-[#34513f] hover:border-[#315f49] hover:text-[#315f49] focus-visible:ring-[#315f49]'}`} data-testid="button-sign-out">{signingOut ? 'Signing out…' : 'Sign out'}</button>
              </div>
              <nav className={`member-nav order-3 hidden w-full gap-1 overflow-x-auto border-t pt-3 md:order-none md:flex md:w-auto md:border-0 md:pt-0 ${isOverview ? 'border-white/10' : 'border-[#e4e0d4]'}`} aria-label="Member navigation">
                 {memberNav.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} aria-current={activeNavPath === href ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] sm:px-3.5 ${isOverview ? (activeNavPath === href ? 'bg-[#38bdf8] text-[#082f49]' : 'text-white/60 hover:bg-white/10 hover:text-white') : isProducts ? (activeNavPath === href ? 'bg-[#38bdf8] text-[#082f49]' : 'text-[#476675] hover:bg-white/50 hover:text-[#173448]') : (activeNavPath === href ? 'bg-[#38bdf8] text-[#082f49]' : 'text-[#617166] hover:bg-[#e9eadf] hover:text-[#294637]')}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" /><span>{label}</span>
                  </Link>
                ))}
             </nav>
             {signOutError && <p className="w-full text-right text-[11px] text-red-500" role="alert">{signOutError}</p>}
            </header>
            </>}
            <div className={`flex-1 ${isWithdrawalHistory ? 'withdrawal-history-main' : isOverview ? 'py-5 sm:py-8' : 'py-7 sm:py-10'}`}>
              {!isOverview && !isReferral && !isWithdrawalHistory && <div className="mb-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">samsung</p>
                <h1 className="mt-2 font-[Syne] text-[32px] font-bold leading-tight tracking-[-.06em] text-[#243b31] sm:text-[42px]">{activePage?.label}</h1>
              </div>}
              {children}
            </div>
            {!isOverview && !isWithdrawalHistory && <footer className={`border-t py-4 text-[11px] leading-5 ${isReferral ? 'border-[#e1e4e6] text-[#788087]' : isProducts ? 'border-[#9bbfce] text-[#547181]' : 'border-[#d8d4c7] text-[#758078]'}`}>
              Independent retailer · Not affiliated with Samsung · Rewards, referral tracking, and checkout are not active.
            </footer>}
          </div>
          {!isWithdrawalHistory &&
          <nav className={`member-bottom-nav liquid-bottom-nav fixed left-1/2 z-50 grid -translate-x-1/2 grid-cols-4 gap-1 p-2 backdrop-blur-xl md:hidden ${isProducts ? 'products-bottom-nav' : isHome ? 'home-bottom-nav' : 'bottom-3 w-[min(calc(100%-1.5rem),620px)] rounded-[22px] border border-white/10 bg-[#12171d]/95 shadow-[0_14px_44px_rgba(0,0,0,.45)]'}`} aria-label="Member navigation">
            {mobileMemberNav.map(({ href, shortLabel, icon: Icon }) => (
              <Link key={href} href={href} aria-current={activeNavPath === href ? 'page' : undefined} data-testid={`link-mobile-nav-${shortLabel.toLowerCase()}`} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${isProducts ? (activeNavPath === href ? 'text-[#075985]' : 'text-[#304d5c]/70 hover:bg-white/30 hover:text-[#142438]') : isHome ? (activeNavPath === href ? 'text-[#075985]' : 'text-[#566174] hover:bg-white') : (activeNavPath === href ? 'text-[#7dd3fc]' : 'text-white/55 hover:bg-white/[.06] hover:text-white')}`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${activeNavPath === href ? 'bg-[#38bdf8] text-[#082f49]' : 'bg-transparent'}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                <span className="max-w-full truncate text-[9px] font-semibold leading-none">{shortLabel}</span>
              </Link>
            ))}
          </nav>
          }
        </main>
        {showMemberNotice && (
          <div className="member-notice-overlay">
            <section className="member-notice-dialog" role="dialog" aria-modal="true" aria-labelledby="member-notice-title">
              <div className="member-notice-banner">
                <span className="member-notice-word">MEMBER<br />UPDATE</span>
                <Brand small />
              </div>
              <div className="member-notice-content">
                <p className="member-notice-eyebrow">samsung</p>
                <h2 id="member-notice-title">Welcome to your account</h2>
                <p className="member-notice-intro">Important information about current products and account services:</p>
                <ul>
                  <li>Catalog prices are shown in UGX. Exact product models and stock still need confirmation.</li>
                  <li>Product checkout, deposits, and withdrawals are not enabled yet.</li>
                  <li>No daily earnings or welcome cash bonus are active. This site does not offer guaranteed investment returns.</li>
                  <li>Referral rates are displayed as 35% / 2% / 1%; referral rewards are not active until their terms are confirmed.</li>
                </ul>
                <a
                  href="https://t.me/+pvicn7-rhzg2NGNh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="member-notice-telegram"
                  data-testid="link-telegram-group"
                >
                  Join Telegram group <ArrowRight aria-hidden="true" />
                </a>
                <button type="button" onClick={() => setShowMemberNotice(false)} className="member-notice-dismiss">OK</button>
              </div>
            </section>
          </div>
        )}
    </>
  );
}

function HomePage() {
  const { user } = useAuth();
  const homeActions = [
    { label: 'Recharge', icon: Download, href: '/recharge' },
    { label: 'Withdrawal', icon: CreditCard, href: '/withdrawal' },
    { label: 'Customer service', icon: Headphones, href: customerServiceUrl },
    { label: 'Presence', icon: CalendarDays, href: '/presence' },
  ];
  const homeBalances = [
    {
      label: 'Pay',
      value: `UGX ${user?.walletBalanceUgx.toLocaleString('en-UG') ?? '—'}`,
      image: `${basePath}/samsung-s26-ultra.jpg`,
      className: 'home-balance-tile-primary',
    },
    {
      label: 'Cumulative',
      value: `UGX ${user?.totalAccumulatedUgx.toLocaleString('en-UG') ?? '—'}`,
      image: `${basePath}/samsung-fold8-banner.jpg`,
      className: '',
    },
    {
      label: 'Withdrawal',
      value: 'UGX —',
      image: `${basePath}/samsung-s26-ultra-banner.jpeg`,
      className: '',
    },
  ];
  return <MemberFrame active="/home">
    <section className="home-dashboard mx-auto max-w-[760px]" data-testid="page-home">
      <section className="home-top-hero" aria-label="Featured Samsung devices">
        <img src={`${basePath}/samsung-home-flip.jpg`} alt="Samsung Galaxy Z Flip smartphone" fetchPriority="high" />
        <div className="home-top-hero-copy">
          <p>Samsung Galaxy</p>
          <h1>Explore Galaxy devices</h1>
          <span>Samsung products · prices in UGX</span>
        </div>
        <Link href="/products" className="home-top-hero-button">Buy</Link>
      </section>

      <div className="home-money-actions" aria-label="Account shortcuts">
        {homeActions.map(({ label, icon: Icon, href }) => (
          href
            ? href.startsWith('https://')
              ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon aria-hidden="true" /><span>{label}</span>
                </a>
              : <Link key={label} href={href} aria-label={label}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </Link>
            : <button key={label} type="button" disabled aria-label={`${label}: unavailable`}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </button>
        ))}
      </div>

      <article className="home-task-banner" data-testid="card-home-task-center">
        <img className="home-task-photo" src={`${basePath}/samsung-referral-banner.jpg`} alt="" aria-hidden="true" loading="lazy" />
        <div className="home-task-copy">
          <h2>Task Center</h2>
          <p>View the current task information.</p>
          <Link href="/tasks" className="home-task-cta">Go</Link>
        </div>
      </article>

      <div className="home-activity-strip" role="status" aria-label="Wallet activity">
        <History aria-hidden="true" />
        <span>No wallet transactions are recorded yet.</span>
      </div>

      <section className="home-balance-tiles" aria-label="Account balance summary">
        {homeBalances.map((balance) => (
          <article className={`home-balance-tile ${balance.className}`} key={balance.label} data-testid={`card-home-balance-${balance.label.toLowerCase()}`}>
            <img src={balance.image} alt="" aria-hidden="true" loading="lazy" />
            <div className="home-balance-tile-copy">
              <strong>{balance.value}</strong>
              <span>{balance.label}</span>
            </div>
          </article>
        ))}
      </section>
      <p className="home-retailer-note">Independent gadget retailer · Not Samsung’s official store</p>
    </section>
  </MemberFrame>;
}

function PresencePage() {
  const { user, status } = useAuth();
  const [presence, setPresence] = useState<{ totalUgx: number; days: number; claimedToday: boolean; enabled: boolean; rewardUgx: number } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [presenceMessage, setPresenceMessage] = useState('');
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Presence — samsung';
    return () => { document.title = previousTitle; };
  }, []);
  useEffect(() => {
    if (!user) return;
    fetch('/api/presence', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load presence.');
        setPresence(await response.json());
      })
      .catch(() => setPresenceMessage('Presence could not be loaded.'));
  }, [user]);

  const claimPresence = async () => {
    if (claiming || presence?.claimedToday) return;
    setClaiming(true);
    setPresenceMessage('');
    try {
      const response = await fetch('/api/presence/claim', { method: 'POST', credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not record presence.');
      setPresence(result);
      setPresenceMessage(result.wasNewClaim
        ? `UGX ${result.rewardUgx.toLocaleString()} added to your wallet. Come back after midnight to claim again.`
        : 'You have already claimed today’s bonus.');
    } catch {
      setPresenceMessage('Presence could not be recorded. Try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (status === 'loading') return <main className="presence-page" role="status">Checking your account…</main>;
  if (status === 'error') return <main className="presence-page"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;

  return <main className="presence-page" data-testid="page-presence">
    <header className="presence-header">
      <Link href="/home" aria-label="Back to Home"><ArrowLeft aria-hidden="true" /></Link>
      <h1>Presence</h1>
    </header>
    <img className="presence-hero-image" src={samsungPresenceImage} alt="Samsung Galaxy phone, watch, and earbuds" />
    <section className="presence-summary">
      <div className="presence-reward">
        <strong>UGX {presence?.rewardUgx.toLocaleString() ?? '500'}</strong>
        <span>Daily Bonus</span>
      </div>
      <div className="presence-stats">
        <div><strong>{presence ? `UGX ${presence.totalUgx.toLocaleString()}` : 'UGX —'}</strong><span>Cumulative bonus</span></div>
        <div><strong>{presence?.days ?? '—'}</strong><span>Days of attendance</span></div>
      </div>
      <button type="button" disabled={!presence || !presence.enabled || presence.claimedToday || claiming} onClick={claimPresence} aria-describedby="presence-unavailable" data-testid="button-presence-point">
        {claiming ? 'Claiming…' : presence?.claimedToday ? 'Claimed today' : 'Claim daily bonus'}
      </button>
      <p id="presence-unavailable" className="presence-unavailable" role="status">{presenceMessage || (presence?.claimedToday ? 'You have claimed today’s bonus. Claim again after midnight (Kampala time).' : presence && !presence.enabled ? 'Daily bonus is not active yet.' : 'Claim once per day; it is never credited automatically.')}</p>
      <ol>
        <li>Daily presence reward: {presence?.rewardUgx.toLocaleString() ?? '500'} UGX.</li>
        <li>Tap “Claim daily bonus” to receive it.</li>
        <li>One claim is allowed per calendar day in Kampala time.</li>
      </ol>
    </section>
  </main>;
}

function TaskCenterPage() {
  const { user, status } = useAuth();
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [tasksStatus, setTasksStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [depositMilestones, setDepositMilestones] = useState<{
    teamDepositsUgx: number;
    totalRewardsUgx: number;
    milestones: { id: string; thresholdUgx: number; rewardUgx: number; received: boolean }[];
  } | null>(null);
  const [depositMilestonesStatus, setDepositMilestonesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const levelOneInviteTasks = tasks.filter((task) =>
    task.id.toLowerCase().startsWith('invite-') || /invite.*(?:level\s*1|level\s*one|niveau\s*1)/i.test(task.title),
  );
  const otherTasks = tasks.filter((task) => !levelOneInviteTasks.includes(task));

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Task Center — samsung';
    return () => { document.title = previousTitle; };
  }, []);
  useEffect(() => {
    if (!user) return;
    fetch('/api/task-center', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load tasks.');
        const data = await response.json() as { tasks: TaskDefinition[] };
        setTasks(data.tasks);
        setTasksStatus('ready');
      })
      .catch(() => setTasksStatus('error'));
    fetch('/api/team-deposit-milestones', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load deposit milestones.');
        setDepositMilestones(await response.json());
        setDepositMilestonesStatus('ready');
      })
      .catch(() => setDepositMilestonesStatus('error'));
  }, [user]);

  if (status === 'loading') {
    return <main className="task-center-shell" role="status">Checking your account…</main>;
  }
  if (status === 'error') {
    return <main className="task-center-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  }
  if (!user) return <Redirect to="/sign-in" />;

  return <main className="task-center-shell" data-testid="page-task-center">
    <header className="task-center-header">
      <Link href="/home" aria-label="Back to Home"><ArrowLeft aria-hidden="true" /></Link>
      <h1>Task Center</h1>
    </header>
    <section className="task-center-hero">
      <img src={`${basePath}/samsung-s26-ultra.jpg`} alt="Samsung Galaxy device" fetchPriority="high" />
      <div className="task-center-hero-copy">
        <strong>UGX {money.format(depositMilestones?.totalRewardsUgx ?? 0)}</strong>
        <span>Task Center rewards accumulated</span>
      </div>
    </section>
    <section className="task-center-list" aria-label="Tasks">
      {tasksStatus === 'loading' && <p className="task-center-message">Loading tasks…</p>}
      {tasksStatus === 'error' && <p className="task-center-message" role="alert">Tasks could not be loaded. Please try again later.</p>}
      {levelOneInviteTasks.map((task) => (
        <article className="task-center-item" key={task.id}>
          <h2>
            {task.title}
            {task.rewardUgx !== null && ` · UGX ${money.format(task.rewardUgx)}`}
          </h2>
          <div className="task-center-progress">
            <div><strong>—</strong><span>Current</span></div>
            <div><strong>{task.objective.toLocaleString()} {task.objectiveUnit}</strong><span>Objective</span></div>
            <div><strong>—</strong><span>Progress</span></div>
          </div>
          <button type="button" disabled>{task.enabled ? 'Progress unavailable' : 'Not active'}</button>
        </article>
      ))}
      {depositMilestonesStatus === 'loading' && <p className="task-center-message">Loading deposit milestones…</p>}
      {depositMilestonesStatus === 'error' && <p className="task-center-message" role="alert">Deposit milestones could not be loaded.</p>}
      {depositMilestones?.milestones.map((milestone) => {
        const progress = Math.min(100, Math.floor(depositMilestones.teamDepositsUgx / milestone.thresholdUgx * 100));
        return <article className="task-center-item" key={milestone.id}>
          <h2>Total team deposits (Levels 1–3): UGX {money.format(milestone.thresholdUgx)} · Reward UGX {money.format(milestone.rewardUgx)}</h2>
          <div className="task-center-progress">
            <div><strong>UGX {money.format(depositMilestones.teamDepositsUgx)}</strong><span>Current</span></div>
            <div><strong>UGX {money.format(milestone.thresholdUgx)}</strong><span>Objective</span></div>
            <div><strong>{progress}%</strong><span>Progress</span></div>
          </div>
          <button type="button" disabled>{milestone.received ? 'Received' : 'In progress'}</button>
        </article>;
      })}
      {otherTasks.map((task) => (
        <article className="task-center-item" key={task.id}>
          <h2>
            {task.title}
            {task.rewardUgx !== null && ` · UGX ${money.format(task.rewardUgx)}`}
          </h2>
          <div className="task-center-progress">
            <div><strong>—</strong><span>Current</span></div>
            <div><strong>{task.objective.toLocaleString()} {task.objectiveUnit}</strong><span>Objective</span></div>
            <div><strong>—</strong><span>Progress</span></div>
          </div>
          <button type="button" disabled>{task.enabled ? 'Progress unavailable' : 'Not active'}</button>
        </article>
      ))}
      {tasksStatus === 'ready' && tasks.length === 0 && depositMilestonesStatus === 'ready' && depositMilestones?.milestones.length === 0 && <p className="task-center-message">No tasks have been added yet.</p>}
    </section>
  </main>;
}

function WithdrawalPage() {
  const { user, status: authStatus, refresh } = useAuth();
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fee = Math.round((Number(amount) || 0) * 0.2);
  useEffect(() => {
    fetch('/api/payout-account', { credentials: 'include' }).then(async (response) => {
      const data = await response.json();
      if (response.ok) setPayoutAccount(data.payoutAccount);
    }).catch(() => setPayoutAccount(null));
  }, []);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Withdraw — samsung';
    return () => { document.title = previousTitle; };
  }, []);
  if (authStatus === 'loading') return <main className="withdraw-shell" role="status">Checking your account…</main>;
  if (authStatus === 'error') return <main className="withdraw-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;

  return <main className="withdraw-content" data-testid="page-withdrawal">
      <header className="withdraw-heading"><Link href="/account" aria-label="Back to account"><ArrowLeft /></Link><h1>Withdrawal</h1><Link href="/withdrawal-history" aria-label="Withdrawal history"><History /></Link></header>
      <section className="withdraw-hero">
        <p>UGX {money.format(user?.walletBalanceUgx ?? 0)}</p><span>Available wallet balance</span>
        <img src={`${basePath}/samsung-referral-banner.jpg`} alt="" aria-hidden="true" />
        <label htmlFor="withdraw-amount"><strong>UGX</strong><input id="withdraw-amount" type="number" min="10000" max={user?.walletBalanceUgx ?? 0} step="1" inputMode="numeric" placeholder="Enter the withdrawal amount" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      </section>
      <section className="withdraw-details">
        <h2>Manual payout destination</h2>
        <div className="withdraw-bank-select"><CreditCard /><span>{payoutAccount ? `${payoutAccount.provider.toUpperCase()} Money · ${payoutAccount.holderName} · ${payoutAccount.phoneNumber}` : user?.phoneNumber ?? 'Registered phone number'}</span></div>
        <Link className="payout-destination-link" href="/bank-accounts">{payoutAccount ? 'Change payout destination' : 'Add Airtel or MTN payout number'}</Link>
        <p className="withdraw-estimate">You receive: <strong>UGX {money.format(Math.max(0, Number(amount || 0) - fee))}</strong> · fee: UGX {money.format(fee)}</p>
        <button className="withdraw-confirm" type="button" disabled={submitting || !Number.isSafeInteger(Number(amount)) || Number(amount) < 10000 || Number(amount) > (user?.walletBalanceUgx ?? 0)} onClick={async () => {
          setSubmitting(true); setError(''); setMessage('');
          try {
            const response = await fetch('/api/withdrawals', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountUgx: Number(amount) }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? 'Could not submit the withdrawal request.');
            setMessage('Request submitted. An admin will pay it manually to the destination shown above.');
            setAmount('');
            await refresh().catch(() => undefined);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not submit the withdrawal request.');
          } finally {
            setSubmitting(false);
          }
        }}>{submitting ? 'Submitting…' : 'Request withdrawal'}</button>
        {message && <p role="status">{message} <Link href="/withdrawal-history">View history</Link></p>}
        {error && <p role="alert">{error}</p>}
        <ol className="withdraw-terms">
          <li>The minimum withdrawal amount is UGX 10,000.</li>
          <li>A 20% fee is deducted; the amount shown above is the amount you will receive.</li>
          <li>Your request is paid manually by an administrator. The requested amount is reserved from your wallet while pending.</li>
          <li>If a request cannot be paid, it is marked failed and the full requested amount is returned to your wallet.</li>
        </ol>
      </section>
    </main>;
}

function BankAccountsPage() {
  const { user, status } = useAuth();
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/payout-account', { credentials: 'include' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load payout account.');
      setPayoutAccount(data.payoutAccount);
    }).catch(() => setPayoutAccount(null)).finally(() => setLoading(false));
  }, []);
  if (status === 'loading') return <main className="withdraw-shell" role="status">Checking your account…</main>;
  if (status === 'error') return <main className="withdraw-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;
  return <main className="bank-list-page" data-testid="page-bank-accounts">
      <header className="withdraw-heading"><Link href="/withdrawal" aria-label="Back to withdrawal"><ArrowLeft /></Link><h1>List of bank accounts</h1></header>
      {loading ? <p className="bank-payout-summary">Loading payout destination…</p> : payoutAccount ? <article className="bank-payout-summary">
        <strong>{payoutAccount.provider.toUpperCase()} Money</strong>
        <span>{payoutAccount.holderName}</span><span>{payoutAccount.phoneNumber}</span>
      </article> : <p className="bank-payout-summary">No mobile-money payout destination saved.</p>}
      <Link className="bank-add-button" href="/link-bank-card">{payoutAccount ? 'Update' : 'Add'}</Link>
    </main>;
}

function LinkBankCardPage() {
  const { user, status } = useAuth();
  const [, navigate] = useLocation();
  const [provider, setProvider] = useState<'airtel' | 'mtn'>('airtel');
  const [holderName, setHolderName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/payout-account', { credentials: 'include' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.payoutAccount) return;
      setProvider(data.payoutAccount.provider);
      setHolderName(data.payoutAccount.holderName);
      setPhoneNumber(data.payoutAccount.phoneNumber);
    });
  }, []);
  if (status === 'loading') return <main className="withdraw-shell" role="status">Checking your account…</main>;
  if (status === 'error') return <main className="withdraw-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;
  return <main className="bank-link-page" data-testid="page-link-bank-card">
      <header className="withdraw-heading"><Link href="/bank-accounts" aria-label="Back to bank accounts"><ArrowLeft /></Link><h1>Link a bank card</h1></header>
      <img className="bank-device-image" src={`${basePath}/samsung-fold8-banner.jpg`} alt="Samsung Galaxy Z Fold8" />
      <form className="bank-link-form" onSubmit={async (event) => {
        event.preventDefault(); setSaving(true); setError('');
        try {
          const response = await fetch('/api/payout-account', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, holderName, phoneNumber }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'Could not save payout account.');
          navigate('/bank-accounts');
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save payout account.'); }
        finally { setSaving(false); }
      }}>
        <label htmlFor="bank-name">* Select the bank</label>
        <select id="bank-name" value={provider} onChange={(event) => setProvider(event.target.value as 'airtel' | 'mtn')}>
          <option value="airtel">Airtel</option>
          <option value="mtn">MTN</option>
        </select>
        <label htmlFor="bank-holder">* Name of the holder</label>
        <input id="bank-holder" required minLength={2} maxLength={100} value={holderName} onChange={(event) => setHolderName(event.target.value)} placeholder="Please enter the name of the account holder" />
        <label htmlFor="bank-account">* Bank account</label>
        <input id="bank-account" required type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="e.g. 07XX XXX XXX" />
         <button type="submit" disabled={saving} aria-busy={saving}>{saving ? 'Saving…' : 'Confirm'}</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>;
}

function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<Array<{ id: string; amountUgx: number; feeUgx: number; receivedUgx: number; payoutPhone: string; payoutProvider: 'airtel' | 'mtn' | 'registered'; payoutHolderName: string | null; status: 'pending' | 'paid' | 'failed'; createdAt: string; processedAt: string | null; resolutionNote: string | null }>>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/withdrawals', { credentials: 'include' }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Could not load withdrawal history.');
        if (active) { setWithdrawals(data.withdrawals); setState('ready'); }
      }).catch(() => { if (active) setState('error'); });
    void load();
    const interval = window.setInterval(load, 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  return <MemberFrame active="/withdrawal-history">
    <main className="withdraw-content withdrawal-history-page" data-testid="page-withdrawal-history">
      <header className="withdraw-heading"><Link href="/account" aria-label="Back to account"><ArrowLeft aria-hidden="true" /></Link><h1>Withdrawal history</h1></header>
      {state === 'loading' && <section className="withdraw-history-empty" role="status"><p>Loading withdrawal history…</p></section>}
      {state === 'error' && <section className="withdraw-history-empty" role="alert"><p>Could not load withdrawal history. Refresh and try again.</p></section>}
      {state === 'ready' && withdrawals.length === 0 && <section className="withdraw-history-empty"><h2>No withdrawal history</h2><p>Your manual withdrawal requests will appear here.</p></section>}
      {state === 'ready' && withdrawals.map((withdrawal) => <article className="withdraw-history-item" key={withdrawal.id}>
        <div className="withdraw-history-title"><span>{withdrawal.id.slice(0, 18).toUpperCase()}</span><strong className={`withdraw-status-${withdrawal.status}`}>{withdrawal.status === 'paid' ? 'Successful' : withdrawal.status === 'failed' ? 'Failed' : 'Pending'}</strong></div>
        <p>Amount <span>: UGX {money.format(withdrawal.amountUgx)}</span></p>
        <p>Received <span>: UGX {money.format(withdrawal.receivedUgx)}</span></p>
        <p>Date <span>: {new Date(withdrawal.createdAt).toLocaleString()}</span></p>
        {withdrawal.resolutionNote && <small>{withdrawal.resolutionNote}</small>}
      </article>)}
    </main>
  </MemberFrame>;
}

function RechargePage() {
  const { user, status } = useAuth();
  const amounts = [...new Set(productCatalog.map((product) => product.price))];
  const [amount, setAmount] = useState(String(amounts[0]));
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Recharge — samsung';
    return () => { document.title = previousTitle; };
  }, []);
  if (status === 'loading') return <main className="recharge-shell" role="status">Checking your account…</main>;
  if (status === 'error') return <main className="recharge-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;

  return <main className="recharge-content" data-testid="page-recharge">
      <header className="withdraw-heading">
        <Link href="/account" aria-label="Back to account"><ArrowLeft /></Link>
        <h1>Recharge</h1>
        <Link href="/recharge-history" aria-label="Top-up history"><History /></Link>
      </header>
      <section className="recharge-amount-card">
        <span>Top-up amount</span>
        <label htmlFor="recharge-amount">UGX</label>
        <input id="recharge-amount" type="number" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <img src={`${basePath}/samsung-s26-ultra.jpg`} alt="" aria-hidden="true" />
      </section>
      <section className="recharge-presets">
        <h2>Quickly select the amount</h2>
        <div>{amounts.map((preset) => <button type="button" key={preset} aria-pressed={amount === String(preset)} onClick={() => setAmount(String(preset))}>{money.format(preset)}</button>)}</div>
      </section>
      <section className="recharge-channel">
        <Link className="recharge-confirm" href={`/recharge/payment?amount=${encodeURIComponent(amount)}`} data-testid="link-recharge-confirm">Confirm</Link>
        <p className="recharge-support">If the top-up hasn’t been credited for a long time, please <a href={customerServiceUrl} target="_blank" rel="noopener noreferrer">click here</a>.</p>
        <ol className="recharge-terms">
          <li>The minimum top-up amount is 2,000 UGX; amounts below this threshold cannot be credited to your account.</li>
          <li>The order amount must match the actual payment amount.</li>
          <li>Please ensure you use the most up-to-date bank details for each top-up; do not use outdated information.</li>
          <li>Once the transfer is initiated, please allow 10 to 60 minutes for processing. If the funds have not arrived after this time, please enter your payment details on the top-up page or contact <a href={customerServiceUrl} target="_blank" rel="noopener noreferrer">customer service</a> for assistance.</li>
        </ol>
      </section>
    </main>;
}

function RechargePaymentPage() {
  const { user, status } = useAuth();
  const [phone, setPhone] = useState('');
  const [requestId, setRequestId] = useState('');
  const [requestError, setRequestError] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);
  const amount = Number(new URLSearchParams(window.location.search).get('amount'));
  const validPhone = /^(?:\+256|0)?7\d{8}$/.test(phone.replace(/[\s().-]/g, ''));
  const createRechargeRequest = async () => {
    setCreatingRequest(true);
    setRequestError('');
    try {
      const response = await fetch('/api/recharge-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not create recharge request.');
      setRequestId(data.requestId as string);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Could not create recharge request.');
    } finally {
      setCreatingRequest(false);
    }
  };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Payment — samsung';
    return () => { document.title = previousTitle; };
  }, []);

  if (status === 'loading') return <main className="recharge-shell" role="status">Checking your account…</main>;
  if (status === 'error') return <main className="recharge-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;
  if (!Number.isFinite(amount) || amount < 2000) return <Redirect to="/recharge" />;

  return <main className="recharge-payment-page" data-testid="page-recharge-payment">
    <header className="recharge-payment-header">
      <span>samsung</span>
      <Link href="/recharge" aria-label="Close payment page">×</Link>
    </header>
    <section className="recharge-payment-amount" aria-label="Amount to pay">
      <span>AMOUNT TO PAY</span>
      <strong>UGX {money.format(amount)}</strong>
    </section>
    <section className="recharge-payment-form">
      <label htmlFor="recharge-mobile-number">Mobile money number (MTN or Airtel)</label>
      <input
        id="recharge-mobile-number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="Enter mobile money number"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        data-testid="input-recharge-mobile-number"
      />
      <p className="recharge-payment-warning">Check the mobile money number before continuing.</p>
      <button type="button" disabled={!validPhone || creatingRequest || Boolean(requestId)} onClick={createRechargeRequest} data-testid="button-recharge-payment-continue">{creatingRequest ? 'Please wait…' : 'Continue'}</button>
      {requestError && <p role="alert">{requestError}</p>}
      {requestId && <section className="recharge-manual-instructions" aria-live="polite" data-testid="recharge-manual-instructions">
        <h2>Manual Airtel Money transfer</h2>
        <p>Recharge request pending verification.</p>
        <p>Amount: <strong>UGX {money.format(amount)}</strong></p>
        <p>Send to: <strong>0743240195</strong></p>
        <p>Account name: <strong>Nakaliba Martha</strong></p>
        <p>Reference: <strong>{requestId.slice(0, 8).toUpperCase()}</strong></p>
        <p>After sending, contact customer service for verification. This page does not confirm payment or add funds automatically.</p>
      </section>}
    </section>
  </main>;
}

function RechargeHistoryPage() {
  const { user, status } = useAuth();
  if (status === 'loading') return <main className="recharge-shell" role="status">Checking your account…</main>;
  if (status === 'error') return <main className="recharge-shell"><p>We couldn’t check your account right now.</p><Link href="/sign-in">Try signing in</Link></main>;
  if (!user) return <Redirect to="/sign-in" />;
  return <main className="recharge-content recharge-history-page" data-testid="page-recharge-history">
      <header className="withdraw-heading"><Link href="/recharge" aria-label="Back to recharge"><ArrowLeft /></Link><h1>Top-up history</h1></header>
      <section className="recharge-history-empty">More data</section>
    </main>;
}

function AdminTaskCenterPage() {
  const [activeSection, setActiveSection] = useState<AdminSectionId>('dashboard');
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<Array<{ id: string; amountUgx: number; payerPhone: string; status: string; createdAt: string; memberPhone: string }>>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<Array<{ id: string; amountUgx: number; feeUgx: number; receivedUgx: number; payoutPhone: string; payoutProvider: 'airtel' | 'mtn' | 'registered'; payoutHolderName: string | null; status: 'pending' | 'paid' | 'failed'; createdAt: string; processedAt: string | null; resolutionNote: string | null; memberPhone: string }>>([]);
  const [withdrawalStatus, setWithdrawalStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [overview, setOverview] = useState<{ totalUsers: number; referredUsers: number; financialRecordsAvailable: boolean } | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; phoneNumber: string; createdAt: string; referralCode: string | null; referredByAccountId: string | null; isActive: boolean }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: number; action: string; performedByPhone: string; targetPhone: string | null; amountUgx: number | null; reason: string | null; details: string | null; createdAt: string }>>([]);
  const [adminProducts, setAdminProducts] = useState<AdminCatalogItem[]>([]);
  const [productStatus, setProductStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [savingProducts, setSavingProducts] = useState(false);
  const [productMessage, setProductMessage] = useState('');
  const [admins, setAdmins] = useState<Array<{ id: string; phoneNumber: string; createdAt: string }>>([]);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [directoryStatus, setDirectoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [directoryMessage, setDirectoryMessage] = useState('');
  const [directoryRequiresSignIn, setDirectoryRequiresSignIn] = useState(false);
  const [rechargeStatus, setRechargeStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const loadTasks = () => {
    setStatus('loading');
    fetch('/api/admin/task-center', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Could not load Task Center settings.');
        setTasks((data as { tasks: TaskDefinition[] }).tasks);
        setStatus('ready');
        setMessage('');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Could not load Task Center settings.');
      });
  };
  useEffect(() => { loadTasks(); }, []);
  const loadAdminDirectory = () => {
    setDirectoryStatus('loading');
    setDirectoryMessage('');
    setDirectoryRequiresSignIn(false);
    Promise.all([
      fetch('/api/admin/overview', { credentials: 'include' }),
      fetch('/api/admin/members', { credentials: 'include' }),
      fetch('/api/admin/admins', { credentials: 'include' }),
      fetch('/api/admin/audit-logs', { credentials: 'include' }),
    ])
      .then(async ([overviewResponse, membersResponse, adminsResponse, auditResponse]) => {
        const [overviewData, membersData, adminsData, auditData] = await Promise.all([
          overviewResponse.json(),
          membersResponse.json(),
          adminsResponse.json(),
          auditResponse.json(),
        ]);
        const failedResponse = [overviewResponse, membersResponse, adminsResponse, auditResponse].find((response) => !response.ok);
        if (failedResponse) {
          if (failedResponse.status === 401) {
            setDirectoryRequiresSignIn(true);
            throw new Error('Sign in with the configured admin account to access this panel.');
          }
          if (failedResponse.status === 403) {
            throw new Error('This signed-in account is not an administrator. Sign out and use the root admin account.');
          }
          const failedData = [overviewData, membersData, adminsData, auditData][
            [overviewResponse, membersResponse, adminsResponse, auditResponse].indexOf(failedResponse)
          ] as { error?: string };
          throw new Error(failedData.error ?? 'Could not load the admin dashboard. Try again.');
        }
        setOverview(overviewData);
        setMembers(membersData.members);
        setAdmins(adminsData.admins);
        setAuditLogs(auditData.logs);
        setDirectoryStatus('ready');
      })
      .catch((error: unknown) => {
        setDirectoryMessage(error instanceof Error ? error.message : 'Could not load the admin dashboard. Try again.');
        setDirectoryStatus('error');
      });
  };
  useEffect(() => { loadAdminDirectory(); }, []);
  const loadAdminProducts = () => {
    setProductStatus('loading');
    fetch('/api/admin/products', { credentials: 'include' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load products.');
      setAdminProducts(data.products);
      setProductStatus('ready');
    }).catch(() => setProductStatus('error'));
  };
  useEffect(() => { loadAdminProducts(); }, []);
  const loadRechargeRequests = () => {
    setRechargeStatus('loading');
    fetch('/api/admin/recharge-requests', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Could not load recharge requests.');
        setRechargeRequests(data.requests as typeof rechargeRequests);
        setRechargeStatus('ready');
      })
      .catch(() => setRechargeStatus('error'));
  };
  useEffect(() => { loadRechargeRequests(); }, []);
  const loadWithdrawalRequests = () => {
    setWithdrawalStatus('loading');
    fetch('/api/admin/withdrawals', { credentials: 'include' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load withdrawals.');
      setWithdrawalRequests(data.withdrawals);
      setWithdrawalStatus('ready');
    }).catch(() => setWithdrawalStatus('error'));
  };
  useEffect(() => {
    loadWithdrawalRequests();
    const interval = window.setInterval(loadWithdrawalRequests, 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const processWithdrawal = async (request: (typeof withdrawalRequests)[number], nextStatus: 'paid' | 'failed') => {
    if (nextStatus === 'paid' && !window.confirm(`Confirm that UGX ${money.format(request.receivedUgx)} was sent manually to ${request.payoutProvider.toUpperCase()} ${request.payoutPhone}?`)) return;
    const resolutionNote = nextStatus === 'paid'
      ? 'Manual payment confirmed by admin.'
      : window.prompt('Why could this withdrawal not be paid?');
    if (!resolutionNote?.trim()) return;
    try {
      const response = await fetch(`/api/admin/withdrawals/${encodeURIComponent(request.id)}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, resolutionNote: resolutionNote.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not process withdrawal.');
      loadWithdrawalRequests();
      loadAdminDirectory();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not process withdrawal.');
    }
  };
  const verifyRecharge = async (id: string) => {
    const response = await fetch(`/api/admin/recharge-requests/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) loadRechargeRequests();
  };
  const addAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setAddingAdmin(true);
    setAdminMessage('');
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: adminPhone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not add administrator.');
      setAdmins((current) => [data, ...current]);
      setAdminPhone('');
      setAdminMessage('Administrator access granted.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Could not add administrator.');
    } finally {
      setAddingAdmin(false);
    }
  };
  const manageMember = async (member: (typeof members)[number], action: 'password' | 'status') => {
    if (action === 'password') {
      if (!window.confirm(`Reset the password for ${member.phoneNumber}? Existing sessions will be signed out.`)) return;
      const response = await fetch(`/api/admin/members/${member.id}/password-reset`, { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (!response.ok) { window.alert(data.error ?? 'Could not reset password.'); return; }
      window.alert(`Temporary password for ${member.phoneNumber} (shown once):\n\n${data.temporaryPassword}\n\nShare it with the member securely.`);
    } else if (action === 'status') {
      const isActive = !member.isActive;
      if (isActive === false && !window.confirm(`Deactivate ${member.phoneNumber}? They will be signed out and unable to log in.`)) return;
      const reason = window.prompt(`Reason for ${isActive ? 'activating' : 'deactivating'} ${member.phoneNumber}:`);
      if (!reason?.trim()) return;
      const response = await fetch(`/api/admin/members/${member.id}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive, reason }),
      });
      const data = await response.json();
      if (!response.ok) { window.alert(data.error ?? 'Could not change account status.'); return; }
    }
    loadAdminDirectory();
  };
  const adjustMemberWallet = async (member: (typeof members)[number], direction: 'credit' | 'debit') => {
      const amountInput = window.prompt(`Amount in whole UGX to ${direction} ${member.phoneNumber}:`);
      if (amountInput === null) return;
      const amountUgx = Number(amountInput.trim());
      if (!Number.isSafeInteger(amountUgx) || amountUgx <= 0 || amountUgx > 100_000_000) {
        window.alert('Enter a whole-UGX amount from 1 to 100,000,000.');
        return;
      }
      const reason = window.prompt(`Reason for this ${direction} to ${member.phoneNumber}'s wallet:`)?.trim();
      if (!reason || reason.length < 3) {
        window.alert('Enter a reason of at least 3 characters.');
        return;
      }
      if (!window.confirm(`${direction === 'credit' ? 'Credit' : 'Debit'} UGX ${money.format(amountUgx)} ${direction === 'credit' ? 'to' : 'from'} ${member.phoneNumber}'s available wallet? This will be recorded in the admin audit log and will not change earnings or deposit totals.`)) return;
      try {
      const response = await fetch(`/api/admin/members/${member.id}/wallet-adjustments`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, amountUgx, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not adjust wallet.');
      window.alert(`Wallet balance updated to UGX ${money.format(data.walletBalanceUgx)}.`);
      loadAdminDirectory();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not adjust wallet.');
    }
  };
  const changeTask = (id: string, changes: Partial<TaskDefinition>) =>
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...changes } : task));
  const changeProduct = (id: string, changes: Partial<AdminCatalogItem>) =>
    setAdminProducts((current) => current.map((product) => product.id === id ? { ...product, ...changes } : product));
  const saveProducts = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProducts(true);
    setProductMessage('');
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: adminProducts }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not save products.');
      setAdminProducts(data.products);
      setProductMessage('Product catalog saved.');
      loadAdminDirectory();
    } catch (error) {
      setProductMessage(error instanceof Error ? error.message : 'Could not save products.');
    } finally {
      setSavingProducts(false);
    }
  };
  const saveTasks = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/task-center', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not save Task Center settings.');
      setTasks((data as { tasks: TaskDefinition[] }).tasks);
      setMessage('Task Center settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save Task Center settings.');
    } finally {
      setSaving(false);
    }
  };
  return <main className="admin-task-page">
    <header className="admin-dashboard-header">
      <Link href="/home" className="admin-dashboard-brand"><Brand small /><span><strong>Samsung</strong><small>ADMIN</small></span></Link>
      <span className="admin-live-badge"><i />Live</span>
       <button type="button" className="admin-refresh-button" aria-label="Refresh admin data" onClick={() => { loadAdminDirectory(); loadAdminProducts(); loadRechargeRequests(); loadWithdrawalRequests(); loadTasks(); }}><Bell /></button>
      <Link href="/home" className="admin-exit-button" aria-label="Return to member portal"><ArrowRight /></Link>
    </header>
    <div className="admin-task-body">
      <nav className="admin-module-grid" aria-label="Admin panel sections">
        {adminSections.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={activeSection === id} onClick={() => setActiveSection(id)} className={activeSection === id ? 'active' : ''}>
          <Icon aria-hidden="true" /><span>{label}</span>
        </button>)}
      </nav>
      <section id="admin-overview" className="admin-panel-section" hidden={activeSection !== 'dashboard'}>
        <h2>Overview</h2>
        <p className="admin-section-subtitle">A current view of the Samsung rewards portal.</p>
        {directoryStatus === 'loading' && <p role="status">Loading overview…</p>}
        {directoryStatus === 'error' && <div className="admin-task-error" role="alert"><p>{directoryMessage || 'Could not load admin data.'}</p>{directoryRequiresSignIn && <Link href="/sign-in">Sign in</Link>}<button type="button" onClick={loadAdminDirectory}>Try again</button></div>}
        {overview && <div className="admin-overview-grid">
          <article><span>Total members</span><strong>{overview.totalUsers.toLocaleString()}</strong></article>
          <article><span>Active members</span><strong>{members.filter((member) => member.isActive).length.toLocaleString()}</strong></article>
          <article><span>Disabled members</span><strong>{members.filter((member) => !member.isActive).length.toLocaleString()}</strong></article>
          <article><span>Referred members</span><strong>{overview.referredUsers.toLocaleString()}</strong></article>
          <article><span>Withdrawable balances</span><strong>{overview.financialRecordsAvailable ? 'Available' : 'Not connected'}</strong></article>
          <article><span>Product funds</span><strong>{overview.financialRecordsAvailable ? 'Available' : 'Not connected'}</strong></article>
          <article><span>Verified transactions</span><strong>{overview.financialRecordsAvailable ? 'Available' : 'Not connected'}</strong></article>
        </div>}
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'analytics'}>
        <h2>Analytics</h2>
        <p className="admin-section-subtitle">Account and referral counts from registered member records.</p>
        {overview && <div className="admin-overview-grid"><article><span>Registered members</span><strong>{overview.totalUsers.toLocaleString()}</strong></article><article><span>Referred members</span><strong>{overview.referredUsers.toLocaleString()}</strong></article><article><span>Financial analytics</span><strong>{overview.financialRecordsAvailable ? 'Available' : 'Not connected'}</strong></article></div>}
        {!overview?.financialRecordsAvailable && <p className="admin-task-note">Sales, withdrawal, and revenue analytics are unavailable because verified product purchases and payout records are not connected.</p>}
      </section>
      <section id="admin-members" className="admin-panel-section" hidden={activeSection !== 'users'}>
        <h2>Members</h2>
        {directoryStatus === 'ready' && members.length === 0 && <p>No member accounts yet.</p>}
        {members.length > 0 && <div className="admin-member-list">
          {members.map((member) => <article key={member.id}>
            <div><strong>{member.phoneNumber}</strong><span>Joined {new Date(member.createdAt).toLocaleDateString()}</span></div>
            <div><span>Referral code</span><strong>{member.referralCode ?? '—'}</strong></div>
            <div><span>Invited by</span><strong>{member.referredByAccountId ? 'Referred member' : 'Direct signup'}</strong></div>
            <div><span>Account status</span><strong>{member.isActive ? 'Active' : 'Disabled'}</strong></div>
            <div className="admin-member-actions">
              <button type="button" onClick={() => void manageMember(member, 'password')}>Reset password</button>
              <button type="button" onClick={() => void manageMember(member, 'status')}>{member.isActive ? 'Disable account' : 'Enable account'}</button>
              <button type="button" onClick={() => void adjustMemberWallet(member, 'credit')}>Credit wallet</button>
              <button type="button" onClick={() => void adjustMemberWallet(member, 'debit')}>Debit wallet</button>
            </div>
          </article>)}
        </div>}
        <p className="admin-task-note">Password resets issue a temporary password once and sign out existing sessions. Wallet changes require a reason, affect the available wallet only, and do not rewrite earnings or deposit totals.</p>
      </section>
      <section id="admin-access" className="admin-panel-section" hidden={activeSection !== 'admins'}>
        <h2>Administrator access</h2>
        <p className="admin-task-note">Add an existing member by their Ugandan phone number. Added admins receive the same access to this panel.</p>
        <form className="admin-add-form" onSubmit={addAdmin}>
          <label htmlFor="admin-phone">Member phone number</label>
          <div><input id="admin-phone" type="tel" autoComplete="tel" required value={adminPhone} onChange={(event) => setAdminPhone(event.target.value)} placeholder="+256 7XX XXX XXX" /><button type="submit" disabled={addingAdmin}>{addingAdmin ? 'Adding…' : 'Add admin'}</button></div>
          {adminMessage && <p role="status">{adminMessage}</p>}
        </form>
        <h3>Additional admins</h3>
        {directoryStatus === 'ready' && admins.length === 0 && <p>No additional admins have been added.</p>}
        {admins.map((admin) => <article className="admin-recharge-review-item" key={admin.id}><strong>{admin.phoneNumber}</strong><span> Added {new Date(admin.createdAt).toLocaleDateString()}</span></article>)}
      </section>
      <section id="admin-tasks" className="admin-panel-section" hidden={activeSection !== 'settings'}>
        <h2>Task Center settings</h2>
        <p className="admin-task-note">Edit task goals and UGX rewards. Saving these terms does not enable referral tracking or process payouts.</p>
      {status === 'loading' && <p role="status">Loading settings…</p>}
      {status === 'error' && <div className="admin-task-error" role="alert"><p>{message}</p><button type="button" onClick={loadTasks}>Try again</button></div>}
      {status === 'ready' && <form onSubmit={saveTasks}>
        {tasks.map((task) => <fieldset className="admin-task-card" key={task.id}>
          <legend>{task.title || 'Task'}</legend>
          <label>Task title<input required maxLength={160} value={task.title} onChange={(event) => changeTask(task.id, { title: event.target.value })} /></label>
          <div className="admin-task-row">
            <label>Goal<input required type="number" min="1" value={task.objective} onChange={(event) => changeTask(task.id, { objective: Number(event.target.value) })} /></label>
            <label>Goal unit<input required maxLength={40} value={task.objectiveUnit} onChange={(event) => changeTask(task.id, { objectiveUnit: event.target.value })} /></label>
          </div>
          <div className="admin-task-row">
            <label>Reward (UGX)<input type="number" min="0" value={task.rewardUgx ?? ''} onChange={(event) => changeTask(task.id, { rewardUgx: event.target.value === '' ? null : Number(event.target.value) })} /></label>
            <label>Reward frequency<select value={task.rewardFrequency} onChange={(event) => changeTask(task.id, { rewardFrequency: event.target.value as TaskDefinition['rewardFrequency'] })}><option value="once">One-time</option><option value="daily">Daily</option></select></label>
          </div>
          <label className="admin-task-toggle"><input type="checkbox" checked={task.enabled} onChange={(event) => changeTask(task.id, { enabled: event.target.checked })} /> Show as active</label>
          <button className="admin-task-remove" type="button" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}>Remove task</button>
        </fieldset>)}
        <div className="admin-task-actions">
          <button type="button" onClick={() => setTasks((current) => [...current, { id: `task-${Date.now()}`, title: '', objective: 1, objectiveUnit: 'members', rewardUgx: null, rewardFrequency: 'once', enabled: false }])}>Add task</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
        {message && <p className="admin-task-message" role="status">{message}</p>}
      </form>}
      </section>
      <section id="admin-recharges" className="admin-recharge-review admin-panel-section" hidden={activeSection !== 'payments'}>
        <h2>Payments</h2>
        <p className="admin-section-subtitle">Manual recharge requests pending verification.</p>
        <p className="admin-task-note">Verify the Airtel transfer before changing its status. Verification credits the member’s deposited wallet balance.</p>
        {rechargeStatus === 'loading' && <p>Loading requests…</p>}
        {rechargeStatus === 'error' && <button type="button" onClick={loadRechargeRequests}>Retry loading requests</button>}
        {rechargeStatus === 'ready' && rechargeRequests.length === 0 && <p>No recharge requests.</p>}
        {rechargeRequests.map((request) => <article className="admin-recharge-review-item" key={request.id}>
          <p><strong>UGX {money.format(request.amountUgx)}</strong> · {request.status}</p>
          <p>Member: {request.memberPhone} · Sender: {request.payerPhone}</p>
          {request.status === 'pending' && <button type="button" onClick={() => void verifyRecharge(request.id)}>Verify transfer</button>}
        </article>)}
      </section>
      <section id="admin-audit" className="admin-panel-section" hidden={activeSection !== 'activity-log'}>
        <h2>Activity Log</h2>
        {auditLogs.length === 0 && directoryStatus === 'ready' && <p>No administrator actions recorded yet.</p>}
        <div className="admin-audit-list">
          {auditLogs.map((entry) => <article key={entry.id}>
            <strong>{entry.action.replaceAll('.', ' ')}</strong>
            <span>{new Date(entry.createdAt).toLocaleString()} · By {entry.performedByPhone}{entry.targetPhone ? ` · Member ${entry.targetPhone}` : ''}</span>
            {entry.amountUgx !== null && <span>UGX {money.format(entry.amountUgx)}</span>}
            {entry.reason && <p>Reason: {entry.reason}</p>}
            {entry.details && <p>{entry.details}</p>}
          </article>)}
        </div>
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'withdrawals'}>
        <h2>Withdrawals</h2>
        <p className="admin-task-note">Pay members manually outside the site, then mark the request paid. Marking a request failed returns the reserved gross amount to the member’s wallet.</p>
        {withdrawalStatus === 'loading' && <p role="status">Loading withdrawal requests…</p>}
        {withdrawalStatus === 'error' && <div className="admin-task-error" role="alert"><p>Could not load withdrawal requests.</p><button type="button" onClick={loadWithdrawalRequests}>Try again</button></div>}
        {withdrawalStatus === 'ready' && withdrawalRequests.length === 0 && <p>No withdrawal requests.</p>}
        {withdrawalRequests.map((request) => <article className="admin-recharge-review-item" key={request.id}>
          <p><strong>UGX {money.format(request.amountUgx)}</strong> · {request.status}</p>
          <p>Member: {request.memberPhone} · Pay to: {request.payoutProvider.toUpperCase()} {request.payoutHolderName ? `· ${request.payoutHolderName} · ` : '· '}{request.payoutPhone}</p>
          <p>Fee: UGX {money.format(request.feeUgx)} · Member receives: UGX {money.format(request.receivedUgx)}</p>
          <p>Requested: {new Date(request.createdAt).toLocaleString()}</p>
          {request.resolutionNote && <p>Admin note: {request.resolutionNote}</p>}
          {request.status === 'pending' && <div className="admin-member-actions">
            <button type="button" onClick={() => void processWithdrawal(request, 'paid')}>Mark paid</button>
            <button type="button" onClick={() => void processWithdrawal(request, 'failed')}>Fail and refund</button>
          </div>}
        </article>)}
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'products'}>
        <h2>Products</h2>
        <p className="admin-connection-state"><Package /> Edit the listed name, UGX price, and visibility. This does not activate checkout or sales tracking.</p>
        {productStatus === 'loading' && <p role="status">Loading products…</p>}
        {productStatus === 'error' && <div className="admin-task-error" role="alert"><p>Could not load products. Check admin access.</p><button type="button" onClick={loadAdminProducts}>Try again</button></div>}
        {productStatus === 'ready' && <form className="admin-product-editor" onSubmit={saveProducts}>
          {adminProducts.map((product) => <fieldset key={product.id}>
            <legend>{product.id}</legend>
            <label>Product name<input required maxLength={100} value={product.name} onChange={(event) => changeProduct(product.id, { name: event.target.value })} /></label>
            <label>Listed price (UGX)<input required type="number" min="1" max="1000000000" step="1" value={product.priceUgx} onChange={(event) => changeProduct(product.id, { priceUgx: Number(event.target.value) })} /></label>
            <label className="admin-task-toggle"><input type="checkbox" checked={product.isActive} onChange={(event) => changeProduct(product.id, { isActive: event.target.checked })} /> Show in member catalog</label>
          </fieldset>)}
          <button type="submit" disabled={savingProducts}>{savingProducts ? 'Saving…' : 'Save product changes'}</button>
          {productMessage && <p role="status">{productMessage}</p>}
        </form>}
        <Link href="/products" className="admin-panel-link">View member catalog <ArrowRight /></Link>
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'gift-codes'}>
        <h2>Gift Codes</h2>
        <p className="admin-connection-state"><Gift /> Gift-code creation and redemption are not connected. No codes are available to manage.</p>
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'messages'}>
        <h2>Messages</h2>
        <p className="admin-connection-state"><MessageSquare /> Member messaging is not connected. No message records are available.</p>
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'transactions'}>
        <h2>Transactions</h2>
        <p className="admin-connection-state"><CircleDollarSign /> There is no unified financial ledger yet. Manual recharge requests are available under Payments; purchases, withdrawals, and wallet transaction history are not connected.</p>
        <button type="button" className="admin-panel-link-button" onClick={() => setActiveSection('payments')}>View payment requests <ArrowRight /></button>
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'referrals'}>
        <h2>Referrals</h2>
        {overview && <div className="admin-overview-grid"><article><span>Members from referrals</span><strong>{overview.referredUsers.toLocaleString()}</strong></article><article><span>Direct signups</span><strong>{Math.max(0, overview.totalUsers - overview.referredUsers).toLocaleString()}</strong></article></div>}
        <p className="admin-task-note">Referral commission and team deposit totals are not presented as settled money until verified deposit and purchase records are connected.</p>
      </section>
      <section className="admin-panel-section" hidden={activeSection !== 'countries'}>
        <h2>Countries</h2>
        <article className="admin-country-card"><strong>Uganda</strong><span>Current supported market · UGX</span></article>
        <p className="admin-task-note">Country-level enable/disable controls are not connected. This portal currently supports Uganda only.</p>
      </section>
    </div>
  </main>;
}

function ProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [totalCollectedUgx, setTotalCollectedUgx] = useState(0);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const loadCatalog = async () => {
    try {
      const response = await fetch('/api/products/catalog');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load the product catalog.');
      setProducts((data.products as AdminCatalogItem[]).map(({ id, name, priceUgx, illustration }) => ({ id, name, price: priceUgx, illustration })));
      setPurchaseCount(data.purchasedCount ?? 0);
      setTotalCollectedUgx(data.totalCollectedUgx ?? 0);
      setCatalogState('ready');
    } catch {
      setCatalogState('error');
    }
  };
  useEffect(() => { void loadCatalog(); }, []);
  const buyProduct = async (productId: string) => {
    setBuyingProductId(productId);
    setPurchaseMessage('');
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/purchase`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Purchase could not be completed.');
      const commissions = (data.commissions as Array<{level:number;amountUgx:number}>)
        .map((item) => `Level ${item.level}: UGX ${money.format(item.amountUgx)}`).join(', ');
      setPurchaseMessage(`Order recorded and awaiting fulfillment. Remaining wallet: UGX ${money.format(data.walletBalanceUgx)}.${commissions ? ` Referral rewards credited: ${commissions}.` : ''}`);
      await loadCatalog();
    } catch (error) {
      setPurchaseMessage(error instanceof Error ? error.message : 'Purchase could not be completed.');
    } finally {
      setBuyingProductId(null);
    }
  };
  return <MemberFrame active="/products">
    {catalogState === 'loading' && <p className="catalog-load-state" role="status">Loading products…</p>}
    {catalogState === 'error' && <p className="catalog-load-state" role="alert">The product catalog could not be loaded.</p>}
    {catalogState === 'ready' && <ProductsCatalog
      products={products}
      formatPrice={(price) => money.format(price)}
      imageUrl={`${basePath}/samsung-s26-ultra-banner.jpeg`}
      purchaseCount={purchaseCount}
      totalCollectedUgx={totalCollectedUgx}
      buyingProductId={buyingProductId}
      purchaseMessage={purchaseMessage}
      onPurchase={buyProduct}
      productImages={{
        'galaxy-s-ultra': `${basePath}/samsung-s26-ultra.jpg`,
        'galaxy-z-fold': `${basePath}/samsung-fold8-banner.jpg`,
      }}
    />}
  </MemberFrame>;
}

function PurchasedProductsPage() {
  const [orders, setOrders] = useState<Array<{id:string;productName:string;priceUgx:number;status:string;createdAt:string}>>([]);
  const [state, setState] = useState<'loading'|'ready'|'error'>('loading');
  useEffect(() => {
    fetch('/api/products/orders', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Could not load orders.');
        setOrders(data.orders);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);
  return <MemberFrame active="/purchased-products">
    <section className="mx-auto max-w-[760px] rounded-[24px] border border-[#dedbce] bg-[#fffdf7]/90 px-5 py-8 shadow-[0_18px_48px_rgba(36,59,49,.05)] sm:px-8 sm:py-10">
      <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e6eadc] text-[#315f49]"><PackageOpen className="h-6 w-6" aria-hidden="true" /></span>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Order history</p>
      <h1 className="mt-2 font-[Syne] text-[27px] font-bold tracking-[-.05em] text-[#243b31] sm:text-[32px]">Purchased products</h1>
      {state === 'loading' && <p className="mt-4 text-sm text-[#657168]">Loading orders…</p>}
      {state === 'error' && <p className="mt-4 text-sm text-red-700" role="alert">Could not load your orders. Please sign in again.</p>}
      {state === 'ready' && orders.length === 0 && <p className="mt-3 max-w-[480px] text-[13px] leading-6 text-[#657168]">You have no product orders yet.</p>}
      {state === 'ready' && orders.length > 0 && <div className="mt-5 grid gap-3">{orders.map((order) => <article key={order.id} className="rounded-xl border border-[#e1e5e1] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><strong className="text-sm text-[#25372f]">{order.productName}</strong><span className="rounded-full bg-[#fff2cb] px-3 py-1 text-xs font-semibold text-[#82620b]">Pending fulfillment</span></div>
        <p className="mt-2 text-sm text-[#506056]">UGX {money.format(order.priceUgx)}</p>
        <p className="mt-1 text-xs text-[#808982]">Order {order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleString()}</p>
      </article>)}</div>}
      <Link href="/products" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#315f49] px-5 text-[12px] font-bold text-[#fffdf7] hover:bg-[#244b38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]">Browse products <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </section>
  </MemberFrame>;
}

function ReferralPage() {
  const { user } = useAuth();
  const [referralNotice, setReferralNotice] = useState('');
  const referralLevels = [
    { level: 1, rate: '35%', tone: 'referral-level-one' },
    { level: 2, rate: '2%', tone: 'referral-level-two' },
    { level: 3, rate: '1%', tone: 'referral-level-three' },
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

  async function copyReferralCode() {
    if (!user?.referralCode) return;
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setReferralNotice('Referral code copied.');
    } catch {
      setReferralNotice('Could not copy the referral code.');
    }
  }

  return <MemberFrame active="/referral">
    <section className="mx-auto max-w-[920px] space-y-5" data-testid="page-referral">
      <header className="referral-page-heading"><h1>Team</h1></header>

      <section className="referral-invite-card" aria-label="Referral invitation">
        <div className="referral-team-summary">
          <div><span>Total rewards</span><strong aria-label="Unavailable">UGX —</strong></div>
          <div><span>Total members</span><strong aria-label="Unavailable">—</strong></div>
        </div>
        <div className="referral-hero-art">
          <img src={`${basePath}/samsung-referral-banner.jpg`} alt="Samsung Galaxy smartphones including foldable devices" />
        </div>
        <div className="referral-share-grid">
          <div className="referral-share-item">
            <span>Invitation code</span>
            <strong>{user?.referralCode ?? 'Generating…'}</strong>
            <button type="button" onClick={copyReferralCode} disabled={!user?.referralCode} aria-label="Copy invitation code">
              <Copy aria-hidden="true" /> Copy
            </button>
          </div>
          <div className="referral-share-item">
            <span>Invitation link</span>
            <strong className="referral-link-text" title={referralLink}>{referralLink || 'Preparing your referral link…'}</strong>
            <button type="button" onClick={copyReferralLink} disabled={!referralLink} aria-label="Copy invitation link">
              <Copy aria-hidden="true" /> Copy
            </button>
          </div>
        </div>
        <p className="referral-copy-status" role="status" aria-live="polite">{referralNotice}</p>
      </section>

      <section className="referral-levels" aria-label="Referral commission levels">
        {referralLevels.map(({ level, rate, tone }) => (
          <article key={level} className={`referral-tier-card ${tone}`}>
            <span className="referral-level-badge">Lv{level}</span>
            <div><strong>{rate}</strong><span>Commission</span></div>
            <div><strong>—</strong><span>Members</span></div>
            <div><strong>—</strong><span>Rewards</span></div>
          </article>
        ))}
      </section>

      <p className="referral-terms-note">
        Displayed rates are not active yet. Reward eligibility, calculation basis, and payout terms still need confirmation.
      </p>
    </section>
  </MemberFrame>;
}

function AccountPage() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const accountActions = [
    { id: 'about', label: 'About us', icon: FileText, detail: 'Independent gadget retailer. Exact device models and stock are still being confirmed.' },
    { id: 'help', label: 'Customer service', icon: Headphones, href: customerServiceUrl },
    { id: 'history', label: 'History', icon: History, detail: 'No verified wallet transactions are available yet.' },
    { id: 'terms', label: 'Regulations', icon: FileText, detail: 'Terms have not been published yet. Product availability, checkout, rewards, and wallet services are not active.' },
    { id: 'install', label: 'Download app', icon: Download, detail: 'If your browser offers an Install app option in its menu, you can use it to add this site to your device.' },
    { id: 'link-card', label: 'Link a card', icon: CreditCard, detail: 'Card linking is not available yet.' },
    { id: 'password', label: 'Change password', icon: ShieldCheck, detail: 'Password changes are handled by an administrator. Self-service password changes are not available yet.' },
    { id: 'gift', label: 'Exchange a gift', icon: Gift, detail: 'Gift-code redemption is not available yet.' },
  ];

  async function handleAccountSignOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
      setLocation('/');
    } catch {
      setSignOutError('Could not sign you out. Try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return <MemberFrame active="/account">
    <section className="account-content mx-auto w-full max-w-[580px]" data-testid="page-account">
      <div className="account-overview-heading">
        <div>
          <p>samsung · My account</p>
          <h1>Account</h1>
          <span data-testid="text-account-phone">{user?.phoneNumber}</span>
        </div>
        <span className="account-overview-avatar" aria-hidden="true"><UserRound /></span>
      </div>

      <section className="account-balance-row" aria-label="Wallet totals">
        <article>
          <strong>UGX {user?.walletBalanceUgx.toLocaleString('en-UG') ?? '—'}</strong>
          <span>Wallet balance</span>
        </article>
        <article>
          <strong>UGX {user?.totalAccumulatedUgx.toLocaleString('en-UG') ?? '—'}</strong>
          <span>Total accumulated</span>
        </article>
      </section>

      <section className="account-wallet-actions" aria-label="Wallet actions">
        <Link href="/recharge" data-testid="button-account-deposit" aria-label="Deposit">
          <Download aria-hidden="true" /><span>Recharge</span>
        </Link>
        <Link href="/withdrawal" data-testid="button-account-withdraw" aria-label="Withdraw">
          <CreditCard aria-hidden="true" /><span>Withdraw</span>
        </Link>
        <Link href="/withdrawal-history" data-testid="link-account-history">
          <History aria-hidden="true" /><span>History</span>
        </Link>
      </section>

      <Link href="/tasks" className="account-feature-card">
        <img src={`${basePath}/samsung-referral-banner.jpg`} alt="Samsung Galaxy devices" />
        <span className="account-feature-eyebrow">Task Center</span>
        <strong>Task Center</strong>
        <span className="account-feature-button">Go <ArrowRight aria-hidden="true" /></span>
      </Link>

      <section className="account-shortcut-grid" aria-label="Account shortcuts">
        {accountActions.map(({ id, label, icon: Icon, detail, href }) => {
          const isExpanded = expandedAction === id;
          return (
            <div className="account-shortcut" key={id}>
              {id === 'link-card'
                ? <Link href="/bank-accounts" className="account-shortcut-link" data-testid={`button-account-${id}`}><Icon aria-hidden="true" /><span>{label}</span></Link>
                : href?.startsWith('https://')
                  ? <a href={href} target="_blank" rel="noopener noreferrer" className="account-shortcut-link" data-testid={`button-account-${id}`}><Icon aria-hidden="true" /><span>{label}</span></a>
                  : <button type="button" aria-expanded={isExpanded} onClick={() => setExpandedAction(isExpanded ? null : id)} data-testid={`button-account-${id}`}><Icon aria-hidden="true" /><span>{label}</span></button>}
              {isExpanded && <p role="status" data-testid={`status-account-${id}`}>{detail}</p>}
            </div>
          );
        })}
      </section>
      <button type="button" className="account-logout" onClick={handleAccountSignOut} disabled={signingOut}>
        {signingOut ? 'Signing out…' : 'Log out'} <ArrowRight aria-hidden="true" />
      </button>
      {signOutError && <p role="alert" className="account-signout-error">{signOutError}</p>}
    </section>
  </MemberFrame>;
}

function AuthFrame({ children, mode }: { children: ReactNode; mode: 'sign-in' | 'sign-up' }) {
  const background = mode === 'sign-in' ? 'samsung-s26-ultra.jpg' : 'samsung-auth-register.jpg';
  return (
    <main
      className={`auth-shell auth-shell-${mode} grid min-h-[100dvh] place-items-center p-4 sm:p-6`}
      style={{ backgroundImage: `linear-gradient(180deg, rgba(7, 14, 28, .38), rgba(7, 14, 28, .66)), url("${basePath}/${background}")` }}
      data-testid="page-phone-auth"
    >
      <div className="auth-content w-full max-w-[460px]">{children}</div>
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

  if (user) return <Redirect to="/home" />;

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
      queueMemberNotice();
    } catch (reason) {
      setError(getAuthErrorMessage(
        reason,
        isSignUp ? 'Could not create your account. Check your details and try again.' : 'Invalid phone number or password.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthFrame mode={mode}>
    <div className="auth-register-brand">
      <Brand inverse />
    </div>
    <section className="auth-card" aria-label={isSignUp ? 'Register' : 'Login'} data-testid={`panel-${mode}`}>
      <h1 className="auth-page-title">{isSignUp ? 'Register' : 'Login'}</h1>

      <form className="auth-form" onSubmit={handleSubmit} data-testid={`form-${mode}`}>
        <div>
          <label htmlFor="phone-number" className="auth-label">Mobile number</label>
          <div className="auth-phone-control">
            <span className="auth-phone-prefix" aria-label="Country calling code">+256</span>
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
      <Link
        href={isSignUp ? '/sign-in' : '/sign-up'}
        className="auth-mode-switch-link"
        data-testid={isSignUp ? 'link-auth-login' : 'link-auth-register'}
      >
        {isSignUp ? 'Sign in' : 'Create an account'} <span aria-hidden="true">›</span>
      </Link>
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
        <Route path="/user-portal"><Redirect to="/home" /></Route>
        <Route path="/overview"><Redirect to="/home" /></Route>
        <Route path="/home" component={HomePage} />
        <Route path="/presence" component={PresencePage} />
        <Route path="/tasks" component={TaskCenterPage} />
        <Route path="/admin" component={AdminTaskCenterPage} />
        <Route path="/gadget-shop-signup/admin"><Redirect to="/admin" /></Route>
        <Route path="/withdrawal" component={WithdrawalPage} />
        <Route path="/withdrawal-history" component={WithdrawalHistoryPage} />
        <Route path="/bank-accounts" component={BankAccountsPage} />
        <Route path="/link-bank-card" component={LinkBankCardPage} />
        <Route path="/recharge" component={RechargePage} />
        <Route path="/recharge/payment" component={RechargePaymentPage} />
        <Route path="/recharge-history" component={RechargeHistoryPage} />
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
