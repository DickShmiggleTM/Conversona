
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <svg
      className="animate-spin h-6 w-6 text-[var(--accent-color)]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={{filter: 'drop-shadow(0 0 5px var(--accent-color))'}}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 3v2.34m0 13.32V21m8.66-8.66h-2.34m-13.32 0H3m15.5-5.84-1.65 1.65M7.15 16.85l-1.65 1.65M6.16 6.16 4.5 4.5m14.99 15-1.65-1.65"
        opacity="0.6"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
      />
    </svg>
  );
};

export default Spinner;
