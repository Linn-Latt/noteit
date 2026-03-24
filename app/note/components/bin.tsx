"use client"

import { useEffect, useState } from "react";

type TrashedNote = { id: string; title: string; deletedAt: string };
type TrashedNotebook = { id: string; name: string; deletedAt: string };

export default function Bin({ onClose, onRestored }: {
    onClose: () => void;
    onRestored: () => void;
}) {
    const [notes, setNotes] = useState<TrashedNote[]>([]);
    const [notebooks, setNotebooks] = useState<TrashedNotebook[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    useEffect(() => {
        async function loadTrash() {
            try {
                setLoading(true);

                const res = await fetch("/api/trash");

                if (!res.ok) {
                    throw new Error("Failed to load trash");
                }

                const data = await res.json();

                setNotes(data.notes);
                setNotebooks(data.notebooks);
            } catch (err) {
                console.error("Load error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadTrash();
    }, []);

    async function handleRestore(type: "note" | "notebook", id: string) {
        try {
            setRestoringId(id);

            const res = await fetch("/api/trash/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, id }),
            });

            if (!res.ok) {
                throw new Error("Restore failed");
            }

            if (type === "note") {
                setNotes(prev => prev.filter(n => n.id !== id));
            } else {
                setNotebooks(prev => prev.filter(nb => nb.id !== id));
            }

            onRestored();

        } catch (err) {
            console.error(err);
        } finally {
            setRestoringId(null);
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    const isEmpty = notes.length === 0 && notebooks.length === 0;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-background rounded-xl p-6 w-96 flex flex-col gap-4 shadow-lg max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div> <span className="text-sm font-semibold">Bin </span> <span className="text-xs">(These will be permanently deledeted in 30 days)</span> </div>
                    <button onClick={onClose} className="text-foreground/50 hover:text-foreground transition-colors">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="14" y1="2" x2="2" y2="14" />
                            <line x1="2" y1="2" x2="14" y2="14" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex flex-col gap-4">
                    {loading && (
                        <p className="text-xs text-foreground/40 text-center py-4">Loading...</p>
                    )}

                    {!loading && isEmpty && (
                        <p className="text-xs text-foreground/40 text-center py-4">Bin is empty</p>
                    )}

                    {/* Deleted Notebooks */}
                    {notebooks.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Notebooks</span>
                            {notebooks.map(nb => (
                                <div key={nb.id} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-foreground/5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                        </svg>
                                        <span className="text-sm truncate">{nb.name}</span>
                                        <span className="text-xs text-foreground/30 shrink-0">{formatDate(nb.deletedAt)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRestore("notebook", nb.id)}
                                        disabled={restoringId === nb.id}
                                        className="text-xs text-[#44A194] hover:opacity-70 disabled:opacity-40 shrink-0 ml-2"
                                    >
                                        Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Deleted Notes */}
                    {notes.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Notes</span>
                            {notes.map(note => (
                                <div key={note.id} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-foreground/5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <span className="text-sm truncate">{note.title}</span>
                                        <span className="text-xs text-foreground/30 shrink-0">{formatDate(note.deletedAt)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRestore("note", note.id)}
                                        disabled={restoringId === note.id}
                                        className="text-xs text-[#44A194] hover:opacity-70 disabled:opacity-40 shrink-0 ml-2"
                                    >
                                        Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}