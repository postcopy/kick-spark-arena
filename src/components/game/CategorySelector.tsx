import React from 'react';
import { CATEGORY_PRESETS, type CategoryId } from '../../config/categoryPresets';

interface CategorySelectorProps {
  selected: CategoryId | null;
  onSelect: (id: CategoryId) => void;
}

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  return (
    <div className="w-full">
      <p className="text-white/60 text-xs uppercase tracking-wider mb-2 text-center">
        Categoria
      </p>
      <div className="flex gap-2 justify-center flex-wrap">
        {CATEGORY_PRESETS.map((preset) => {
          const isSelected = selected === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg
                border-2 transition-all duration-200 min-w-[72px]
                ${isSelected
                  ? 'border-white bg-white/20 scale-105 shadow-lg shadow-white/10'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }
              `}
              aria-label={`Categoria ${preset.label} - ${preset.ageRange}`}
              aria-pressed={isSelected}
            >
              <span className="text-lg leading-none">{preset.emoji}</span>
              <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {preset.label}
              </span>
              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-white/40'}`}>
                {preset.ageRange}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-white/40 text-[10px] text-center mt-1.5">
          Ajuste os parametros abaixo para personalizar
        </p>
      )}
    </div>
  );
}
