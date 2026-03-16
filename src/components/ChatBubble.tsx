interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isAria = role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAria ? 'justify-start' : 'justify-end'}`}>
      {isAria && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold mt-1">
          A
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAria
            ? 'bg-dark-card border border-dark-border text-white rounded-tl-md'
            : 'bg-accent text-white rounded-tr-md'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
