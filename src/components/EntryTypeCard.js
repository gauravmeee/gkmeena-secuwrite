"use client";

import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

export default function EntryTypeCard({ title, icon, description, path, bgColor, entryCount }) {
  const displayCount = entryCount !== undefined ? entryCount : 0;
  
  return (
    <Link href={path} className="group">
      <div className="bg-bg-overlay backdrop-blur-sm rounded-xl shadow-sm border border-border-primary p-6 h-full 
        hover:border-primary/30 hover:shadow-lg transition-all duration-200 group-hover:translate-y-[-2px]">
        <div className="flex items-start flex-col h-full">
          <div className="flex w-full items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <span className="text-sm uppercase tracking-wider text-text-secondary font-medium">
                {title}
              </span>
            </div>
            {displayCount > 0 && (
              <div className="text-sm text-text-muted">
                {displayCount} {displayCount === 1 ? 'entry' : 'entries'}
              </div>
            )}
          </div>
          
          <p className="text-text-secondary text-sm line-clamp-3 mb-4 flex-grow">
            {description}
          </p>
          
          <div className="flex items-center gap-1 text-primary text-sm mt-auto pt-2 group-hover:underline">
            <span>Browse {title}</span>
            <FiChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
} 