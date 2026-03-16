import { useState, useCallback } from 'react';
import type { AppScreen, ScoringOutput } from './types';
import { LandingScreen } from './screens/LandingScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { DashboardScreen } from './screens/DashboardScreen';

function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [result, setResult] = useState<ScoringOutput | null>(null);

  const handleStart = useCallback(() => setScreen('chat'), []);

  const handleComplete = useCallback((scoringResult: ScoringOutput) => {
    setResult(scoringResult);
    setScreen('results');
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setScreen('landing');
  }, []);

  const handleDashboard = useCallback(() => setScreen('dashboard'), []);

  return (
    <>
      {screen === 'landing' && <LandingScreen onStart={handleStart} onDashboard={handleDashboard} />}
      {screen === 'chat' && <ChatScreen onComplete={handleComplete} />}
      {screen === 'results' && result && (
        <ResultsScreen result={result} onReset={handleReset} />
      )}
      {screen === 'dashboard' && <DashboardScreen onBack={handleReset} />}
    </>
  );
}

export default App;
