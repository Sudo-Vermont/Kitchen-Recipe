import type { ReactNode } from 'react';
import { useAuth, useClerk } from '@clerk/react';
import {
  Film,
  House,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
  Utensils,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

const navLinks: Array<[string, string]> = [
  ['/', 'Home'],
  ['/?view=recipes', 'Recipes'],
  ['/add', 'Add recipe'],
  ['/from-video', 'From video'],
];

function breadcrumbFor(location: string): string | null {
  if (location === '/' || location.startsWith('/?')) return null;
  if (location.startsWith('/recipes/')) return 'Recipe';
  if (location.startsWith('/add')) return 'Submit a recipe';
  if (location.startsWith('/from-video')) return 'Recipe from video';
  if (location.startsWith('/sign-in')) return 'Login';
  if (location.startsWith('/sign-up')) return 'Register';
  return 'Page';
}

/** Coral square used for the three header actions in the reference layout. */
function HeaderAction({
  href,
  onClick,
  icon: Icon,
  label,
  disabled = false,
  testId,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof Search;
  label: string;
  disabled?: boolean;
  testId: string;
}) {
  const body = (
    <>
      <Icon className="h-5 w-5" />
      <span className="mt-1.5 hidden max-w-[74px] text-center text-[9px] font-semibold uppercase leading-[1.15] tracking-[0.03em] lg:block">
        {label}
      </span>
    </>
  );
  const shell =
    'flex h-[62px] w-[62px] flex-col items-center justify-center bg-primary text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60 lg:h-[76px] lg:w-[86px]';
  if (href) {
    return (
      <Link href={href} className={shell} aria-label={label} data-testid={testId}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={shell} aria-label={label} data-testid={testId}>
      {body}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const isHome = location === '/' || location.startsWith('/?');
  const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const crumb = breadcrumbFor(location);

  const handleSignOut = () => {
    void signOut({ redirectUrl: `${window.location.origin}${appBasePath || '/'}` });
  };

  const isActive = (href: string) => {
    if (href === '/') return isHome && !location.includes('view=recipes');
    if (href === '/?view=recipes') return location.includes('view=recipes');
    return location.startsWith(href);
  };

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0">
      <header className="pt-4 lg:pt-6">
        <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
          <div className="flex items-stretch justify-between bg-card panel-shadow">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 lg:px-7">
              <Link href="/" className="flex items-baseline gap-0.5" data-testid="link-home">
                <span className="font-logo text-[26px] leading-none text-foreground lg:text-[30px]">Recipe</span>
                <span className="font-logo text-[26px] leading-none text-primary lg:text-[30px]">Kitchen</span>
              </Link>
              <nav className="hidden items-center gap-1 md:flex">
                {navLinks.map(([href, label]) => (
                  <Link
                    key={label}
                    href={href}
                    data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`px-3.5 py-2 text-[13px] font-semibold uppercase tracking-[0.02em] transition-colors ${
                      isActive(href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/75 hover:text-primary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex shrink-0 items-stretch">
              <HeaderAction href="/add" icon={Utensils} label="Submit a recipe" testId="button-header-add" />
              {isLoaded && isSignedIn ? (
                <HeaderAction onClick={handleSignOut} icon={LogOut} label="Sign out" testId="button-sign-out" />
              ) : (
                <HeaderAction
                  href="/sign-in"
                  icon={isLoaded ? LogIn : UserRound}
                  label={isLoaded ? 'My account' : 'Loading'}
                  disabled={!isLoaded}
                  testId="button-header-sign-in"
                />
              )}
              <HeaderAction href="/?focus=search" icon={Search} label="Search for recipes" testId="link-search" />
            </div>
          </div>

          {crumb && (
            <div className="mt-5 border-b border-foreground/10 pb-2 text-[13px] text-foreground/70" data-testid="breadcrumb">
              <Link href="/" className="transition-colors hover:text-primary">
                Home
              </Link>
              <span className="px-2 text-foreground/40">/</span>
              <span className="text-foreground/90">{crumb}</span>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <section className="mt-14 hidden bg-primary md:block">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-7 text-primary-foreground sm:flex-row">
          <p className="text-lg">Got a dish everyone asks you for? Add it to the kitchen.</p>
          <Link
            href="/add"
            className="bg-card px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.03em] text-primary transition-colors hover:bg-secondary"
            data-testid="link-cta-add"
          >
            Share a recipe
          </Link>
        </div>
      </section>

      <footer className="bg-card">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-7 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Recipe Kitchen · {new Date().getFullYear()}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {navLinks.map(([href, label]) => (
              <Link key={label} href={href} className="transition-colors hover:text-primary">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-5 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
        aria-label="Primary navigation"
      >
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <Link
            href="/"
            className={`flex min-w-14 flex-col items-center gap-1 text-[10px] font-semibold uppercase ${isHome ? 'text-primary' : 'text-muted-foreground'}`}
            data-testid="mobile-nav-home"
          >
            <House className="h-5 w-5" fill={isHome ? 'currentColor' : 'none'} /> Home
          </Link>
          <Link
            href="/?focus=search"
            className="flex min-w-14 flex-col items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground"
            data-testid="mobile-nav-search"
          >
            <Search className="h-5 w-5" /> Search
          </Link>
          <Link
            href="/add"
            className="flex h-12 w-12 -translate-y-4 items-center justify-center bg-primary text-primary-foreground shadow-lg"
            aria-label="Add recipe"
            data-testid="mobile-nav-add"
          >
            <Plus className="h-6 w-6" />
          </Link>
          <Link
            href="/from-video"
            className={`flex min-w-14 flex-col items-center gap-1 text-[10px] font-semibold uppercase ${location === '/from-video' ? 'text-primary' : 'text-muted-foreground'}`}
            data-testid="mobile-nav-video"
          >
            <Film className="h-5 w-5" /> Video
          </Link>
          <Link
            href="/"
            className="flex min-w-14 flex-col items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground"
            data-testid="mobile-nav-bag"
          >
            <ShoppingBag className="h-5 w-5" /> Bag
          </Link>
        </div>
      </nav>
    </div>
  );
}
