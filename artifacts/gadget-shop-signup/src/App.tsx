import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OverviewWalletPanel } from '@/components/overview-wallet-panel';
import { ProductsCatalog } from '@/components/products-catalog';
import NotFound from '@/pages/not-found';
import { ArrowDownRight, ArrowRight, BadgeCheck, Bell, Copy, CreditCard, Gift, LayoutDashboard, LockKeyhole, PackageOpen, Share2, ShieldCheck, ShoppingBag, UserRound, UsersRound } from 'lucide-react';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const products = [
  30_000, 50_000, 115_000, 250_000, 370_000, 250_000,
  775_000, 1_650_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000,
];
const money = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 });

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#315f49',
    colorForeground: '#243b31',
    colorMutedForeground: '#6e796f',
    colorDanger: '#a84435',
    colorBackground: '#fffdf7',
    colorInput: '#fbf8ef',
    colorInputForeground: '#243b31',
    colorNeutral: '#dfddcf',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf7] rounded-[22px] w-full max-w-[440px] overflow-hidden border border-[#dedbce] shadow-[0_22px_60px_rgba(36,59,49,0.10)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#243b31] font-semibold tracking-[-0.03em]',
    headerSubtitle: 'text-[#6e796f]',
    socialButtonsBlockButtonText: 'text-[#243b31] font-medium',
    formFieldLabel: 'text-[#31483c] font-medium',
    footerActionLink: 'text-[#315f49] font-semibold hover:text-[#214936]',
    footerActionText: 'text-[#6e796f]',
    dividerText: 'text-[#7d847a]',
    identityPreviewEditButton: 'text-[#315f49]',
    formFieldSuccessText: 'text-[#315f49]',
    alertText: 'text-[#8b302c]',
    logoBox: 'mb-4',
    logoImage: 'max-h-9',
    socialButtonsBlockButton: 'border-[#dedbce] bg-white hover:bg-[#f7f4eb]',
    formButtonPrimary: 'bg-[#315f49] hover:bg-[#244b38] text-white shadow-none',
    formFieldInput: 'border-[#dedbce] bg-[#fbf8ef] text-[#243b31] focus:border-[#315f49]',
    footerAction: 'border-t border-[#ece8dc]',
    dividerLine: 'bg-[#dedbce]',
    alert: 'border-[#f1d8d5] bg-[#fff8f7]',
    otpCodeFieldInput: 'border-[#dedbce] text-[#243b31]',
    formFieldRow: 'gap-1.5',
    main: 'gap-5',
  },
};

