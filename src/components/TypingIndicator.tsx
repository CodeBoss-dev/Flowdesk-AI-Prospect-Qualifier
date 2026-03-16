export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold">
        A
      </div>
      <div className="bg-dark-card border border-dark-border px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1.5">
        <span
          className="w-2 h-2 bg-dark-muted rounded-full animate-bounce-dot"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="w-2 h-2 bg-dark-muted rounded-full animate-bounce-dot"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="w-2 h-2 bg-dark-muted rounded-full animate-bounce-dot"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </div>
  );
}
