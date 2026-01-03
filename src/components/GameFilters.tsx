'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, X } from 'lucide-react';

interface GameFiltersProps {
  allTags: string[];
  gameCount: number;
}

export default function GameFilters({ allTags, gameCount }: GameFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const tagsParam = searchParams.get('tags');
    const sortParam = searchParams.get('sort');

    if (tagsParam) {
      setSelectedTags(tagsParam.split(','));
    }
    if (sortParam) {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = (tags: string[], sort: string) => {
    const params = new URLSearchParams();
    if (tags.length > 0) {
      params.set('tags', tags.join(','));
    }
    if (sort !== 'newest') {
      params.set('sort', sort);
    }
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/games', { scroll: false });
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateURL(newTags, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateURL(selectedTags, newSort);
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSortBy('newest');
    router.push('/games', { scroll: false });
  };

  const hasActiveFilters = selectedTags.length > 0 || sortBy !== 'newest';

  return (
    <div className="mb-8">
      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-colors",
            showFilters ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs">
              {selectedTags.length + (sortBy !== 'newest' ? 1 : 0)}
            </span>
          )}
        </button>

        <span className="text-sm text-slate-500 font-medium">
          {gameCount} games
        </span>
      </div>

      {/* Filter Controls */}
      <div className={cn(
        "space-y-4",
        !showFilters && "hidden md:block"
      )}>
        {/* Tag Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-500 mr-2">Filter by:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                selectedTags.includes(tag)
                  ? "bg-primary text-white shadow-md scale-105"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sort and Clear */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-700 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="name">A-Z</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}

          <span className="hidden md:block text-sm text-slate-500 font-medium ml-auto">
            {gameCount} games
          </span>
        </div>

        {/* Active Filters Display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm text-slate-500">Active:</span>
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="category"
                className="gap-1 pr-1 cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
                <span className="p-0.5 rounded-full hover:bg-primary/20">
                  <X className="w-3 h-3" />
                </span>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
