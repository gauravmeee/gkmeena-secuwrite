import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemType = "entry" }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-red-500/30 p-6 max-w-md w-full">
        <div className="flex items-start mb-4">
          <div className="bg-red-500/10 p-3 rounded-full mr-4">
            <FiAlertTriangle className="text-red-500" size={24} />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Delete {itemType}</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <p className="mt-2 text-gray-300">
              Are you sure you want to delete this {itemType}? This action cannot be undone.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 