import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Happy 8th Birthday Henry! • Games Inc Jr",
  description: "A special custom game for Henry's 8th birthday celebration! Catch balloons while avoiding snapping crocodiles!",
};

export default function HappyBirthdayMonkeyPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <PageHeader
          align="center"
          eyebrow="Special Birthday Game"
          title="🎉 Happy 8th Birthday Henry! 🎉"
          description="A custom game created especially for Henry's 8th birthday celebration! Help Monkey catch colorful balloons (including special number 8 balloons worth 2 points!) while avoiding the snapping crocodiles. Use arrow keys or touch controls to play!"
        />

        <section className="mx-auto w-full max-w-4xl rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-100">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Play the Game!</h2>
            <p className="text-base leading-7 text-slate-600">
              Use arrow keys (← →) or the touch controls to move Monkey left and right. Catch balloons for points - special number 8 balloons are worth 2 points! Avoid the crocodiles to keep your 3 lives!
            </p>
          </div>

          {/* Game iframe */}
          <div className="relative w-full rounded-xl overflow-hidden border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="aspect-video">
              <iframe
                src="/demos/happy-birthday-monkey/index.html"
                className="absolute inset-0 h-full w-full"
                title="Happy 8th Birthday Henry Monkey Game"
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

