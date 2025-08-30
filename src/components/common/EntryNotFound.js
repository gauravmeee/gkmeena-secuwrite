"use client"
import Link from "next/link";

export function EntryNotFound({EntryType}){
  return(
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-24 px-4">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-xl">Entry not found</p>
          <Link
          href={`/${EntryType}`}
          className="text-primary hover:underline"
        >
          Return to {EntryType === "journal" ? "Journals" : EntryType === "diary" ? "Diaries" : EntryType}
        </Link>
        </div>
      </main>
    </div>
)}

export function NoDraftsFound({EntryType}){
return (
  <div className="min-h-screen bg-background">
    <main className="max-w-4xl mx-auto pt-24 px-4">
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <p className="text-xl">No drafts found</p>
        <Link
          href={`/${EntryType}`}
          className="text-primary hover:underline"
        >
          Return to {EntryType === "journal" ? "Journals" : EntryType === "diary" ? "Diaries" : EntryType}
        </Link>
      </div>
    </main>
  </div>
)}