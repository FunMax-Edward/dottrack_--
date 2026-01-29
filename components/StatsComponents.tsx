import React from 'react';
import { Attempt } from '../types';

interface MiniDayProps {
  date: Date;
  attempts: Attempt[];
  onClick: (dateStr: string) => void;
  isToday: boolean;
}

export const CalendarDayCell: React.FC<MiniDayProps> = ({ date, attempts, onClick, isToday }) => {
  const dateStr = date.toISOString().split('T')[0];
  
  // Filter attempts for this specific day
  const dayAttempts = attempts.filter(a => a.dateStr === dateStr);
  
  const total = dayAttempts.length;
  const correct = dayAttempts.filter(a => a.status === 'correct').length;
  const incorrect = dayAttempts.filter(a => a.status === 'incorrect').length;
  
  // Heatmap intensity logic
  let bgColor = 'bg-white';
  let borderColor = isToday ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100';
  
  if (total > 0) {
    const successRate = correct / total;
    if (successRate > 0.8) bgColor = 'bg-emerald-50';
    else if (successRate < 0.5) bgColor = 'bg-rose-50';
    else bgColor = 'bg-yellow-50';
  }

  // Bar proportions
  const greenPct = total ? (correct / total) * 100 : 0;
  const redPct = total ? (incorrect / total) * 100 : 0;

  return (
    <div 
      onClick={() => onClick(dateStr)}
      className={`
        relative h-24 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md
        flex flex-col justify-between
        ${bgColor} ${borderColor}
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs font-bold ${isToday ? 'text-primary-600' : 'text-gray-500'}`}>
          {date.getDate()}
        </span>
        {total > 0 && (
            <span className="text-[10px] font-mono text-gray-400">{total} done</span>
        )}
      </div>

      {total > 0 ? (
        <div className="space-y-1">
           <div className="flex gap-1 text-[10px] text-gray-600">
             {correct > 0 && <span className="text-emerald-600">✓{correct}</span>}
             {incorrect > 0 && <span className="text-rose-600">✗{incorrect}</span>}
           </div>
           
           {/* Visual Ratio Bar */}
           <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
             <div style={{ width: `${greenPct}%` }} className="bg-emerald-400 h-full" />
             <div style={{ width: `${redPct}%` }} className="bg-rose-400 h-full" />
           </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
        </div>
      )}
    </div>
  );
};
