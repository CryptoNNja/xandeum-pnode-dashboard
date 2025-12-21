"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Country {
  name: string;
  code: string;
}

interface FlagsCarouselProps {
  countries: Country[];
  maxVisible?: number;
}

export const FlagsCarousel = ({ countries, maxVisible = 8 }: FlagsCarouselProps) => {
  const [visibleCountries, setVisibleCountries] = useState<Country[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (countries.length === 0) return;

    // Initialize with first batch
    const initialBatch = countries.slice(0, Math.min(maxVisible, countries.length));
    setVisibleCountries(initialBatch);

    // Rotate countries every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % countries.length;
        
        // Get next batch with wraparound
        const nextBatch: Country[] = [];
        for (let i = 0; i < maxVisible; i++) {
          const index = (nextIndex + i) % countries.length;
          nextBatch.push(countries[index]);
        }
        
        setVisibleCountries(nextBatch);
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [countries, maxVisible]);

  if (countries.length === 0) return null;

  return (
    <div className="relative w-full h-12 overflow-hidden">
      {/* Semi-transparent overlay background */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(90deg, rgba(123, 63, 242, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Flags container */}
      <div className="relative h-full flex items-center justify-center gap-3 px-4">
        <AnimatePresence mode="popLayout">
          {visibleCountries.map((country, index) => (
            <motion.div
              key={`${country.code}-${currentIndex}-${index}`}
              initial={{ 
                opacity: 0, 
                scale: 0.5,
                y: 20,
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.5,
                y: -20,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.08, // Staggered wave effect
                ease: "easeOut",
              }}
              className="flex-shrink-0"
              title={country.name}
            >
              <div className="relative w-8 h-6 rounded overflow-hidden shadow-md hover:scale-110 transition-transform">
                {/* Flag image from flagcdn */}
                <img
                  src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                  alt={`${country.name} flag`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const emoji = document.createElement('div');
                      emoji.className = 'w-full h-full flex items-center justify-center text-xl';
                      emoji.textContent = getFlagEmoji(country.code);
                      parent.appendChild(emoji);
                    }
                  }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Gradient edges for fade effect */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(var(--bg-app-rgb), 0.8), transparent)',
        }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgba(var(--bg-app-rgb), 0.8), transparent)',
        }}
      />
    </div>
  );
};

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}
