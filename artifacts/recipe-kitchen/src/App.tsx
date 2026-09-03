import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/AppShell';
import Home from '@/pages/home';
import RecipeDetail from '@/pages/recipe-detail';
import AddRecipe from '@/pages/add-recipe';
import FromVideo from '@/pages/from-video';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={AppRoutes} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function AppRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/recipes/:id" component={RecipeDetail} />
        <Route path="/add" component={AddRecipe} />
        <Route path="/from-video" component={FromVideo} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      appearance={{
        theme: shadcn,
        cssLayerName: 'clerk',
        options: {
          logoPlacement: 'inside',
          logoLinkUrl: basePath || '/',
          logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
        },
        variables: {
          colorPrimary: '#f98b85',
          colorForeground: '#4a4a4a',
          colorMutedForeground: '#878787',
          colorDanger: '#c93a30',
          colorBackground: '#ffffff',
          colorInput: '#ffffff',
          colorInputForeground: '#4a4a4a',
          colorNeutral: '#e0e0e0',
          fontFamily: 'Open Sans, sans-serif',
          borderRadius: '3px',
        },
        elements: {
          rootBox: 'w-full flex justify-center',
          cardBox: 'bg-[#ffffff] rounded-none w-[440px] max-w-full overflow-hidden',
          card: '!shadow-none !border-0 !bg-transparent !rounded-none',
          footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
          headerTitle: 'font-serif text-[#4a4a4a]',
          headerSubtitle: 'text-[#878787]',
          socialButtonsBlockButtonText: 'text-[#4a4a4a]',
          formFieldLabel: 'text-[#4a4a4a]',
          footerActionLink: 'text-[#f98b85]',
          footerActionText: 'text-[#878787]',
          dividerText: 'text-[#878787]',
          identityPreviewEditButton: 'text-[#f98b85]',
          formFieldSuccessText: 'text-[#4a8a5c]',
          alertText: 'text-[#c93a30]',
          logoBox: 'h-12',
          logoImage: 'h-12 w-12',
          socialButtonsBlockButton: 'border-[#e0e0e0] bg-[#ffffff]',
          formButtonPrimary: 'bg-[#f98b85] hover:bg-[#e2726b]',
          formFieldInput: 'border-[#e0e0e0] bg-[#ffffff] text-[#4a4a4a]',
          footerAction: 'text-[#878787]',
          dividerLine: 'bg-[#e0e0e0]',
          alert: 'border-[#f6c4c0] bg-[#fdf0ef]',
          otpCodeFieldInput: 'border-[#e0e0e0] bg-[#ffffff] text-[#4a4a4a]',
          formFieldRow: 'text-[#4a4a4a]',
          main: 'bg-transparent',
        },
      }}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your kitchen' } },
        signUp: { start: { title: 'Create your kitchen account', subtitle: 'Save video recipes and more' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
