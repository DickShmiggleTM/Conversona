import React from 'react';

const CodexSymbol: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2 L12 22" />
      <path d="M2 12 L22 12" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="8" />
      <path d="M5.636 5.636 L18.364 18.364" />
      <path d="M5.636 18.364 L18.364 5.636" />
    </svg>
  );
};

export default CodexSymbol;
