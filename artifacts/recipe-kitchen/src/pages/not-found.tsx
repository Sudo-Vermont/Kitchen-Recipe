import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70dvh] w-full px-5 py-20">
      <Card className="mx-auto max-w-xl border-primary/20 bg-card panel-shadow">
        <CardContent className="p-8 text-center sm:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-primary text-primary-foreground"><AlertCircle className="h-8 w-8" /></div>
          <p className="ribbon-flat mt-7 inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">A small wrong turn</p>
          <h1 className="mt-3 text-[36px] tracking-tight">This page isn't on the menu.</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Let's get you back to the recipes. There are plenty of good things waiting.</p>
          <Button asChild className="mt-7" data-testid="button-not-found-home">
            <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
