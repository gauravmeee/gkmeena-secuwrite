"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import databaseUtils from "../../lib/database";
import NoEntriesState from "../components/NoEntriesState";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import ActionButtons from "../components/ActionButtons";
import EntryCard from "../components/EntryCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import { stripHtml, formatDateTime } from "../utils/entryUtils";

export default function JournalPage() {
  const [processedEntries, setProcessedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user, toggleAuthModal } = useAuth();

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        let entries = [];

        if (user) {
          const cloudEntries = await databaseUtils.getJournalEntries(user.id);
          entries = cloudEntries;
        } else if (typeof window !== "undefined") {
          entries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
        }

        const processed = entries.map((entry) => {
          const cleanContent = stripHtml(entry.content);
          const preview = cleanContent.length > 250 
            ? `${cleanContent.substring(0, 250)}...`
            : cleanContent;

          return {
            ...entry,
            preview,
            dateTime: formatDateTime(entry.timestamp || entry.date || Date.now()),
          };
        });

        setProcessedEntries(processed);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user]);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEntries(new Set());
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedEntries.size === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      const entriesToDelete = Array.from(selectedEntries);
      const success = await databaseUtils.deleteManyJournalEntries(user.id, entriesToDelete);
      
      if (success) {
        setProcessedEntries(entries => 
          entries.filter(entry => !selectedEntries.has(entry.id))
        );
        setSelectedEntries(new Set());
        setIsSelectionMode(false);
        
        const newTotalPages = Math.ceil((processedEntries.length - selectedEntries.size) / entriesPerPage);
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages || 1);
        }
      } else {
        throw new Error('Failed to delete entries');
      }
    } catch (error) {
      console.error("Error deleting entries:", error);
      alert("Failed to delete entries. Please try again.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleSelectionChange = (entryId, isSelected) => {
    const newSelected = new Set(selectedEntries);
    if (isSelected) {
      newSelected.add(entryId);
    } else {
      newSelected.delete(entryId);
    }
    setSelectedEntries(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSelected}
        itemType={`${selectedEntries.size} journal ${selectedEntries.size === 1 ? 'entry' : 'entries'}`}
      />
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Journal</h1>
          <ActionButtons 
            user={user}
            hasEntries={processedEntries.length > 0}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedEntries.size}
            onToggleSelection={handleToggleSelectionMode}
            onDeleteSelected={handleDeleteSelected}
            type="journal"
          />
        </div>

        {processedEntries.length === 0 ? (
          <NoEntriesState type="Journal" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5">
              {processedEntries
                .slice(
                  (currentPage - 1) * entriesPerPage,
                  currentPage * entriesPerPage
                )
                .map((entry) => (
                  <EntryCard
                    key={entry.id || entry.timestamp}
                    entry={entry}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedEntries.has(entry.id)}
                    onSelectionChange={handleSelectionChange}
                    type="journal"
                  />
                ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(processedEntries.length / entriesPerPage)}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>
    </div>
  );
}