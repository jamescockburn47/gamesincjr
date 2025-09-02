'use client';

import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  gameTitle: string;
  hasDemo: boolean;
}

export default function ComingSoon({ gameTitle, hasDemo }: ComingSoonProps) {
  return (
    <section className="bg-gray-50 rounded-xl p-8 text-center">
      <h3 className="text-xl font-semibold mb-4">Download Coming Soon</h3>
      <p className="text-gray-600 mb-6">
        The full version of {gameTitle} will be available for download soon. 
        {hasDemo && ' Try the demo above to get a taste of the action!'}
      </p>
      <div className="flex gap-4 justify-center">
        {hasDemo && (
          <Button 
            variant="outline" 
            onClick={() => {
              const demoSection = document.querySelector('[data-demo-section]');
              demoSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Play Demo
          </Button>
        )}
        <Button 
          disabled 
          aria-disabled="true"
          title="Download will be available soon"
        >
          Coming Soon
        </Button>
      </div>
    </section>
  );
}
