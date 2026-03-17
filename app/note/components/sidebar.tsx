"use client";

import { useEffect, useState } from "react";

type Notebook = { id: string; name: string };
type Note = { id: string; title: string };

export default function Sidebar({ userName }: { userName: string }) {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [showNotebookForm, setShowNotebookForm] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newNoteTitle, setNewNoteTitle] = useState("");

    useEffect(() => {
        fetch("/api/notebooks").then((r) => r.ok ? r.json() : []).then(setNotebooks);
        fetch("/api/notes").then((r) => r.ok ? r.json() : []).then(setNotes);
    }, []);

    async function handleCreateNotebook(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        const res = await fetch("/api/notebooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() }),
        });

        const notebook = await res.json();
        setNotebooks([...notebooks, notebook]);
        setNewName("");
        setShowNotebookForm(false);
    }

    async function handleCreateNote(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newNoteTitle }),
        });
        console.log(res);
        return;
        const note = await res.json();
        setNotes([...notes, note]);
        setNewNoteTitle("");
        setShowNoteForm(false);
    }

    return (
        <aside className="w-64 h-screen flex flex-col border-r border-foreground/10 py-6 bg-background">
            {/* User name */}

            {/* User name */}
            <div className="flex items-center gap-3 px-4 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                    {userName.split(" ").slice(0, 3).map(w => w[0]).join("").toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
            </div>


            <div className="h-px bg-stone-800 dark:bg-stone-400 mb-4"></div>

            {/* Notebooks header */}
            <div className="flex items-center justify-between mb-3 px-4">
                <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Notebooks</span>
                <button
                    onClick={() => setShowNotebookForm(true)}
                    className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none"
                    title="New notebook"
                >
                    +
                </button>
            </div>

            {/* Notebook list */}
            <ul className="flex flex-col gap-1 px-4">
                {notebooks.map((nb) => (
                    <li key={nb.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/5 cursor-pointer">
                        {/* Book icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <span className="flex-1 text-sm truncate">{nb.name}</span>
                        {/* Down arrow */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </li>
                ))}
            </ul>

            {/* Quick Notes section */}
            <div className="mt-auto flex flex-col gap-1">
                <div className="flex items-center justify-between px-4 mb-1">
                    <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Quick Notes</span>
                    <button
                        onClick={() => setShowNoteForm(true)}
                        className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none"
                        title="New quick note"
                    >
                        +
                    </button>
                </div>
                <ul className="flex flex-col gap-1 px-4">
                    {notes.map((note) => (
                        <li key={note.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/5 cursor-pointer">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="flex-1 text-sm truncate">{note.title}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Create notebook popup */}
            {showNotebookForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <form
                        onSubmit={handleCreateNotebook}
                        className="bg-background rounded-xl p-6 w-72 flex flex-col gap-4 shadow-lg"
                    >
                        <h2 className="text-sm font-semibold">New Notebook</h2>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Notebook name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#44A194] transition-colors"
                        />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowNotebookForm(false)} className="text-xs text-foreground/50 hover:text-foreground">
                                Cancel
                            </button>
                            <button type="submit" className="rounded-md bg-[#EC8F8D] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Create note popup */}
            {showNoteForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <form
                        onSubmit={handleCreateNote}
                        className="bg-background rounded-xl p-6 w-72 flex flex-col gap-4 shadow-lg"
                    >
                        <h2 className="text-sm font-semibold">New Note</h2>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Title"
                            value={newNoteTitle}
                            onChange={(e) => setNewNoteTitle(e.target.value)}
                            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#44A194] transition-colors"
                        />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowNoteForm(false)} className="text-xs text-foreground/50 hover:text-foreground">
                                Cancel
                            </button>
                            <button type="submit" className="rounded-md bg-[#EC8F8D] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </aside>
    )
}