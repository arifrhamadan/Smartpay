import React from 'react';
import { motion } from 'motion/react';
import { TypingText } from './TypingText';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showGreeting?: boolean;
  userDisplayName?: string;
  isDashboard?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showGreeting = false,
  userDisplayName = 'User',
  isDashboard = false
}: PageHeaderProps) {
  const userShortName = userDisplayName.split(' ')[0] || 'User';

  return (
    <div className="flex flex-col space-y-2">
      {/* Greeting Area (Dashboard only) */}
      {isDashboard && showGreeting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2 flex flex-col items-start"
        >
          <span className="flex items-center gap-2 text-primary font-display font-black text-sm uppercase tracking-widest leading-none">
            Hi, {userShortName} <span className="animate-bounce">👋</span>
          </span>
          <span className="text-on-surface-variant/70 font-semibold text-xs mt-1.5 tracking-wide">
            Have a nice day.
          </span>
        </motion.div>
      )}

      {/* Typing Title Area (Always Typing) */}
      <h2 className="text-on-surface font-display text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black tracking-tight leading-none min-h-[40px] sm:min-h-[48px] py-1 flex items-center">
        <TypingText text={title} speed={50} />
      </h2>

      {/* Subtitle Area (Fade Up for Dashboard, static for other pages) */}
      {isDashboard ? (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-on-surface-variant font-medium text-xs sm:text-sm md:text-base opacity-85 leading-relaxed max-w-2xl mt-1"
        >
          {subtitle}
        </motion.p>
      ) : (
        <p className="text-on-surface-variant font-medium text-xs sm:text-sm md:text-base opacity-85 leading-relaxed max-w-2xl mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
