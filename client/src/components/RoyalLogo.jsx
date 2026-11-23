import React from 'react';

export default function RoyalLogo({ className = 'w-10 h-10', title = 'Roja Traders' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={`${className} shrink-0 drop-shadow-md`}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="goldMetallicComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CA9E5A" />
          <stop offset="25%" stopColor="#FDF0CD" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="75%" stopColor="#F3E5AB" />
          <stop offset="100%" stopColor="#996515" />
        </linearGradient>

        <linearGradient id="goldShineComp" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#996515" />
          <stop offset="30%" stopColor="#F3E5AB" />
          <stop offset="70%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>

        <radialGradient id="royalShieldBgComp" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="60%" stopColor="#022c22" />
          <stop offset="100%" stopColor="#01140e" />
        </radialGradient>
      </defs>

      {/* Circular Outer Shield with Gold Rim */}
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="url(#royalShieldBgComp)"
        stroke="url(#goldMetallicComp)"
        strokeWidth="4"
      />
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        stroke="url(#goldMetallicComp)"
        strokeWidth="1.2"
        strokeDasharray="3,3"
        opacity="0.8"
      />
      <circle
        cx="100"
        cy="100"
        r="84"
        fill="none"
        stroke="url(#goldMetallicComp)"
        strokeWidth="1.8"
      />

      {/* Royal Laurel Leaves */}
      <g fill="url(#goldMetallicComp)" opacity="0.85">
        <path d="M42,126 C40,118 46,114 50,116 C48,122 45,125 42,126 Z" />
        <path d="M46,140 C43,132 50,130 54,133 C51,138 48,140 46,140 Z" />
        <path d="M56,152 C52,146 58,142 63,146 C60,150 58,152 56,152 Z" />
        <path d="M70,163 C65,157 72,154 77,157 C74,161 72,163 70,163 Z" />
        <path d="M86,169 C82,164 89,161 93,164 C90,168 88,169 86,169 Z" />

        <path d="M158,126 C160,118 154,114 150,116 C152,122 155,125 158,126 Z" />
        <path d="M154,140 C157,132 150,130 146,133 C149,138 152,140 154,140 Z" />
        <path d="M144,152 C148,146 142,142 137,146 C140,150 142,152 144,152 Z" />
        <path d="M130,163 C135,157 128,154 123,157 C126,161 128,163 130,163 Z" />
        <path d="M114,169 C118,164 111,161 107,164 C110,168 112,169 114,169 Z" />
      </g>

      {/* Imperial Crown at Top */}
      <g fill="url(#goldShineComp)">
        <path d="M76,46 L82,34 L100,42 L118,34 L124,46 L120,49 L80,49 Z" />
        <circle cx="82" cy="33" r="2.5" />
        <circle cx="100" cy="39" r="3.2" />
        <circle cx="118" cy="33" r="2.5" />
        <rect x="79" y="49" width="42" height="3.5" rx="1.5" />
        <circle cx="86" cy="50.8" r="1" fill="#fff" opacity="0.9" />
        <circle cx="100" cy="50.8" r="1.3" fill="#fff" opacity="0.9" />
        <circle cx="114" cy="50.8" r="1" fill="#fff" opacity="0.9" />
      </g>

      {/* Central Intertwined RT Monogram */}
      <g id="rt-monogram">
        {/* Letter 'T' behind */}
        <path
          d="M78,67 L136,67 L136,75 L116,75 L116,140 L126,143 L126,147 L88,147 L88,143 L98,140 L98,75 L78,75 Z"
          fill="url(#goldMetallicComp)"
          opacity="0.95"
        />
        <path
          d="M82,69 L132,69 L132,73 L114,73 L114,138 L99,138 L99,73 L82,73 Z"
          fill="none"
          stroke="#FFF8DC"
          strokeWidth="0.8"
          opacity="0.6"
        />

        {/* Letter 'R' front */}
        <path
          d="M62,147 L62,143 L72,140 L72,83 L63,80 L63,76 L108,76 C124,76 135,84 135,97 C135,108 126,115 113,117 L132,140 L137,143 L137,147 L117,147 L98,120 L86,120 L86,140 L96,143 L96,147 Z M86,84 L86,112 L105,112 C116,112 121,107 121,98 C121,89 116,84 105,84 Z"
          fill="url(#goldShineComp)"
          stroke="#805300"
          strokeWidth="0.8"
        />
        <path
          d="M74,85 L74,138 M88,86 L104,86 C114,86 118,90 118,98 C118,105 114,110 104,110 L88,110 Z"
          fill="none"
          stroke="#FFF8DC"
          strokeWidth="0.8"
          opacity="0.75"
        />
      </g>

      {/* Ribbon: ROJA TRADERS */}
      <g>
        <path
          d="M46,160 L154,160 L146,172 L54,172 Z"
          fill="#01140e"
          stroke="url(#goldMetallicComp)"
          strokeWidth="1.2"
        />
        <polygon points="56,166 57.5,163 59,166 56.5,164.2 60,164.2" fill="url(#goldShineComp)" />
        <polygon points="144,166 142.5,163 141,166 143.5,164.2 140,164.2" fill="url(#goldShineComp)" />
        <text
          x="100"
          y="168.5"
          fontFamily="'Times New Roman', 'Georgia', serif"
          fontSize="8.5"
          fontWeight="900"
          fill="url(#goldShineComp)"
          letterSpacing="1.8"
          textAnchor="middle"
        >
          ROJA TRADERS
        </text>
      </g>
    </svg>
  );
}
