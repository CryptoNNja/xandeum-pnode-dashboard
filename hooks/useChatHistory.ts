'use client';

import { useState, useEffect } from 'react';
import { Message } from 'ai';

const STORAGE_KEY = 'xandeum_chat_history';
const ANON_ID_KEY = 'xandeum_anon_id';
const MAX_MESSAGES = 50;

// Helper to get anonymous ID synchronously
function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

export function useChatHistory() {
  const [anonymousId, setAnonymousId] = useState<string>('');

  // Get or create anonymous ID
  useEffect(() => {
    setAnonymousId(getAnonymousId());
  }, []);

  // Load chat history from localStorage
  const loadHistory = (): Message[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const anonId = getAnonymousId();
      const stored = localStorage.getItem(`${STORAGE_KEY}_${anonId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    return [];
  };

  // Save chat history to localStorage
  const saveHistory = (messages: Message[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      const anonId = getAnonymousId();
      // Keep only last N messages
      const trimmed = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(
        `${STORAGE_KEY}_${anonId}`,
        JSON.stringify(trimmed)
      );
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  // Clear chat history
  const clearHistory = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const anonId = getAnonymousId();
      localStorage.removeItem(`${STORAGE_KEY}_${anonId}`);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  return {
    anonymousId,
    loadHistory,
    saveHistory,
    clearHistory,
  };
}
