export function RecipeSkeleton() {
  return (
    <div className="border border-card-border bg-card panel-shadow" data-testid="skeleton-recipe">
      <div className="skeleton-shimmer aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-5 w-3/4" />
        <div className="skeleton-shimmer h-3 w-full" />
        <div className="skeleton-shimmer h-3 w-2/3" />
      </div>
      <div className="skeleton-shimmer mx-4 mb-4 h-8" />
    </div>
  );
}
