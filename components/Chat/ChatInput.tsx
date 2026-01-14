'use client';

import { Send } from 'lucide-react';
import { FormEvent, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }, [input]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <div className="p-4 border-t border-border">
      <form onSubmit={handleSubmit} data-chat-form className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about nodes, stats, network..."
          disabled={isLoading}
          className="
            flex-1 resize-none rounded-lg
            px-4 py-3 text-sm
            bg-muted/50 border border-border
            focus:border-purple-500 focus:ring-1 focus:ring-purple-500
            placeholder:text-muted-foreground
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            max-h-32
          "
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="
            px-4 py-3 rounded-lg
            bg-gradient-to-r from-purple-600 to-blue-600
            text-white font-medium
            hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-opacity
            flex items-center justify-center
          "
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter to send • Shift+Enter for new line</span>
        <span className={input.length > 1800 ? 'text-amber-500' : ''}>
          {input.length} / 2000
        </span>
      </div>
    </div>
  );
}
