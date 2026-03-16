import { useState } from 'react';
import type { ScoringOutput } from '../types';
import { CALENDLY_URL } from '../constants';
import { Button } from '../components/Button';
import { ScoreBadge } from '../components/ScoreBadge';
import { ScoreBar } from '../components/ScoreBar';

interface ResultsScreenProps {
  result: ScoringOutput;
  onReset: () => void;
}

export function ResultsScreen({ result, onReset }: ResultsScreenProps) {
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  if (result.disqualified) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 rounded-full bg-dark-card border border-dark-border flex items-center justify-center mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-dark-muted"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white">
            FlowDesk might not be the best fit right now
          </h2>

          {result.disqualifyReason && (
            <p className="text-dark-muted leading-relaxed">
              {result.disqualifyReason}
            </p>
          )}

          <p className="text-dark-muted text-sm">
            That said, we have some great resources that might help your team.
          </p>

          <div className="flex flex-col gap-3 pt-4">
            <Button variant="secondary" onClick={() => window.open('#', '_blank')}>
              Browse our resources
            </Button>
            <button
              onClick={onReset}
              className="text-sm text-dark-muted hover:text-white transition-colors cursor-pointer"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Here's what we found
          </h2>
          <p className="text-dark-muted text-sm">
            Your prospect qualification results
          </p>
        </div>

        {/* Score Badge */}
        <div className="flex justify-center">
          <ScoreBadge score={result.total} tier={result.tier} />
        </div>

        {/* Score Breakdown */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
          <ScoreBar label="Budget" score={result.budget} />
          <ScoreBar label="Authority" score={result.authority} />
          <ScoreBar label="Need" score={result.need} />
          <ScoreBar label="Timeline" score={result.timeline} />
        </div>

        {/* Summary */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <p className="text-sm text-dark-muted mb-1">Summary</p>
          <p className="text-white text-sm leading-relaxed">{result.summary}</p>
        </div>

        {/* CTA */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center space-y-4">
          {result.tier === 'high' && (
            <>
              <p className="text-accent font-medium">
                You're a strong fit. Book your demo.
              </p>
              <Button onClick={() => window.open(CALENDLY_URL, '_blank')}>
                Book your demo &rarr;
              </Button>
            </>
          )}

          {result.tier === 'medium' && (
            <>
              <p className="text-amber-400 font-medium">
                We'd like to learn more. Leave your email and we'll reach out.
              </p>
              {emailSubmitted ? (
                <p className="text-dark-muted text-sm">
                  Thanks! We'll be in touch soon.
                </p>
              ) : (
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-accent/50"
                  />
                  <Button
                    disabled={!email.includes('@')}
                    onClick={() => setEmailSubmitted(true)}
                  >
                    Submit
                  </Button>
                </div>
              )}
            </>
          )}

          {result.tier === 'low' && (
            <>
              <p className="text-red-400 font-medium">
                FlowDesk might not be the right fit right now.
              </p>
              <p className="text-dark-muted text-sm">
                Here's a resource that might help.
              </p>
              <Button
                variant="secondary"
                onClick={() => window.open('#', '_blank')}
              >
                Browse resources
              </Button>
            </>
          )}
        </div>

        {/* Start Over */}
        <div className="text-center">
          <button
            onClick={onReset}
            className="text-sm text-dark-muted hover:text-white transition-colors cursor-pointer"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
