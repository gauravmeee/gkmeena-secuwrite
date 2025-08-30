"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Loading from "@/components/common/Loading";
import DeleteConfirmationModal from "../../../components/common/DeleteConfirmationModal";
import EntryLockProtection from "../../../components/EntryLockProtection";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import databaseUtils from "../../../lib/database";
import { BackButton, EditDeleteButton } from "@/components/common/LinkButtons";
import { EntryNotFound } from "@/components/common/EntryNotFound";

// Function to format the date
const formatDateTime = (dateString) => {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  // Adding suffix to day
  const daySuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const formattedDate = `${day}${daySuffix(day)} ${month} ${year}`;
  const formattedTime = `${(hours % 12) || 12}:${minutes.toString().padStart(2, "0")} ${period}`;
  return `${formattedDate} | ${formattedTime}`;
};

export default function JournalEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function loadEntry() {
      setLoading(true);
      try {
        if (user) {
          // Use databaseUtils to get the entry (this will handle decryption)
          const entry = await databaseUtils.getJournalEntry(params.id, user.id);

          if (!entry) {
            throw new Error("Entry not found");
          }

          setEntry(entry);
          setLoading(false);
          return;
        }

        // Fallback to localStorage
        if (typeof window !== "undefined") {
          const entries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
          const entryIndex = parseInt(params.id);
          if (entryIndex >= 0 && entryIndex < entries.length) {
            setEntry(entries[entryIndex]);
          }
        }
      } catch (error) {
        console.error("Error loading entry:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEntry();
  }, [params.id, user]);

  const handleDelete = async () => {
    try {
      if (user && entry?.id) {
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', entry.id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        router.push("/journal");
        return;
      }

      const entries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
      const entryIndex = parseInt(params.id);
      if (entryIndex >= 0 && entryIndex < entries.length) {
        entries.splice(entryIndex, 1);
        localStorage.setItem("journalEntries", JSON.stringify(entries));
        router.push("/journal");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Could not delete entry. Please try again.");
    }
  };

  {/* --------------------------- Main JSX ------------------------- */}
  return (
    <EntryLockProtection entryType="journal">

      {/* ------- Loading ------- */}
      {loading ? (
        <Loading/>
        //  ------- Entry Not Found ------- 
      ) : !entry ? (
        
        <EntryNotFound EntryType={"journal"} />
      ) : (

        //  ------- Main Page -------
        <div className="min-h-screen text-text-primary bg-background">
          {/* !!!!!!!!!!!!! max-w-4xl (in edit its 6xl)*/}
          <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
          <div className="flex items-center justify-between mb-6">

          {/* -- Back Button -- */}
          <BackButton
            href = "/journal"
          />

        {/* -- Edit & Delete Button -- */}
          <EditDeleteButton
            editLink={`/journal/edit/${entry.id}`}
            onDelete={() => setIsDeleteModalOpen(true)}
          />

          </div>

          {/* ------- Journal Container ------- */}
          <div className="bg-bg-primary rounded-xl shadow-sm border border-border-primary overflow-hidden min-h-[calc(100vh-70rem)] flex flex-col">
            
            {/* Journal Container - Header */}
            <div className="bg-bg-secondary border-b border-border-primary p-4">
              <div className="flex items-center justify-between">

                {/* -- Title --*/}
                <h1 className="text-xl font-semibold">{entry.title}</h1>

                {/* -- DateTime --*/}
                <div className="text-text-secondary">{formatDateTime(entry.created_at || entry.date)}</div>
              </div>
            </div>

          {/* ------- Diaary Container - Body ------- */}
            <div className="p-6 flex-1 bg-bg-primary">
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </div>
          </div>
        </main>

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemType="journal entry"
        />
          </div>
      )}
    </EntryLockProtection>
  );
}
