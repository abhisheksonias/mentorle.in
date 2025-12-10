"use client";

import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";

/**
 * Save status indicator component
 * Shows the current autosave status with appropriate icon and message
 */
export default function SaveStatus({ status, lastSaved, error }) {
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Saving...',
          className: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case 'saved':
        return {
          icon: <Check className="h-4 w-4" />,
          text: 'Saved',
          className: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          text: error || 'Save failed',
          className: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'idle':
      default:
        if (lastSaved) {
          return {
            icon: <Cloud className="h-4 w-4" />,
            text: `Last saved ${formatTime(lastSaved)}`,
            className: 'text-gray-500 bg-gray-50 border-gray-200'
          };
        }
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        text-sm font-medium rounded-full border
        transition-all duration-300 ease-in-out
        ${config.className}
      `}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

