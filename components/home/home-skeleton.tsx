export function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      <div className="h-[82vh] bg-muted/40" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="h-8 w-48 rounded-lg bg-muted/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-muted/35" />
          ))}
        </div>
      </div>
    </div>
  );
}
