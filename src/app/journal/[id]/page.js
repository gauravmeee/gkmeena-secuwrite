"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import Footer from "../../components/Footer";
import { useAuth } from "../../../context/AuthContext";
import databaseUtils from "../../../lib/database";

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
          try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);

            if (isUuid) {
              const entries = await databaseUtils.getJournalEntries(user.id);
              const foundEntry = entries.find((e) => e.id === params.id);

              if (foundEntry) {
                setEntry(foundEntry);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error("Error loading from Supabase:", error);
          }
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
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id);

        if (isUuid) {
          await databaseUtils.deleteJournalEntry(entry.id, user.id);
          router.push("/journal");
          return;
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <p className="text-xl">Entry not found</p>
            <Link href="/journal" className="text-primary hover:underline">
              Return to Journal
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link href="/journal" className="flex items-center gap-2 text-primary hover:underline">
            <FiArrowLeft size={16} />
            <span>Back to Journal</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/journal/edit/${entry.id || params.id}`}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <FiEdit2 size={16} />
              <span>Edit</span>
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <FiTrash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Journal entry display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[calc(100vh-16rem)] flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-white">{entry.title}</h1>
              <div className="text-gray-300 text-sm">{formatDateTime(entry.date)}</div>
            </div>
          </div>

          <div className="p-6 flex-1 bg-white">
            <div
              className="prose prose-gray max-w-none text-gray-800"
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

      <Footer />
    </div>
  );
}
