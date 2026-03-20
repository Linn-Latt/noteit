"use client";

import { useEffect, useState } from "react";

type Notebook = { id: string; name: string; notes: Note[] };
type Note = { id: string; title: string };

export default function Sidebar({ userName, onNoteSelect, selectedNoteId }: {
    userName: string
    onNoteSelect: (id: string) => void;
    selectedNoteId: string | null;
}) {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [showNotebookForm, setShowNotebookForm] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newNoteTitle, setNewNoteTitle] = useState("");

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; notebookId: string } | null>(null);
    const [targetNotebookId, setTargetNotebookId] = useState<string | null>(null);
    const [expandedNotebookId, setExpandedNotebookId] = useState<string | null>(null);
    const [creatingNotebook, setCreatingNotebook] = useState(false);
    const [creatingNote, setCreatingNote] = useState(false);

    useEffect(() => {
        fetch("/api/notebooks").then((r) => r.ok ? r.json() : []).then(setNotebooks);
        fetch("/api/notes").then((r) => r.ok ? r.json() : []).then(setNotes);
    }, []);

    async function handleCreateNotebook(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreatingNotebook(true);
        const res = await fetch("/api/notebooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() }),
        });

        const notebook = await res.json();
        setNotebooks([...notebooks, notebook]);
        setNewName("");
        setCreatingNotebook(false);
        setShowNotebookForm(false);
    }

    async function handleCreateNote(e: React.FormEvent) {
        e.preventDefault();
        setCreatingNote(true);
        const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newNoteTitle, notebookId: targetNotebookId }),
        });
        const note = await res.json();
        onNoteSelect(note.id);

        if (targetNotebookId) {
            setNotebooks(notebooks.map((nb) =>
                nb.id === targetNotebookId ? { ...nb, notes: [...nb.notes, note] } : nb
            ));
        } else {
            setNotes([...notes, note]);
        }

        setNewNoteTitle("");
        setTargetNotebookId(null);
        setCreatingNote(false);
        setShowNoteForm(false);
    }

    return (
        <aside className="w-64 h-screen flex flex-col border-r border-foreground/10 py-6 bg-background">
            {/* User name */}

            {/* User name */}
            <div className="h-7 flex items-center gap-3 px-4 pb-6 mb-4 shadow-md">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EC8F8D] text-background text-xs font-bold">
                    {userName.split(" ").slice(0, 3).map(w => w[0]).join("").toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
            </div>


            {/* <div className="h-px bg-stone-800 dark:bg-stone-400 mb-4"></div> */}

            {/* Notebooks header */}
            <div className="flex items-center justify-between mb-3 px-4">
                <span className="text-xs font-medium text-foreground/200 uppercase tracking-wider">Notebooks</span>
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
                {notebooks.map((nb) => {
                    const isExpanded = expandedNotebookId === nb.id;
                    return (
                        <li
                            key={nb.id}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({ x: e.clientX, y: e.clientY, notebookId: nb.id });
                            }}
                            className="flex flex-col rounded-md"
                        >
                            {/* Notebook row */}
                            <div
                                onClick={() => setExpandedNotebookId(isExpanded ? null : nb.id)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/5 cursor-pointer"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                                <span className="flex-1 text-sm truncate">{nb.name}</span>
                                <svg
                                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>

                            {/* Notes — visible only when expanded */}
                            {isExpanded && (
                                <ul className="flex flex-col gap-0.5 pl-5 mt-0.5">
                                    {nb.notes.length === 0 ? (
                                        <li
                                            className="px-2 py-1 text-xs text-foreground/40 italic cursor-pointer hover:text-foreground/60 transition-colors"
                                            onClick={() => {
                                                setTargetNotebookId(nb.id);
                                                setShowNoteForm(true);
                                            }}
                                        >
                                            No notes yet — create one
                                        </li>
                                    ) : nb.notes.map((note) => (
                                        <li
                                            key={note.id}
                                            onClick={() => onNoteSelect(note.id)}
                                            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-foreground/5 cursor-pointer"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                            <span className="text-sm truncate">{note.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* Quick Notes */}
            <ul className="flex flex-col gap-1 px-4 pt-4">
                {notes.map((note) => (
                    <li
                        key={note.id}
                        onClick={() => onNoteSelect(note.id)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/5 cursor-pointer"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="flex-1 text-sm truncate">{note.title}</span>
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
                            <button type="submit" disabled={creatingNotebook} className="rounded-md bg-[#EC8F8D] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60">
                                {creatingNotebook ? "Creating..." : "Create"}
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
                            <button type="submit" disabled={creatingNote} className="rounded-md bg-[#EC8F8D] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60">
                                {creatingNote ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                    <div
                        className="fixed z-50 bg-background border border-foreground/10 rounded-md shadow-md py-1 w-44"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-foreground/5"
                            onClick={() => {
                                setTargetNotebookId(contextMenu.notebookId);
                                setShowNoteForm(true);
                                setContextMenu(null);
                            }}
                        >
                            Create a Note
                        </button>
                    </div>
                </>
            )}
        </aside>
    )
}