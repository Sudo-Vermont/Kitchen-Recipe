import type { ReactNode } from 'react';

/**
 * Stand-in for `@clerk/react`, `@clerk/react/internal`, and `@clerk/themes`
 * used only by the static GitHub Pages build. Clerk needs a backend to issue
 * and verify sessions, which Pages cannot provide, so the demo reports a
 * signed-out state instead of crashing on a missing publishable key.
 *
 * `vite.config.ts` swaps the real packages for this module when VITE_DEMO=true.
 */

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return { isLoaded: true, isSignedIn: false, userId: null as string | null };
}

export function useClerk() {
  return {
    signOut: async () => {
      /* no session to end in the demo build */
    },
  };
}

function AuthNotice({ heading }: { heading: string }) {
  return (
    <div className="mx-auto max-w-md border border-card-border bg-card p-8 text-center panel-shadow">
      <p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
        Demo build
      </p>
      <h1 className="mt-4 text-[26px]">{heading}</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        This is the static GitHub Pages preview, so there is no server to sign you in against. Run the
        full app to use accounts and video import.
      </p>
      <a
        href={import.meta.env.BASE_URL}
        className="mt-6 inline-block bg-primary px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.03em] text-primary-foreground transition-colors hover:bg-accent"
      >
        Back to the recipes
      </a>
    </div>
  );
}

export function SignIn() {
  return <AuthNotice heading="Sign-in is off in the demo" />;
}

export function SignUp() {
  return <AuthNotice heading="Registration is off in the demo" />;
}

/** Replaces `@clerk/react/internal`'s host-based key lookup. */
export function publishableKeyFromHost(): string {
  return '';
}

/** Replaces the `shadcn` theme object from `@clerk/themes`. */
export const shadcn = {};
