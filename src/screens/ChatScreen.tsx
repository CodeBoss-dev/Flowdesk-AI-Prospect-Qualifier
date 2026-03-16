import { useEffect, useRef } from 'react';
import type { ScoringOutput } from '../types';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from '../components/ChatBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { ChatInput } from '../components/ChatInput';

interface ChatScreenProps {
  onComplete: (result: ScoringOutput) => void;
}

export function ChatScreen({ onComplete }: ChatScreenProps) {
  const { displayMessages, isLoading, result, error, startConversation, sendUserMessage } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startConversation();
    }
  }, [startConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => onComplete(result), 800);
      return () => clearTimeout(timer);
    }
  }, [result, onComplete]);

  return (
    <div className="flex-1 flex flex-col h-dvh">
      {/* Header */}
      <div className="border-b border-dark-border px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold">
          A
        </div>
        <div>
          <div className="text-sm font-medium text-white">Aria</div>
          <div className="text-xs text-dark-muted">FlowDesk Sales Assistant</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {displayMessages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="text-center text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendUserMessage} disabled={isLoading || !!result} />
    </div>
  );
}
