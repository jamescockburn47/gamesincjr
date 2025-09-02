export default function GamesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-32 mb-8 animate-pulse"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border shadow-sm">
            <div className="aspect-video bg-gray-200 rounded-t-lg animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
