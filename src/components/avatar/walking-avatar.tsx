'use client';

import React from 'react';

interface WalkingAvatarProps {
  size?: number;
  className?: string;
}

export function WalkingAvatar({ size = 200, className = '' }: WalkingAvatarProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size * 1.4 }}
    >
      <style>{`
        @keyframes lr-walk-bob {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-3px); }
          50% { transform: translateY(-5px); }
          75% { transform: translateY(-3px); }
        }
        @keyframes lr-walk-leg-left {
          0% { transform: rotate(-25deg); }
          25% { transform: rotate(0deg); }
          50% { transform: rotate(25deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(-25deg); }
        }
        @keyframes lr-walk-leg-right {
          0% { transform: rotate(25deg); }
          25% { transform: rotate(0deg); }
          50% { transform: rotate(-25deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(25deg); }
        }
        @keyframes lr-walk-arm-left {
          0% { transform: rotate(20deg); }
          25% { transform: rotate(0deg); }
          50% { transform: rotate(-20deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(20deg); }
        }
        @keyframes lr-walk-arm-right {
          0% { transform: rotate(-20deg); }
          25% { transform: rotate(0deg); }
          50% { transform: rotate(20deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(-20deg); }
        }
        @keyframes lr-glow-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.08); }
        }
        @keyframes lr-shadow-pulse {
          0%, 100% { transform: scaleX(1); opacity: 0.08; }
          50% { transform: scaleX(0.85); opacity: 0.12; }
        }
        @keyframes lr-briefcase-swing {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes lr-hair-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
        .lr-avatar-body {
          animation: lr-walk-bob 0.7s ease-in-out infinite;
        }
        .lr-avatar-leg-left {
          animation: lr-walk-leg-left 0.7s ease-in-out infinite;
          transform-origin: 100px 140px;
        }
        .lr-avatar-leg-right {
          animation: lr-walk-leg-right 0.7s ease-in-out infinite;
          transform-origin: 100px 140px;
        }
        .lr-avatar-arm-left {
          animation: lr-walk-arm-left 0.7s ease-in-out infinite;
          transform-origin: 82px 88px;
        }
        .lr-avatar-arm-right {
          animation: lr-walk-arm-right 0.7s ease-in-out infinite;
          transform-origin: 118px 88px;
        }
        .lr-avatar-glow {
          animation: lr-glow-pulse 2.5s ease-in-out infinite;
        }
        .lr-avatar-shadow {
          animation: lr-shadow-pulse 0.7s ease-in-out infinite;
          transform-origin: center;
        }
        .lr-avatar-briefcase {
          animation: lr-briefcase-swing 0.7s ease-in-out infinite;
          transform-origin: 122px 130px;
        }
        .lr-avatar-hair {
          animation: lr-hair-bounce 0.7s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="lr-avatar-glow absolute rounded-full blur-3xl"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          top: size * 0.15,
          left: size * 0.05,
          background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(20,184,166,0.15) 40%, transparent 70%)',
        }}
      />

      <svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 200 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          {/* Body gradient */}
          <linearGradient id="lr-shirt-grad" x1="75" y1="80" x2="125" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          {/* Skin gradient */}
          <linearGradient id="lr-skin-grad" x1="90" y1="20" x2="110" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCD9A8" />
            <stop offset="100%" stopColor="#F5B870" />
          </linearGradient>
          {/* Pants gradient */}
          <linearGradient id="lr-pants-grad" x1="82" y1="130" x2="118" y2="185" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          {/* Shoe gradient */}
          <linearGradient id="lr-shoe-grad" x1="78" y1="172" x2="122" y2="185" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          {/* Briefcase gradient */}
          <linearGradient id="lr-case-grad" x1="112" y1="122" x2="134" y2="142" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#92702B" />
            <stop offset="100%" stopColor="#6B5210" />
          </linearGradient>
          {/* Hair gradient */}
          <linearGradient id="lr-hair-grad" x1="78" y1="10" x2="122" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B2314" />
            <stop offset="100%" stopColor="#1F1209" />
          </linearGradient>
          {/* Tie gradient */}
          <linearGradient id="lr-tie-grad" x1="97" y1="82" x2="103" y2="118" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        <g className="lr-avatar-body">
          {/* Left Arm (behind body) */}
          <g className="lr-avatar-arm-left">
            <rect x="68" y="86" width="14" height="40" rx="7" fill="url(#lr-shirt-grad)" />
            <rect x="68" y="88" width="14" height="6" rx="3" fill="#0D9668" opacity="0.5" />
            <ellipse cx="75" cy="128" rx="6.5" ry="7" fill="url(#lr-skin-grad)" />
          </g>

          {/* Right Arm (in front) */}
          <g className="lr-avatar-arm-right">
            <rect x="118" y="86" width="14" height="40" rx="7" fill="url(#lr-shirt-grad)" />
            <rect x="118" y="88" width="14" height="6" rx="3" fill="#0D9668" opacity="0.5" />
            <ellipse cx="125" cy="128" rx="6.5" ry="7" fill="url(#lr-skin-grad)" />
          </g>

          {/* Torso */}
          <rect x="78" y="82" width="44" height="60" rx="8" fill="url(#lr-shirt-grad)" />
          
          {/* Shirt collar lines */}
          <path d="M92 82 L100 94 L108 82" stroke="#047857" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
          
          {/* Tie */}
          <path d="M97 94 L100 120 L103 94 Z" fill="url(#lr-tie-grad)" />
          <path d="M97 94 L100 98 L103 94 Z" fill="#B45309" opacity="0.4" />
          
          {/* Belt */}
          <rect x="78" y="136" width="44" height="6" rx="2" fill="#1F2937" />
          <rect x="96" y="136.5" width="8" height="5" rx="1" fill="#6B7280" />
          
          {/* Neck */}
          <rect x="93" y="68" width="14" height="17" rx="5" fill="url(#lr-skin-grad)" />
          
          {/* Head */}
          <ellipse cx="100" cy="46" rx="25" ry="28" fill="url(#lr-skin-grad)" />
          
          {/* Hair */}
          <g className="lr-avatar-hair">
            <path d="M75 40 Q75 12 100 10 Q125 12 125 40 Q125 30 118 22 Q110 16 100 18 Q90 16 82 22 Q75 30 75 40Z" fill="url(#lr-hair-grad)" />
            {/* Side hair */}
            <path d="M75 38 Q73 44 75 50" stroke="#1F1209" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M125 38 Q127 44 125 50" stroke="#1F1209" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          
          {/* Ears */}
          <ellipse cx="75" cy="48" rx="4" ry="6" fill="url(#lr-skin-grad)" />
          <ellipse cx="75" cy="48" rx="2.5" ry="4" fill="#E8A862" opacity="0.3" />
          <ellipse cx="125" cy="48" rx="4" ry="6" fill="url(#lr-skin-grad)" />
          <ellipse cx="125" cy="48" rx="2.5" ry="4" fill="#E8A862" opacity="0.3" />
          
          {/* Eyes */}
          <ellipse cx="91" cy="44" rx="3.5" ry="4" fill="white" />
          <ellipse cx="109" cy="44" rx="3.5" ry="4" fill="white" />
          <ellipse cx="92" cy="44" rx="2" ry="2.5" fill="#1A1A2E" />
          <ellipse cx="110" cy="44" rx="2" ry="2.5" fill="#1A1A2E" />
          <ellipse cx="92.5" cy="43" rx="0.8" ry="1" fill="white" />
          <ellipse cx="110.5" cy="43" rx="0.8" ry="1" fill="white" />
          
          {/* Eyebrows */}
          <path d="M85.5 38 Q91 35 96.5 38" stroke="#2D1810" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M103.5 38 Q109 35 114.5 38" stroke="#2D1810" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M99 48 L97 54 L100 55 L103 54 L101 48" fill="#E8A862" opacity="0.5" />
          
          {/* Smile */}
          <path d="M92 58 Q100 65 108 58" stroke="#C47A3A" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Briefcase */}
          <g className="lr-avatar-briefcase">
            <rect x="112" y="124" width="22" height="16" rx="3" fill="url(#lr-case-grad)" />
            <rect x="116" y="120" width="14" height="6" rx="2.5" fill="#A67C1A" stroke="#7A5C14" strokeWidth="0.5" />
            <line x1="123" y1="124" x2="123" y2="140" stroke="#5C4210" strokeWidth="1" />
            <rect x="121" y="130" width="4" height="3" rx="1" fill="#B8912A" />
          </g>

          {/* Left Leg */}
          <g className="lr-avatar-leg-left">
            <rect x="82" y="140" width="16" height="35" rx="6" fill="url(#lr-pants-grad)" />
            <rect x="78" y="170" width="22" height="12" rx="5" fill="url(#lr-shoe-grad)" />
            <rect x="78" y="170" width="22" height="4" rx="2" fill="#4B5563" />
          </g>

          {/* Right Leg */}
          <g className="lr-avatar-leg-right">
            <rect x="102" y="140" width="16" height="35" rx="6" fill="url(#lr-pants-grad)" />
            <rect x="98" y="170" width="22" height="12" rx="5" fill="url(#lr-shoe-grad)" />
            <rect x="98" y="170" width="22" height="4" rx="2" fill="#4B5563" />
          </g>
        </g>

        {/* Ground shadow */}
        <ellipse className="lr-avatar-shadow" cx="100" cy="192" rx="38" ry="6" fill="black" opacity="0.08" />
        
        {/* Sparkle particles around avatar */}
        <circle cx="50" cy="60" r="1.5" fill="#10B981" opacity="0.6">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="60;55;60" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="155" cy="75" r="1" fill="#14B8A6" opacity="0.5">
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="75;70;75" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="45" cy="120" r="1.2" fill="#059669" opacity="0.4">
          <animate attributeName="opacity" values="0.1;0.6;0.1" dur="3s" repeatCount="indefinite" />
          <animate attributeName="cy" values="120;114;120" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="45" r="1.3" fill="#10B981" opacity="0.5">
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="45;40;45" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="42" cy="90" r="0.8" fill="#34D399" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="158" cy="110" r="1" fill="#10B981" opacity="0.4">
          <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
