
import React, { useMemo } from 'react';

interface IntercomTextProps {
  fullText: string;        // The complete message
  keywords: string[];      // Words that render clearly (case-insensitive match)
  revealed?: boolean;      // If true, show all text clearly (for journal/replay)
  className?: string;
  /** How many characters to show (for typewriter effect). undefined = show all */
  visibleChars?: number;
}

// Industrial/terminal garble characters
const GARBLE_CHARS = '░▒▓█▐▌╪╫╬─│┤├┬┴┼';

/**
 * Seeded pseudo-random number generator.
 * Deterministic: same seed always produces same sequence.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Strip leading/trailing punctuation from a word for keyword matching.
 * Returns the core word without surrounding punctuation.
 */
function stripPunctuation(word: string): string {
  return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
}

/**
 * Extract trailing punctuation from a word.
 */
function getTrailingPunctuation(word: string): string {
  const match = word.match(/[^a-zA-Z0-9]+$/);
  return match ? match[0] : '';
}

/**
 * Extract leading punctuation from a word.
 */
function getLeadingPunctuation(word: string): string {
  const match = word.match(/^[^a-zA-Z0-9]+/);
  return match ? match[0] : '';
}

interface ProcessedWord {
  isKeyword: boolean;
  display: string;     // The rendered text (garbled or clear)
  original: string;    // The original word
}

export const IntercomText: React.FC<IntercomTextProps> = ({
  fullText,
  keywords,
  revealed = false,
  className = '',
  visibleChars,
}) => {
  const processedWords = useMemo(() => {
    const keywordsLower = keywords.map(k => k.toLowerCase());
    const words = fullText.split(/(\s+)/); // Split but preserve whitespace tokens

    let wordIndex = 0;
    return words.map((token): ProcessedWord => {
      // Whitespace tokens pass through as-is
      if (/^\s+$/.test(token)) {
        return { isKeyword: false, display: token, original: token };
      }

      const coreWord = stripPunctuation(token);
      const leading = getLeadingPunctuation(token);
      const trailing = getTrailingPunctuation(token);
      const isKeyword = keywordsLower.includes(coreWord.toLowerCase());

      const currentIndex = wordIndex;
      wordIndex++;

      if (revealed || isKeyword) {
        return { isKeyword, display: token, original: token };
      }

      // Garble: replace each character of the core word with a static character
      const rng = seededRandom(currentIndex * 7919 + 31);
      const garbled = coreWord
        .split('')
        .map(() => GARBLE_CHARS[Math.floor(rng() * GARBLE_CHARS.length)])
        .join('');

      return {
        isKeyword: false,
        display: leading + garbled + trailing,
        original: token,
      };
    });
  }, [fullText, keywords, revealed]);

  // Build the full display string for character counting
  const fullDisplay = processedWords.map(w => w.display).join('');
  const showAll = visibleChars === undefined || visibleChars >= fullDisplay.length;

  // Render spans, applying the visibleChars cutoff
  let charsRendered = 0;

  return (
    <p className={`leading-relaxed ${className}`}>
      {processedWords.map((word, i) => {
        if (!showAll && charsRendered >= visibleChars!) {
          return null;
        }

        let displayText = word.display;

        if (!showAll) {
          const remaining = visibleChars! - charsRendered;
          if (displayText.length > remaining) {
            displayText = displayText.slice(0, remaining);
          }
        }

        charsRendered += word.display.length;

        // Whitespace tokens — render as plain text
        if (/^\s+$/.test(word.original)) {
          return <span key={i}>{displayText}</span>;
        }

        if (word.isKeyword) {
          return (
            <span
              key={i}
              className="text-green-400 font-semibold"
            >
              {displayText}
            </span>
          );
        }

        // Garbled word
        return (
          <span
            key={i}
            className="text-slate-600 font-mono"
          >
            {displayText}
          </span>
        );
      })}
    </p>
  );
};
