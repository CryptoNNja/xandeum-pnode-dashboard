'use client';

import { useState } from 'react';
import { STOINCCalculatorButton } from './STOINCCalculatorButton';
import { STOINCCalculatorModal } from './STOINCCalculatorModal';

export function STOINCCalculatorWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <STOINCCalculatorButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      <STOINCCalculatorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
