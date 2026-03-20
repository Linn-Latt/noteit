"use client";
import { useState } from "react";
import Sidebar from "./sidebar";
import NoteEditor from "./note-editor";

export default function NoteLayout({ userName }: { userName: string }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <Sidebar userName={userName} onNoteSelect={setSelectedNoteId} selectedNoteId={selectedNoteId} />
      <NoteEditor noteId={selectedNoteId} />
    </div>
  );
}
