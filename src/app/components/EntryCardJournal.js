"use client";

import { useState } from "react";
import Link from "next/link";
import { FiCheckSquare, FiSquare } from "react-icons/fi";

export default function EntryCard({ entry, isSelectionMode, isSelected, onSelectionChange, type }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSelectionToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange(entry.id, !isSelected);
  };

  return (
    <div
      className={`relative bg-gray-900 rounded-lg p-6 border border-gray-800 transition-all duration-300 ${
        isHovered ? "border-primary" : "hover:border-gray-700"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isSelectionMode && (
        <button
          onClick={handleSelectionToggle}
          className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors"
        >
          {isSelected ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
        </button>
      )}

      <Link href={`/${type}/${entry.id}`} className="block">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold text-white">
            {entry.title || "Untitled"}
          </h2>
          <span className="text-sm text-gray-400">{entry.dateTime}</span>
        </div>
        
        <p className="text-white line-clamp-3 mb-4">
          {entry.preview}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{entry.day}</span>
          <span>•</span>
          <span>{entry.time}</span>
        </div>
      </Link>
    </div>
  );
} 