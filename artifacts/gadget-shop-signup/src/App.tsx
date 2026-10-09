import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ArrowRight, Check, ChevronRight, CircleUserRound, Headphones, Laptop, ShieldCheck, Smartphone, Watch } from 'lucide-react';
import {
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
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
    colorPrimary: '#087f8c',
    colorForeground: '#183142',
    colorMutedForeground: '#667c88',
    colorDanger: '#b8433c',
    colorBackground: '#ffffff',
    colorInput: '#fbfdfd',
    colorInputForeground: '#183142',
    colorNeutral: '#d8e3e5',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#dce7e8] shadow-[0_22px_60px_rgba(18,51,69,0.09)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#183142] font-semibold tracking-[-0.03em]',
    headerSubtitle: 'text-[#627985]',
    socialButtonsBlockButtonText: 'text-[#183142] font-medium',
    formFieldLabel: 'text-[#254351] font-medium',
    footerActionLink: 'text-[#087f8c] font-semibold hover:text-[#075d69]',
    footerActionText: 'text-[#667c88]',
    dividerText: 'text-[#71848d]',
    identityPreviewEditButton: 'text-[#087f8c]',
    formFieldSuccessText: 'text-[#147451]',
    alertText: 'text-[#8b302c]',
    logoBox: 'mb-4',
    logoImage: 'max-h-9',
    socialButtonsBlockButton: 'border-[#dce7e8] bg-white hover:bg-[#f2f8f8]',
    formButtonPrimary: 'bg-[#087f8c] hover:bg-[#076d78] text-white shadow-none',
    formFieldInput: 'border-[#dce7e8] bg-[#fbfdfd] text-[#183142] focus:border-[#087f8c]',
    footerAction: 'border-t border-[#e7eeee]',
    dividerLine: 'bg-[#dce7e8]',
    alert: 'border-[#f1d8d5] bg-[#fff8f7]',
    otpCodeFieldInput: 'border-[#dce7e8] text-[#183142]',
    formFieldRow: 'gap-1.5',
    main: 'gap-5',
  },
};

