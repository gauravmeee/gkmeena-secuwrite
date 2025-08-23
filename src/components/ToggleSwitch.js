import { useState } from 'react';

export default function ToggleSwitch({ option1, option2, onChange }) {
  const [selected, setSelected] = useState(1);

  const handleToggle = (value) => {
    setSelected(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div className="relative bg-gray-900 p-0.5 rounded-xl flex shadow-inner shadow-black/30 border border-gray-800 overflow-hidden">
        {/* Background highlight that slides */}
        <div 
          className={`absolute inset-y-0.5 w-1/2 bg-primary/10 backdrop-blur-sm rounded-lg transition-transform duration-300 ease-out ${
            selected === 1 ? 'translate-x-0' : 'translate-x-full'
          }`}
        ></div>
        
        <button
          onClick={() => handleToggle(1)}
          className={`relative px-4 py-2 rounded-lg transition-all duration-200 font-medium z-10 ${
            selected === 1 
              ? 'text-primary' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {option1}
        </button>
        <button
          onClick={() => handleToggle(2)}
          className={`relative px-4 py-2 rounded-lg transition-all duration-200 font-medium z-10 ${
            selected === 2 
              ? 'text-primary' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {option2}
        </button>
      </div>
    </div>
  );
} 