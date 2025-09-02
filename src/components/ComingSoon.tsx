'use client';

import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  gameTitle: string;
  hasDemo: boolean;
}

export default function ComingSoon({ gameTitle, hasDemo }: ComingSoonProps) {
  return (
    <section className="bg-gray-50 rounded-xl p-8 text-center">
      <h3 className="text-xl font-semibold mb-4">More Levels Coming</h3>
      <p className="text-gray-600 mb-6">
        We&apos;re adding new stages and features to {gameTitle}. 
        {hasDemo && ' Play the demo above now; full content unlocks with a subscription.'}
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
      </div>
    </section>
  );
}
