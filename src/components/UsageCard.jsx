import React from 'react';

export default function UsageCard({ title, current, Maxlimit, icon: Icon }) {
  // Handle unlimited (-1)
  const isUnlimited = Maxlimit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / Maxlimit) * 100, 100);
  
  // Dynamic color based on usage
  const getBarColor = () => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-amber-500';
    return 'bg-primary-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-primary-600">
          <Icon size={20} />
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-xl font-black text-gray-900 dark:text-white">
            {current} <span className="text-sm text-gray-400 font-medium">/ {isUnlimited ? '∞' : Maxlimit}</span>
          </p>
        </div>
      </div>

     {!isUnlimited && (
  <div className="space-y-2">
    {/* Progress Bar Container - Increased height to h-4 for text visibility */}
    <div className="relative w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-700/30">
      
      {/* The Actual Progress Fill */}
      <div 
        className={`h-full transition-all duration-1000 ease-out flex items-center justify-center ${getBarColor()}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      >
        {/* Percentage text inside the bar - only shows if bar is wide enough (> 20%) */}
        {percentage > 20 && (
          <span className="text-[9px] font-black text-white drop-shadow-sm whitespace-nowrap px-2">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Fallback percentage text outside the fill if the bar is too small (< 20%) */}
      {percentage <= 20 && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-gray-500 dark:text-gray-400">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>

    {/* Bottom Labels */}
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className={percentage > 90 ? 'text-red-500' : 'text-gray-400'}>
        Usage Status
      </span>
      
      {/* Warning message logic */}
      {percentage >= 85 && (
        <span className="text-red-500 animate-pulse flex items-center gap-1">
          <div className="w-1 h-1 bg-red-500 rounded-full" />
          Limit Near!
        </span>
      )}
    </div>
  </div>
)}
      
      {isUnlimited && (
        <div className="pt-2">
          <span className="text-[10px] font-black bg-green-50 text-green-600 px-2 py-1 rounded dark:bg-green-900/20 dark:text-green-400 uppercase">
            Unlimited Access
          </span>
        </div>
      )}
    </div>
  );
}