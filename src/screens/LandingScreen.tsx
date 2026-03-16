import { Button } from '../components/Button';

interface LandingScreenProps {
  onStart: () => void;
  onDashboard: () => void;
}

export function LandingScreen({ onStart, onDashboard }: LandingScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">
            FlowDesk
          </span>
        </div>
      </div>

      {/* Tagline */}
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight max-w-2xl">
        The last helpdesk your team will ever need
      </h1>

      {/* Subheading */}
      <p className="mt-4 text-dark-muted text-lg max-w-md">
        Not sure if FlowDesk is right for you? Let Aria find out in 2 minutes.
      </p>

      {/* CTA */}
      <div className="mt-10">
        <Button onClick={onStart}>Talk to Aria &rarr;</Button>
      </div>

      {/* Analytics link */}
      <div className="mt-20 flex flex-col items-center gap-2">
        <button
          onClick={onDashboard}
          className="text-xs text-dark-muted hover:text-accent transition-colors cursor-pointer"
        >
          View analytics dashboard →
        </button>
        <span className="text-dark-muted/40 text-xs">AI-powered prospect qualification</span>
      </div>
    </div>
  );
}
