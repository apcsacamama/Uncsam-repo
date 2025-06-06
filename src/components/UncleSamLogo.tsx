import React from "react";

interface UncleSamLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UncleSamLogo({
  size = "md",
  className = "",
}: UncleSamLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Circle with Car Icon */}
      <div
        className={`${sizeClasses[size]} bg-white rounded-full p-1 flex items-center justify-center shadow-lg`}
      >
        <div className="bg-red-600 rounded-full w-full h-full flex items-center justify-center">
          {/* Car Icon SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            {/* Car body */}
            <path d="M5 17H3a1 1 0 0 1-1-1v-3a2 2 0 0 1 2-2h1l1.5-4.5A2 2 0 0 1 8.5 5h7a2 2 0 0 1 2 1.5L19 11h1a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-2" />
            {/* Front wheel */}
            <circle cx="7" cy="17" r="2" />
            {/* Rear wheel */}
            <circle cx="17" cy="17" r="2" />
            {/* Car windows */}
            <path d="M7 11h10" />
            <path d="M7 8h10" />
          </svg>
        </div>
      </div>

      {/* Text Logo */}
      <div className="text-white font-bold leading-tight">
        <div className={`${textSizeClasses[size]} font-bold tracking-wide`}>
          UNCLE SAM
        </div>
        <div
          className={`${size === "sm" ? "text-xs" : "text-sm"} font-normal text-red-100 tracking-wider`}
        >
          TOURS
        </div>
      </div>
    </div>
  );
}
