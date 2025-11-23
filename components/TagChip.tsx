import React from 'react';

interface TagChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isSelected?: boolean;
}

const TagChip: React.FC<TagChipProps> = ({ label, isSelected, className = '', ...props }) => {
  return (
    <button
      type="button"
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap cursor-pointer
        ${isSelected 
          ? 'bg-coffee-900 text-volt-400 border-coffee-900 shadow-md hover:shadow-lg' 
          : 'bg-white text-coffee-800 border-coffee-200 hover:border-coffee-900 hover:bg-coffee-50'
        }
        ${className}
      `}
      {...props}
    >
      {label}
    </button>
  );
};

export default TagChip;