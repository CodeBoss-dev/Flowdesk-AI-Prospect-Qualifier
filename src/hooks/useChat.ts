import { useState, useCallback } from 'react';
import type { ChatMessage, DisplayMessage, ScoringOutput } from '../types';
import { SYSTEM_PROMPT, FORCE_JSON_INSTRUCTION, MAX_USER_TURNS } from '../constants';
import { sendMessage } from '../lib/groq';
import { parseResponse } from '../lib/parseResponse';
import { computeScore } from '../lib/scoring';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: SYSTEM_PROMPT },
  ]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScoringOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userTurnCount, setUserTurnCount] = useState(0);

  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const initialMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    try {
      const response = await sendMessage(initialMessages);
      const qualification = parseResponse(response);

      if (qualification) {
        // Unlikely on first turn, but handle it
        setResult(computeScore(qualification));
      } else {
        const updatedMessages: ChatMessage[] = [
          ...initialMessages,
          { role: 'assistant', content: response },
        ];
        setMessages(updatedMessages);
        setDisplayMessages([{ role: 'assistant', content: response }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      const newUserTurnCount = userTurnCount + 1;
      setUserTurnCount(newUserTurnCount);

      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      const updatedDisplay: DisplayMessage[] = [
        ...displayMessages,
        { role: 'user', content: trimmed },
      ];
      setDisplayMessages(updatedDisplay);

      let updatedMessages: ChatMessage[] = [...messages, userMessage];

      // Force final JSON if max turns reached
      if (newUserTurnCount >= MAX_USER_TURNS) {
        updatedMessages = [
          ...updatedMessages,
          { role: 'system', content: FORCE_JSON_INSTRUCTION },
        ];
      }

      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const response = await sendMessage(updatedMessages);
        const qualification = parseResponse(response);

        if (qualification) {
          setResult(computeScore(qualification));
        } else {
          const withAssistant: ChatMessage[] = [
            ...updatedMessages,
            { role: 'assistant', content: response },
          ];
          setMessages(withAssistant);
          setDisplayMessages([
            ...updatedDisplay,
            { role: 'assistant', content: response },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, displayMessages, isLoading, userTurnCount],
  );

  return {
    displayMessages,
    isLoading,
    result,
    error,
    startConversation,
    sendUserMessage,
  };
}
