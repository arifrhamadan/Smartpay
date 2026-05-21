import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  cursorColor?: string;
}

export function TypingText({
  text,
  className = "",
  delay = 0,
  speed = 60,
  cursorColor = "currentColor"
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingStarted, setIsTypingStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsTypingStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isTypingStarted) return;

    let index = 0;
    setDisplayedText(""); // Reset text on start
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isTypingStarted, speed]);

  return (
    <span className={`${className} inline-flex items-center`}>
      <span>{displayedText}</span>
      <span 
        className="ml-1 inline-block w-[2.5px] h-[1em] bg-current animate-pulse shrink-0"
        style={{ 
          backgroundColor: cursorColor, 
          verticalAlign: 'bottom',
          animation: 'smartPayBlink 0.9s step-end infinite' 
        }}
      />
      <style>{`
        @keyframes smartPayBlink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
