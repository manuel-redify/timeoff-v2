export function AuthLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="min-h-screen flex flex-col">
        {/* Navigation skeleton */}
        <div className="border-b bg-white dark:bg-zinc-950 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="flex items-center gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <main className="flex-1 p-6 container mx-auto">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>

            {/* Content cards skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
                  <div className="space-y-4">
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function PageLoadingSkeleton({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
        <p className="text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  )
}