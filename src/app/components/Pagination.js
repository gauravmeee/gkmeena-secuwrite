import { getPageNumbers } from "../utils/entryUtils";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = getPageNumbers(currentPage, totalPages);
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8 mb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Previous
      </button>
      
      <div className="flex gap-1">
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              className={`px-3 py-2 rounded-md transition-colors ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Next
      </button>
    </div>
  );
} 