function Brand({ small = false, inverse = false }: { small?: boolean; inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden="true" className={`brand-mark flex items-center justify-center rounded-[12px] text-[#f7f1dc] ${small ? 'h-9 w-9' : 'h-10 w-10'}`}>
        <span className="font-[Syne] text-[18px] font-bold leading-none">R</span>
      </span>
      <span className={`font-[Syne] text-[15px] font-bold tracking-[-0.045em] ${inverse ? 'text-white' : 'text-[#243b31]'}`}>Rewards Program</span>
    </span>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]" aria-label="Rewards Program home">
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
              Real products.
              <br />
              <span className="text-[#3e7658]">Clear prices.</span>
            </h1>
            <p className="mt-6 max-w-[490px] text-[15px] leading-7 text-[#647168] sm:text-[17px] sm:leading-8">
              Create an account for updates about a rewards program connected to real product sales in Uganda.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/sign-up" className="group inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-[#315f49] px-7 text-[14px] font-bold text-[#fffdf7] shadow-[0_9px_20px_rgba(49,95,73,.17)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49] focus-visible:ring-offset-2" data-testid="link-create-account">
                Create an account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center gap-2 text-[12px] text-[#6c786d]"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Email and password signup</span>
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
              <h2 id="prices-title" className="mt-2 font-[Syne] text-[30px] font-bold tracking-[-.055em] text-[#243b31] sm:text-[38px]">Product price tiers</h2>
            </div>
            <p className="max-w-[400px] text-[12px] leading-5 text-[#70796f]">These are sale prices only. Product details and reward calculations are not provided here.</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {products.map((price, index) => (
              <article key={`${index}-${price}`} className="product-row rounded-[15px] border border-[#dedbce] bg-[#fffdf7]/80 p-4 transition-colors hover:border-[#9eae9a] sm:p-5" style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#819080]">Product {index + 1}</p>
                <p className="price-figure mt-3 text-[clamp(1.1rem,2.3vw,1.55rem)] font-medium tracking-[-.07em] text-[#294637]"><span className="mr-1 text-[11px] tracking-normal text-[#728073]">UGX</span>{money.format(price)}</p>
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
          <span>Rewards Program · Product sales rewards · Uganda</span>
          <span>Reward amounts and payout rules are not active or configured yet.</span>
        </footer>
      </div>
    </main>
  );
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/overview" /></Show><Show when="signed-out"><Home /></Show></>;
}

const memberNav = [
  { href: '/overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', shortLabel: 'Products', icon: ShoppingBag },
  { href: '/purchased-products', label: 'Purchased Products', shortLabel: 'Purchased', icon: PackageOpen },
  { href: '/referral', label: 'Referral', shortLabel: 'Referral', icon: UsersRound },
  { href: '/account', label: 'My Account', shortLabel: 'Account', icon: UserRound },
];

function MemberFrame({ active, children }: { active: string; children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const activePage = memberNav.find((item) => item.href === active);
  const isOverview = active === '/overview';
  const isReferral = active === '/referral';
  const isProducts = active === '/products';
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const ogTitleTag = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const ogDescriptionTag = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const previousDescription = descriptionTag?.content;
    const previousOgTitle = ogTitleTag?.content;
    const previousOgDescription = ogDescriptionTag?.content;
    const pageTitle = `${activePage?.label ?? 'Member portal'} — Rewards Program`;
    document.title = pageTitle;
    const description = 'Member account portal for Rewards Program in Uganda. Product sale prices are shown in UGX; checkout, rewards, and referral tracking are not active.';
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
  return (
    <>
      <Show when="signed-in">
        <main className={`shop-grain min-h-[100dvh] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:py-7 sm:pb-28 ${isOverview ? 'overview-shell' : isReferral ? 'referral-shell' : isProducts ? 'products-shell' : 'shop-shell'}`}>
          <div className="member-frame relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-[1240px] flex-col sm:min-h-[calc(100dvh-3.5rem)]">
            <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-4 border-b pb-4 sm:pb-5 ${isOverview ? 'border-white/10' : isProducts ? 'border-[#9bbfce]' : 'border-[#d8d4c7]'}`}>
              <Link href="/overview" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd0a0]" aria-label="Rewards Program overview"><Brand small inverse={isOverview} /></Link>
              <div className="flex items-center gap-3">
                <span className={`hidden max-w-[180px] truncate text-[12px] sm:inline ${isOverview ? 'text-white/60' : 'text-[#68756a]'}`}>{isLoaded ? user?.firstName ?? user?.primaryEmailAddress?.emailAddress : 'Loading account'}</span>
                <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${isOverview ? 'border-white/15 bg-white/[.06] text-white/80 hover:border-white/35 hover:bg-white/10 focus-visible:ring-[#6dd0a0]' : isProducts ? 'border-[#9fb9c5] bg-white/60 text-[#405c6a] hover:border-[#547f92] hover:text-[#183b50] focus-visible:ring-[#547f92]' : 'border-[#c9cbbb] bg-[#fffdf7]/80 text-[#34513f] hover:border-[#315f49] hover:text-[#315f49] focus-visible:ring-[#315f49]'}`} data-testid="button-sign-out">Sign out</button>
              </div>
              <nav className={`member-nav order-3 hidden w-full gap-1 overflow-x-auto border-t pt-3 md:order-none md:flex md:w-auto md:border-0 md:pt-0 ${isOverview ? 'border-white/10' : 'border-[#e4e0d4]'}`} aria-label="Member navigation">
                {memberNav.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} aria-current={active === href ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49] sm:px-3.5 ${isOverview ? (active === href ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white') : isProducts ? (active === href ? 'bg-[#142438] text-white' : 'text-[#476675] hover:bg-white/50 hover:text-[#173448]') : (active === href ? 'bg-[#315f49] text-[#fffdf7]' : 'text-[#617166] hover:bg-[#e9eadf] hover:text-[#294637]')}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" /><span>{label}</span>
                  </Link>
                ))}
              </nav>
            </header>
            <div className={`flex-1 ${isOverview ? 'py-5 sm:py-8' : 'py-7 sm:py-10'}`}>
              {!isOverview && !isReferral && <div className="mb-7">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Rewards Program · Uganda</p>
                <h1 className="mt-2 font-[Syne] text-[32px] font-bold leading-tight tracking-[-.06em] text-[#243b31] sm:text-[42px]">{activePage?.label}</h1>
              </div>}
              {children}
            </div>
            {!isOverview && <footer className={`border-t py-4 text-[11px] leading-5 ${isReferral ? 'border-[#e1e4e6] text-[#788087]' : isProducts ? 'border-[#9bbfce] text-[#547181]' : 'border-[#d8d4c7] text-[#758078]'}`}>
              Rewards Program · Uganda · Rewards, referral tracking, and checkout are not active.
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
      </Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function OverviewPage() {
  const { user, isLoaded } = useUser();
  return <MemberFrame active="/overview">
    <section className="overview-dashboard relative mx-auto max-w-[850px]" aria-labelledby="overview-title">
      <div className="overview-aura pointer-events-none absolute -inset-x-8 -inset-y-5 -z-10 rounded-[42px]" aria-hidden="true" />
      <div className="overview-panel relative overflow-hidden rounded-[28px] border border-white/[.14] p-5 text-[#f5f6f5] shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:rounded-[32px] sm:p-8">
        <div className="overview-panel-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b3c7bd]">
            <span className="overview-crown flex h-5 w-5 items-center justify-center rounded-md text-[11px]" aria-hidden="true">✦</span>
            Rewards Program · Uganda
          </div>
          <h1 id="overview-title" data-testid="text-overview-welcome" className="mt-4 max-w-[670px] font-[Syne] text-[clamp(1.9rem,6vw,3.15rem)] font-semibold leading-[1.12] tracking-[-.055em] text-white">
            {isLoaded ? `Welcome${user?.firstName ? `, ${user.firstName}` : ''} —` : 'Welcome —'} explore your gadget rewards.
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
    <ProductsCatalog prices={products} formatPrice={(price) => money.format(price)} />
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
  const stats = [
    { label: 'Total team', value: 'Not tracked', icon: UsersRound },
    { label: 'Product purchases', value: 'Not tracked', icon: ShoppingBag },
    { label: 'Commissions', value: 'Not active', icon: LockKeyhole },
  ];

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
        <p className="mt-3 max-w-[640px] text-[13px] leading-6 text-white/80">Invite friends to explore the Samsung gadget catalog. Referral tracking and commissions are not active yet.</p>
      </section>

      <section className="rounded-[24px] border border-[#e5e7e9] bg-white p-4 shadow-[0_5px_16px_rgba(20,28,36,.06)] sm:p-6" aria-labelledby="referral-code-title">
        <h2 id="referral-code-title" className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9094]">Your referral code</h2>
        <div className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-[16px] border border-[#e7e8e7] bg-[#fafaf9] px-4">
          <span className="text-[14px] font-semibold tracking-[.06em] text-[#747b80]">Not generated</span>
          <span className="rounded-full bg-[#fff3df] px-3 py-1 text-[10px] font-bold uppercase tracking-[.05em] text-[#95500f]">Pending</span>
        </div>
        <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9094]">Your referral link</h3>
        <div className="mt-2 truncate rounded-[14px] border border-[#e7e8e7] bg-[#fafaf9] px-4 py-3 font-mono text-[11px] text-[#7c8184]">Unavailable until referral tracking is configured</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled title="Referral codes are not active" aria-describedby="referral-actions-note" className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[14px] bg-[#9e4b12]/55 px-3 text-[12px] font-bold text-white/90"><Copy className="h-4 w-4" aria-hidden="true" /> Copy link</button>
          <button type="button" disabled title="Referral codes are not active" aria-describedby="referral-actions-note" className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[14px] border border-[#e5e6e7] bg-[#f6f6f5] px-3 text-[12px] font-bold text-[#858b8f]"><Share2 className="h-4 w-4" aria-hidden="true" /> Share link</button>
        </div>
        <p id="referral-actions-note" className="mt-3 text-[11px] leading-5 text-[#81868a]">A code and shareable link will appear once tracking and eligibility rules are configured.</p>
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
              <p className="mt-2 font-[Syne] text-[13px] font-bold leading-tight text-[#25292c] sm:text-[15px]">Not active</p>
              <p className="mt-2 text-[9px] leading-4 text-[#858a8e] sm:text-[10px]">No confirmed referral activity is tracked.</p>
            </article>
          ))}
        </div>
      </section>

      <p className="rounded-[16px] border border-[#ead6c1] bg-[#fff8ef] px-4 py-3 text-[11px] leading-5 text-[#765b47]">Referral rewards remain inactive until the qualifying purchase, calculation basis, and payout terms are confirmed.</p>
    </section>
  </MemberFrame>;
}

function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Name not provided';
  const email = user?.primaryEmailAddress?.emailAddress ?? 'No primary email on this account';
  return <MemberFrame active="/account">
    {!isLoaded ? <section aria-label="Loading account details" className="grid gap-3"><div className="h-24 animate-pulse rounded-[20px] bg-[#e8e6da]" /><div className="h-40 animate-pulse rounded-[20px] bg-[#e8e6da]" /></section> : (
      <section className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <div className="rounded-[22px] border border-[#355944] bg-[#244735] p-6 text-[#f8f3e5] sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e4a16f] text-[#253b30]"><UserRound className="h-6 w-6" aria-hidden="true" /></span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[.16em] text-[#b9cdb4]">Signed-in profile</p>
          <h2 className="mt-2 break-words font-[Syne] text-[25px] font-semibold leading-tight tracking-[-.04em]">{displayName}</h2>
          <p className="mt-2 break-all text-[12px] text-[#d6dfd0]">{email}</p>
          {user?.username && <p className="mt-3 text-[11px] text-[#b9cdb4]">@{user.username}</p>}
        </div>
        <div className="rounded-[22px] border border-[#dedbce] bg-[#fffdf7]/90 p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#75816f]">Account details</p>
          <dl className="mt-5 divide-y divide-[#ece8dc]">
            <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-4"><dt className="text-[11px] font-semibold text-[#75816f]">Full name</dt><dd className="break-words text-[13px] text-[#294637]">{displayName}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-4"><dt className="text-[11px] font-semibold text-[#75816f]">Email</dt><dd className="break-all text-[13px] text-[#294637]">{email}</dd></div>
            {user?.username && <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-4"><dt className="text-[11px] font-semibold text-[#75816f]">Username</dt><dd className="text-[13px] text-[#294637]">{user.username}</dd></div>}
            <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-4"><dt className="text-[11px] font-semibold text-[#75816f]">Account status</dt><dd className="text-[13px] text-[#294637]">Signed in with Clerk</dd></div>
          </dl>
          <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#c9cbbb] px-5 text-[12px] font-bold text-[#34513f] hover:border-[#315f49] hover:bg-[#f1f1e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]">Sign out</button>
        </div>
      </section>
    )}
  </MemberFrame>;
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="shop-shell shop-grain min-h-[100dvh] px-4 py-7 sm:px-6">
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col">
        <header className="flex justify-center sm:justify-start"><Link href="/" aria-label="Rewards Program home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f49]"><Brand /></Link></header>
        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[.8fr_1fr] lg:gap-14">
          <aside className="hidden max-w-sm lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#75816f]">Rewards Program · Uganda</p>
            <h1 className="mt-4 font-[Syne] text-[42px] font-bold leading-[1.03] tracking-[-.07em] text-[#243b31]">A clear place to start.</h1>
            <p className="mt-4 text-[14px] leading-7 text-[#657168]">Create or access your account with email and password. Reward amounts and payout rules are not active or configured yet.</p>
            <Link href="/" className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-[#315f49] hover:text-[#244b38]">View product price tiers <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </aside>
          <div className="w-full">{children}</div>
        </div>
        <footer className="border-t border-[#d8d4c7] pt-4 text-center text-[11px] text-[#758078] sm:text-left">Signup and account access only. Rewards are not active.</footer>
      </div>
    </main>
  );
}

function SignInPage() {
  return <AuthFrame><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthFrame>;
}

function SignUpPage() {
  return <AuthFrame><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthFrame>;
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
        <Route path="/register"><Redirect to="/sign-up" /></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkAppRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your Rewards Program account' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Sign up for the Rewards Program' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}><AppRoutes /></QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}><ClerkAppRoutes /></WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