function Home() {
  return (
    <main className="shop-shell shop-grain min-h-[100dvh] overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1240px] flex-col px-5 pb-8 pt-5 sm:px-8 sm:pt-7 lg:px-12">
        <header className="rise-in flex items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f8c]" aria-label="Device Store home" data-testid="link-brand-home">
            <img src={`${basePath}/logo.svg`} alt="" className="h-9 w-9" data-testid="img-brand-mark" />
            <span className="font-[Manrope] text-[15px] font-extrabold tracking-[-0.045em] text-[#183142]" data-testid="text-brand-name">Device Store</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6" aria-label="Account navigation">
            <span className="hidden text-[13px] font-medium text-[#607783] sm:inline">Already have an account?</span>
            <Link href="/sign-in" className="inline-flex h-10 items-center justify-center rounded-full border border-[#ceddde] bg-white/60 px-5 text-[13px] font-semibold text-[#193848] hover:border-[#087f8c] hover:text-[#087f8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f8c]" data-testid="link-sign-in">Sign in</Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12 lg:py-16">
          <div className="rise-in max-w-[590px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9dfe0] bg-[#f8fcfb]/75 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3f6971]" data-testid="text-store-intro">
              <span className="h-1.5 w-1.5 rounded-full bg-[#15939a]" />
              A simpler way to shop tech
            </div>
            <h1 className="font-[Manrope] text-[clamp(2.65rem,6.2vw,5rem)] font-extrabold leading-[0.99] tracking-[-0.07em] text-[#183142]" data-testid="text-home-heading">
              Good tech.
              <br />
              <span className="text-[#07818c]">No guesswork.</span>
            </h1>
            <p className="mt-6 max-w-[470px] text-base leading-7 text-[#5e7480] sm:text-[17px] sm:leading-8" data-testid="text-home-description">
              Create an account to keep your shopping details in one place and browse Samsung phones, tablets, wearables and accessories.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/sign-up" className="group inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-[#087f8c] px-7 text-[14px] font-bold text-white shadow-[0_10px_22px_rgba(8,127,140,0.17)] transition-transform hover:-translate-y-0.5 hover:bg-[#076d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f8c] focus-visible:ring-offset-2" data-testid="link-create-account">
                Create your account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <span className="text-center text-[12px] text-[#6c818c] sm:ml-2 sm:text-left" data-testid="text-email-note">Email and password sign-up</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#d7e4e4] pt-5 text-[12px] font-medium text-[#4f6875]">
              <span className="inline-flex items-center gap-2" data-testid="text-trust-privacy"><ShieldCheck className="h-4 w-4 text-[#0c858b]" aria-hidden="true" />Your account, your details</span>
              <span className="inline-flex items-center gap-2" data-testid="text-trust-shop"><Check className="h-4 w-4 text-[#0c858b]" aria-hidden="true" />Browse at your own pace</span>
            </div>
          </div>

          <div className="rise-in-delay relative mx-auto flex min-h-[340px] w-full max-w-[500px] items-center justify-center sm:min-h-[420px]" role="img" aria-label="Illustration of a phone, tablet, and watch">
            <div className="absolute inset-x-[8%] top-[9%] aspect-square rounded-full border border-[#cee1e2] bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.92),rgba(224,241,240,0.26)_64%,transparent_65%)]" />
            <div className="absolute left-[10%] top-[20%] h-2 w-2 rounded-full bg-[#2c9da1]" />
            <div className="absolute right-[9%] top-[37%] h-1.5 w-1.5 rounded-full bg-[#78a8ac]" />
            <div className="absolute bottom-[17%] left-[19%] h-1.5 w-1.5 rounded-full bg-[#78a8ac]" />
            <div className="absolute bottom-[9%] right-[15%] h-3 w-3 rounded-full border border-[#74a9aa]" />
            <div className="device-float absolute left-[13%] top-[24%] z-10 w-[31%] max-w-[155px] rounded-[25px] border-[5px] border-[#193849] bg-[#193849] p-[4px] shadow-[0_24px_44px_rgba(20,55,73,0.18)]">
              <div className="relative aspect-[0.47] overflow-hidden rounded-[17px] bg-[#d8efeb]">
                <div className="absolute inset-x-0 top-0 h-[52%] bg-[linear-gradient(150deg,#b9ddd7,#7eb8b5)]" />
                <div className="absolute -right-[18%] top-[12%] h-[68%] w-[80%] rounded-full bg-[#f5f0df]" />
                <div className="absolute bottom-[14%] left-[12%] h-2 w-[43%] rounded-full bg-[#316879]/60" />
                <div className="absolute bottom-[8%] left-[12%] h-1.5 w-[29%] rounded-full bg-[#316879]/30" />
                <div className="absolute left-1/2 top-2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#214555]/70" />
              </div>
            </div>
            <div className="absolute right-[14%] top-[11%] z-20 w-[43%] max-w-[205px] rotate-[3deg] rounded-[22px] border-[5px] border-[#244658] bg-[#244658] p-[5px] shadow-[0_27px_48px_rgba(20,55,73,0.2)]">
              <div className="relative aspect-[0.75] overflow-hidden rounded-[14px] bg-[#e3f0ed]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#e5f0e7_0%,#a4ceca_48%,#e8e4d4_49%,#f4f1e7_100%)]" />
                <div className="absolute left-[12%] top-[13%] h-[54%] w-[55%] rounded-[50%] bg-[#c3dfd7]" />
                <div className="absolute bottom-[14%] left-[12%] h-2 w-[40%] rounded-full bg-[#376773]/65" />
                <div className="absolute bottom-[8%] left-[12%] h-1.5 w-[29%] rounded-full bg-[#376773]/35" />
                <div className="absolute right-[9%] top-[10%] h-2 w-2 rounded-full bg-[#244658]" />
              </div>
            </div>
            <div className="device-float absolute bottom-[12%] right-[15%] z-30 flex h-[88px] w-[88px] rotate-[-8deg] items-center justify-center rounded-[25px] border-[5px] border-[#244658] bg-[#d3ebe7] shadow-[0_20px_34px_rgba(20,55,73,0.17)]" style={{ animationDelay: '1.4s' }}>
              <div className="flex h-[51px] w-[42px] items-center justify-center rounded-[16px] border-[5px] border-[#244658] bg-[#91c9c4]">
                <div className="h-3 w-3 rounded-full border-2 border-[#e6f2e9]" />
              </div>
            </div>
            <div className="absolute bottom-[17%] left-[8%] z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[#cee1e2] bg-[#f8fcfb] text-[#087f8c] shadow-[0_12px_25px_rgba(20,55,73,0.07)]">
              <Headphones className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="absolute right-[4%] top-[64%] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[#cee1e2] bg-[#f8fcfb] text-[#087f8c] shadow-[0_12px_25px_rgba(20,55,73,0.07)]">
              <Laptop className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="absolute bottom-[2%] left-[50%] -translate-x-1/2 whitespace-nowrap rounded-full border border-[#d2e3e2] bg-[#f7fbfa]/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#58747d]" data-testid="text-category-caption">
              Phones · tablets · wearables
            </div>
          </div>
        </section>

        <section className="rise-in-delay grid gap-3 border-t border-[#d7e4e4] pt-5 sm:grid-cols-3 sm:gap-6 sm:pt-7" aria-label="Shop categories">
          <div className="flex items-center gap-3 rounded-xl bg-[#f8fcfb]/65 px-3 py-3 sm:bg-transparent sm:px-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e1f1ef] text-[#087f8c]"><Smartphone className="h-[17px] w-[17px]" aria-hidden="true" /></span>
            <span className="text-[13px] font-semibold text-[#284756]" data-testid="text-category-phones">Phones & tablets</span>
            <ChevronRight className="ml-auto h-4 w-4 text-[#82a0a4] sm:hidden" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#f8fcfb]/65 px-3 py-3 sm:bg-transparent sm:px-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e1f1ef] text-[#087f8c]"><Watch className="h-[17px] w-[17px]" aria-hidden="true" /></span>
            <span className="text-[13px] font-semibold text-[#284756]" data-testid="text-category-wearables">Wearables</span>
            <ChevronRight className="ml-auto h-4 w-4 text-[#82a0a4] sm:hidden" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#f8fcfb]/65 px-3 py-3 sm:bg-transparent sm:px-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e1f1ef] text-[#087f8c]"><Headphones className="h-[17px] w-[17px]" aria-hidden="true" /></span>
            <span className="text-[13px] font-semibold text-[#284756]" data-testid="text-category-accessories">Everyday accessories</span>
            <ChevronRight className="ml-auto h-4 w-4 text-[#82a0a4] sm:hidden" aria-hidden="true" />
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 text-[11px] leading-5 text-[#748891] sm:flex-row sm:items-center sm:justify-between">
          <span data-testid="text-independent-retailer">Device Store is an independent retailer and is not affiliated with Samsung.</span>
          <Link href="/sign-up" className="inline-flex items-center gap-1 font-semibold text-[#55747c] hover:text-[#087f8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f8c]" data-testid="link-footer-signup">Get started <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
        </footer>
      </div>
    </main>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/user-portal" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function UserPortal() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  return (
    <>
      <Show when="signed-in">
        <main className="shop-shell shop-grain min-h-[100dvh] px-5 py-6 sm:px-8">
          <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] max-w-5xl flex-col">
            <header className="flex items-center justify-between">
              <Link href="/user-portal" className="inline-flex items-center gap-3" data-testid="link-portal-brand">
                <img src={`${basePath}/logo.svg`} alt="" className="h-9 w-9" />
                <span className="font-[Manrope] text-[15px] font-extrabold tracking-[-0.045em] text-[#183142]">Device Store</span>
              </Link>
              <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className="rounded-full border border-[#ceddde] bg-white/70 px-4 py-2 text-[12px] font-semibold text-[#345360] hover:border-[#087f8c] hover:text-[#087f8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f8c]" data-testid="button-sign-out">Sign out</button>
            </header>
            <section className="my-auto py-16">
              <div className="max-w-[660px] rounded-[28px] border border-[#d7e5e5] bg-white/80 p-7 shadow-[0_24px_64px_rgba(18,51,69,0.08)] backdrop-blur-sm sm:p-12">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e1f1ef] text-[#087f8c]"><CircleUserRound className="h-6 w-6" aria-hidden="true" /></div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#568087]" data-testid="text-portal-eyebrow">Your account</p>
                <h1 className="mt-3 font-[Manrope] text-3xl font-extrabold tracking-[-0.055em] text-[#183142] sm:text-[42px]" data-testid="text-welcome-heading">
                  {isLoaded ? `Welcome${user?.firstName ? `, ${user.firstName}` : ''}.` : 'Welcome.'}
                </h1>
                <p className="mt-4 max-w-[500px] text-[15px] leading-7 text-[#647b85]" data-testid="text-portal-description">
                  You’re signed in. Your Device Store account is ready whenever you want to browse phones, tablets, wearables and accessories.
                </p>
                <div className="mt-8 border-t border-[#e5eeee] pt-6">
                  <span className="text-[12px] text-[#70858d]" data-testid="text-portal-account-email">{user?.primaryEmailAddress?.emailAddress ?? 'Account details are available in your profile.'}</span>
                </div>
              </div>
            </section>
            <footer className="border-t border-[#d7e4e4] py-5 text-[11px] text-[#748891]" data-testid="text-portal-footer">Independent retailer · Not affiliated with Samsung</footer>
          </div>
        </main>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <main className="shop-shell shop-grain flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 w-full">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </main>
  );
}

function SignUpPage() {
  return (
    <main className="shop-shell shop-grain flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 w-full">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </main>
  );
}

function AppRoutes() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/user-portal" component={UserPortal} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/register">
          <Redirect to="/sign-up" />
        </Route>
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
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to your Device Store account',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'A few details and you’re ready to browse',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPubKey) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
  }

  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkAppRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
