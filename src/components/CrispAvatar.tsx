import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface CrispAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  sizeClassName?: string;
}

export function CrispAvatar({ src, name, email, className, sizeClassName = "w-10 h-10" }: CrispAvatarProps) {
  const [hasError, setHasError] = useState(false);
  
  // Decide initials
  const fallbackChar = (name && name.trim().length > 0)
    ? name.trim().charAt(0).toUpperCase()
    : (email && email.trim().length > 0)
      ? email.trim().charAt(0).toUpperCase()
      : 'A';

  const hasImage = src && src.trim().length > 0 && src !== 'null' && !hasError;

  return (
    <div className={cn(
      "rounded-full bg-linear-to-br from-primary/10 to-primary/30 overflow-hidden ring-2 ring-primary/15 dark:ring-white/10 flex items-center justify-center shrink-0 select-none relative shadow-inner", 
      sizeClassName,
      className
    )}>
      {hasImage ? (
        <img 
          src={src!} 
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center transition-opacity duration-300"
          alt={name || "Avatar"} 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary via-primary/95 to-primary/80 text-white font-bold font-display select-none">
          {fallbackChar}
        </div>
      )}
    </div>
  );
}
