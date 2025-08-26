"use client"
import Link from "next/link";

export function EntryNotFound(){
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-24 px-4">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-xl">Entry not found</p>
          <Link href="/diary" className="text-primary hover:underline">
            Back
          </Link>
        </div>
      </main>
    </div>
}