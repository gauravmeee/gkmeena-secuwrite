"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function EntryTypeCard({ title, icon, description, path, bgColor, entryCount }) {
  const displayCount = entryCount !== undefined ? entryCount : 0;
  
  return (
    <Link 
      href={path}
      className="block group"
    >
      <div className={`p-6 rounded-xl transition-all duration-300 border overflow-hidden relative
        ${bgColor} hover:shadow-lg hover:shadow-primary/5 group-hover:border-primary/30 group-hover:translate-y-[-2px]`}
      >
        {/* Background pattern (subtle) */}
        <div className="absolute top-0 right-0 w-32 h-32 -mr-6 -mt-6 opacity-10 bg-black rounded-full"></div>
        
        <div className="relative z-10">
          <div className="text-3xl mb-3 transform transition group-hover:scale-110 inline-block">{icon}</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-700 text-sm mb-4">{description}</p>
          
          <div className="flex items-center justify-between">
            {/* Entry count with icon */}
            {displayCount > 0 ? (
              <div className="text-gray-700 text-sm font-medium">
                {displayCount} {displayCount === 1 ? 'entry' : 'entries'}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No entries yet</div>
            )}
            
            {/* Arrow icon that appears on hover */}
            <div className="text-primary opacity-0 transform translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
              <FiArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 