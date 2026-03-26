"use client";
import { useState } from "react";
import Sidebar from "./sidebar";
import NoteEditor from "./note-editor";

export default function NoteLayout({ userName }: { userName: string }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [desktopOpen, setDesktopOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Desktop burger — only visible when sidebar is collapsed */}
      {!desktopOpen && (
        <button
          onClick={() => setDesktopOpen(true)}
          className="hidden md:flex fixed top-4 left-4 z-50 p-2 bg-background border border-foreground/10 rounded-md hover:bg-foreground/5 transition-colors"
          aria-label="Open sidebar"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="5" x2="16" y2="5" />
            <line x1="2" y1="9" x2="16" y2="9" />
            <line x1="2" y1="13" x2="16" y2="13" />
          </svg>
        </button>
      )}
      <Sidebar
        userName={userName}
        onNoteSelect={setSelectedNoteId}
        onNoteDeselect={() => setSelectedNoteId(null)}
        selectedNoteId={selectedNoteId}
        desktopOpen={desktopOpen}
        onDesktopClose={() => setDesktopOpen(false)}
      />
      <main className="flex-1 flex flex-col min-h-0">
        <NoteEditor noteId={selectedNoteId} />
      </main>
    </div>
  );
}
