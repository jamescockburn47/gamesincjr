export default function GameLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mt-2"></div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left: Hero Image */}
        <div className="aspect-video bg-gray-200 rounded-xl animate-pulse"></div>

        {/* Right: Tags, Price, Buy Button */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded-full w-12 animate-pulse"></div>
          </div>
          
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          
          <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="mb-12">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="relative w-full pb-[56.25%] bg-gray-200 rounded-xl animate-pulse"></div>
      </div>

      {/* Screenshots Grid */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
