import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  id?: string;
}

/**
 * Circular Equitas Brand Icon
 * Features the signature top-right red arc, left-to-bottom green arc forming a protective hand,
 * and the central blue square with the modern lowercase 'e' cutout.
 */
export function EquitasIcon({ className = 'h-10 w-10', size, id }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0`}
      style={style}
      id={id}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top-Right Red Arc */}
      <path
        d="M 50 6 A 44 44 0 0 1 90 70"
        fill="none"
        stroke="#c41a22"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Left-to-Bottom Green Arc and Protecting Hand */}
      <path
        d="M 50 6 A 44 44 0 0 0 14 74 A 44 44 0 0 0 71 91 C 75 90.5 77.5 88.5 78.5 86 C 79.5 83.5 77 81 74 81.5 C 67.5 82.5 61 83 55 81.5 C 49 80 44 76 46 72 C 47.5 69 52 69 57.5 70 C 64.5 71 72 69.5 76 66 C 78 64.2 78.5 61.5 76 60.5 C 73.5 59.5 71.5 61.5 69 63 C 64 66 57 67 51 67"
        fill="none"
        stroke="#009245"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Blue Square with Stylized 'e' Cutout */}
      {/* Outer Blue Square */}
      <path
        d="M 29 29 L 71 29 L 71 71 L 29 71 Z"
        fill="#1b4d8c"
      />
      {/* Top Loop Cutout (enclosed) */}
      <path
        d="M 37.5 37.5 L 62.5 37.5 L 62.5 46.5 L 37.5 46.5 Z"
        fill="#ffffff"
      />
      {/* Bottom Open Cutout (opens to the right) */}
      <path
        d="M 37.5 54.5 L 71 54.5 L 71 63.5 L 37.5 63.5 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

/**
 * Full Equitas Text Logo with the red arc above "equitas" and "Equitas Small Finance Bank" subtitle.
 */
export function EquitasTextLogo({ className = 'h-10 w-auto', id }: LogoProps) {
  return (
    <svg
      viewBox="0 0 200 65"
      className={`${className} shrink-0`}
      id={id}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red Arc Swoosh above text */}
      <path
        d="M 15 28 Q 100 5 185 28"
        fill="none"
        stroke="#c41a22"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      
      {/* "equitas" stylized text */}
      <text
        x="100"
        y="42"
        textAnchor="middle"
        fill="#1b4d8c"
        fontSize="28"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        letterSpacing="-1"
      >
        equitas
      </text>

      {/* "Equitas Small Finance Bank" subtitle */}
      <text
        x="100"
        y="55"
        textAnchor="middle"
        fill="#c41a22"
        fontSize="8"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        letterSpacing="0.2"
      >
        Equitas Small Finance Bank
      </text>
    </svg>
  );
}

/**
 * Combined horizontal lockup containing the circular brand icon and the text logo.
 */
export function EquitasCombinedLogo({ className = 'flex items-center gap-3' }: { className?: string }) {
  return (
    <div className={className} id="equitas-combined-logo">
      <EquitasIcon className="h-10 w-10" />
      <div className="flex flex-col">
        <EquitasTextLogo className="h-8 w-auto" />
      </div>
    </div>
  );
}
