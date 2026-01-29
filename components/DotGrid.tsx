import React from 'react';
import { ProjectUnit, QuestionStatus } from '../types';
import { getQuestionKey } from '../services/storage';

interface DotGridProps {
  unit: ProjectUnit;
  statusMap: Map<string, QuestionStatus>;
  onToggle: (unitId: string, qIndex: number, currentStatus: QuestionStatus) => void;
  filter?: 'all' | 'incorrect' | 'unattempted';
}

const DotGrid: React.FC<DotGridProps> = ({ unit, statusMap, onToggle, filter = 'all' }) => {
  const dots = [];

  for (let i = 1; i <= unit.count; i++) {
    const key = getQuestionKey(unit.id, i);
    const status = statusMap.get(key) || 'unattempted';

    if (filter === 'incorrect' && status !== 'incorrect') continue;
    if (filter === 'unattempted' && status !== 'unattempted') continue;

    let bgClass = 'bg-gray-200 hover:bg-gray-300'; // Default unattempted
    if (status === 'correct') bgClass = 'bg-emerald-500 hover:bg-emerald-600';
    if (status === 'incorrect') bgClass = 'bg-rose-500 hover:bg-rose-600';

    dots.push(
      <button
        key={i}
        onClick={() => onToggle(unit.id, i, status)}
        className={`
          w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200
          ${bgClass}
          ${status === 'unattempted' ? 'text-gray-500' : 'text-white'}
        `}
        title={`Unit ${unit.name} - Question ${i}`}
      >
        {i}
      </button>
    );
  }

  if (dots.length === 0) {
    return (
      <div className="text-gray-400 text-sm italic py-2">
        No questions match this filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
      {dots}
    </div>
  );
};

export default React.memo(DotGrid);