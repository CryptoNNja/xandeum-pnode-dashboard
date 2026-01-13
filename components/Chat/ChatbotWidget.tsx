'use client';

import { useState, useEffect } from 'react';
import { FloatingButton } from './FloatingButton';
import { ChatPanel } from './ChatPanel';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut: Ctrl+K to toggle
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <>
      <FloatingButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
