"use client";

import { useEffect, useState, useRef } from "react";
import Bin from "./bin";
import { authClient } from "@/lib/auth-client";
import { NotebookItem } from "./notebook-item";

type Notebook = { 
    id: string; 
    name: string; 
    parentId: string | null;
    _count: { children: number };
};
type Note = { 
    id: string; 
    title: string 
};
type CacheEntry = { 
    notebooks: Notebook[]; 
    page: number;
    hasMore: boolean 
};

function cacheKey(parentId: string | null, page: number) {
    return `${parentId ?? "root"}:${page}`;
}

// API Helper
async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

export default function Sidebar({ userName, onNoteSelect, onNoteDeselect, selectedNoteId, desktopOpen, onDesktopClose }: {
    userName: string
    onNoteSelect: (id: string) => void;
    onNoteDeselect: () => void;
    selectedNoteId: string | null;
    desktopOpen: boolean;
    onDesktopClose: () => void;
}) {
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [notebookMap, setNotebookMap] = useState<Map<string | null, Notebook[]>>(new Map());
    const [notesMap, setNotesMap] = useState<Map<string, Note[]>>(new Map());
    const [notes, setNotes] = useState<Note[]>([]);

    const [showNotebookForm, setShowNotebookForm] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newNoteTitle, setNewNoteTitle] = useState("");

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        type: "notebook" | "note";
        id: string;
        fromNotebookId?: string | null;
    } | null>(null);
    const [targetNotebookId, setTargetNotebookId] = useState<string | null>(null);
    // const [expandedNotebookId, setExpandedNotebookId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const [creatingNotebook, setCreatingNotebook] = useState(false);
    const [creatingNote, setCreatingNote] = useState(false);

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showMoveMenu, setShowMoveMenu] = useState(false);
    const [moveNoteId, setMoveNoteId] = useState<string | null>(null);
    const [selectedMoveTarget, setSelectedMoveTarget] = useState<string | null | undefined>(undefined);
    const [moving, setMoving] = useState(false);

    const [renameTarget, setRenameTarget] = useState<{ type: "notebook" | "note"; id: string; current: string } | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);

    const [showBin, setShowBin] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    async function loadData() {
        try {
            const data = await apiFetch("/api/sidebar-data?parentId=null&page=1&limit=20");
            setNotebookMap(prev => new Map(prev).set(null, data.notebooks));
            setNotes(data.notes);

            // seed the cache so handleExpand won't re-fetch the root level
            const entry: CacheEntry = {
                notebooks: data.notebooks,
                page: 1,
                hasMore: data.pagination.hasMore,
            };
            cacheRef.current.set(cacheKey(null, 1), entry);
        } catch (err) {
            console.error("Failed to load sidebar data:", err);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleCreateNotebook(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            setCreatingNotebook(true);
            const notebook = await apiFetch("/api/notebooks", {
                method: "POST",
                body: JSON.stringify({ name: newName.trim(), parentId: targetNotebookId ?? undefined }),
            });

            const parentKey = notebook.parentId ?? null;
            setNotebookMap(prev => {
                const slot = prev.get(parentKey) ?? [];
                return new Map(prev).set(parentKey, [...slot, { ...notebook, _count: { children: 0 } }]);
            });

            // Bump parent's _count.children so chevron appears immediately
            if (notebook.parentId) {
                setNotebookMap(prev => {
                    const next = new Map(prev);
                    for (const [key, list] of next) {
                        next.set(key, list.map(nb =>
                            nb.id === notebook.parentId ? { ...nb, _count: { children: nb._count.children + 1 } } : nb
                        ));
                    }
                    return next;
                });
            }

            setNewName("");
            setTargetNotebookId(null);
            setShowNotebookForm(false);
        } catch (err) {
            console.error("Create notebook failed:", err);
        } finally {
            setCreatingNotebook(false);
        }
    }

    // expand handler 
    async function handleExpand(nb: Notebook) {
        const isOpen = expandedIds.has(nb.id);
        if (isOpen) {
            setExpandedIds(prev => { const s = new Set(prev); s.delete(nb.id); return s; });
            return;
        }
        setExpandedIds(prev => new Set(prev).add(nb.id));

        const notebooksAlreadyLoaded = notebookMap.has(nb.id) || nb._count.children === 0;
        const notesAlreadyLoaded = notesMap.has(nb.id);

        // Both already cached — no fetch needed
        if (notebooksAlreadyLoaded && notesAlreadyLoaded) return;

        setLoadingIds(prev => new Set(prev).add(nb.id));
        try {
            // One request covers both child notebooks and notes
            const data = await apiFetch(`/api/sidebar-data?parentId=${nb.id}&page=1&limit=20`);

            // Always apply both results — we fetched them together, no reason to discard either
            setNotebookMap(prev => new Map(prev).set(nb.id, data.notebooks));
            setNotesMap(prev => new Map(prev).set(nb.id, data.notes));

            // seed the notebook cache entry
            cacheRef.current.set(cacheKey(nb.id, 1), {
                notebooks: data.notebooks,
                page: 1,
                hasMore: data.pagination.hasMore,
            });
        } finally {
            setLoadingIds(prev => { const s = new Set(prev); s.delete(nb.id); return s; });
        }
    }

    // Delete notebook
    async function handleDeleteNotebook(notebookId: string) {
        if (!notebookId) return;

        try {
            setDeleting(true);

            await apiFetch(`/api/notebooks/${notebookId}`, {
                method: "DELETE",
            });

            setNotebookMap(prev => {
                const next = new Map(prev);
                for (const [key, list] of next) {
                    next.set(key, list.filter(nb => nb.id !== notebookId));
                }
                next.delete(notebookId);
                return next;
            });

            setDeleteTargetId(null);
        } catch (err) {
            console.error("Delete notebook failed:", err);
        } finally {
            setDeleting(false);
        }
    }

    // Create Note
    async function handleCreateNote(e: React.FormEvent) {
        e.preventDefault();
        if (!newNoteTitle.trim()) return;

        try {
            setCreatingNote(true);

            const note = await apiFetch("/api/notes", {
                method: "POST",
                body: JSON.stringify({
                    title: newNoteTitle,
                    notebookId: targetNotebookId,
                }),
            });

            onNoteSelect(note.id);

            if (targetNotebookId) {
                // Add note to notesMap for its notebook
                setNotesMap(prev => {
                    const slot = prev.get(targetNotebookId) ?? [];
                    return new Map(prev).set(targetNotebookId, [...slot, note]);
                });
            } else {
                setNotes(prev => [...prev, note]);
            }

            setNewNoteTitle("");
            setTargetNotebookId(null);
            setShowNoteForm(false);
        } catch (err) {
            console.error("Create note failed:", err);
        } finally {
            setCreatingNote(false);
        }
    }

    // Delete note
    async function handleDeleteNote(noteId: string) {
        if (!noteId) return;

        try {
            setDeleting(true);

            await apiFetch(`/api/notes/${noteId}`, {
                method: "DELETE",
            });

            setNotes(prev => prev.filter(n => n.id !== noteId));
            setNotesMap(prev => {
                const next = new Map(prev);
                for (const [key, list] of next) {
                    next.set(key, list.filter(n => n.id !== noteId));
                }
                return next;
            });

            setDeleteNoteId(null);
            if (noteId === selectedNoteId) onNoteDeselect();
        } catch (err) {
            console.error("Delete note failed:", err);
        } finally {
            setDeleting(false);
        }
    }

    async function handleMoveNote(noteId: string, notebookId: string | null) {
        try {
            setMoving(true);

            await apiFetch(`/api/notes/${noteId}/move`, {
                method: "PATCH",
                body: JSON.stringify({ notebookId }),
            });

            // Find the note in quick notes or any notebook slot
            const note =
                notes.find(n => n.id === noteId) ??
                [...notesMap.values()].flat().find(n => n.id === noteId);
            if (!note) return;

            // Remove from wherever it currently lives
            setNotes(prev => prev.filter(n => n.id !== noteId));
            setNotesMap(prev => {
                const next = new Map(prev);
                for (const [key, list] of next) {
                    next.set(key, list.filter(n => n.id !== noteId));
                }
                return next;
            });

            // Add to new location
            if (notebookId) {
                setNotesMap(prev => {
                    const slot = prev.get(notebookId) ?? [];
                    return new Map(prev).set(notebookId, [...slot, note]);
                });
            } else {
                setNotes(prev => [...prev, note]);
            }
        } catch (err) {
            console.error("Move failed:", err);
        } finally {
            setMoving(false);
            setShowMoveMenu(false);
            setMoveNoteId(null);
            setSelectedMoveTarget(undefined);
        }
    }

    async function handleRename(e: React.FormEvent) {
        e.preventDefault();
        if (!renameTarget || !renameValue.trim()) return;

        try {
            setRenaming(true);

            if (renameTarget.type === "notebook") {
                await apiFetch(`/api/notebooks/${renameTarget.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name: renameValue }),
                });

                setNotebookMap(prev => {
                    const next = new Map(prev);
                    for (const [key, list] of next) {
                        next.set(key, list.map(nb =>
                            nb.id === renameTarget.id ? { ...nb, name: renameValue } : nb
                        ));
                    }
                    return next;
                });
            } else {
                await apiFetch(`/api/notes/${renameTarget.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ title: renameValue }),
                });

                setNotes(prev =>
                    prev.map(n =>
                        n.id === renameTarget.id
                            ? { ...n, title: renameValue }
                            : n
                    )
                );
                setNotesMap(prev => {
                    const next = new Map(prev);
                    for (const [key, list] of next) {
                        next.set(key, list.map(n =>
                            n.id === renameTarget.id ? { ...n, title: renameValue } : n
                        ));
                    }
                    return next;
                });
            }

            setRenameTarget(null);
            setRenameValue("");
        } catch (err) {
            console.error("Rename failed:", err);
        } finally {
            setRenaming(false);
        }
    }

    return (
        <>
            {/* Burger Button (place in your header ideally) */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-md"
            >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`
                fixed md:static top-0 left-0 h-screen w-64 z-50 bg-background
                transform transition-transform duration-300
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                ${desktopOpen ? "md:translate-x-0" : "md:-translate-x-full md:fixed md:w-0 md:overflow-hidden"}
                border-r border-foreground/20 py-6 flex flex-col
            `}
            >
                {/* User name */}
                <div className="h-10 flex items-center justify-between gap-3 px-4 pb-6 mb-4 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EC8F8D] text-white text-xs font-bold">
                            {userName.split(" ").map(w => w[0]).join("").toUpperCase()}
                        </div>

                        <span className="text-sm font-semibold truncate">
                            {userName}
                        </span>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-foreground/60 hover:text-foreground text-lg"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {/* Desktop Close Button */}
                    <button
                        onClick={onDesktopClose}
                        className="hidden md:flex text-foreground/60 hover:text-foreground transition-colors"
                        aria-label="Close sidebar"
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="2" y1="5" x2="16" y2="5" />
                            <line x1="2" y1="9" x2="16" y2="9" />
                            <line x1="2" y1="13" x2="16" y2="13" />
                        </svg>
                    </button>
                </div>

                {/* Notebooks header */}
                <div className="flex items-center justify-between mb-3 px-4">
                    <span className="text-xs font-medium text-foreground/200 uppercase tracking-wider">Notebooks</span>
                    <button
                        onClick={() => { setTargetNotebookId(null); setShowNotebookForm(true); }}
                        className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none"
                        title="New notebook"
                    >
                        +
                    </button>
                </div>

                {/* Notebook list */}
                <ul className="flex flex-col gap-1 px-2 overflow-y-auto">
                    {(notebookMap.get(null) ?? []).map(nb => (
                        <NotebookItem
                            key={nb.id}
                            nb={nb}
                            depth={0}
                            expandedIds={expandedIds}
                            loadingIds={loadingIds}
                            notebookMap={notebookMap}
                            notesMap={notesMap}
                            draggingNoteId={draggingNoteId}
                            selectedNoteId={selectedNoteId}
                            onExpand={handleExpand}
                            onMoveNote={handleMoveNote}
                            onNoteSelect={onNoteSelect}
                            onSetContextMenu={setContextMenu}
                            onCreateNote={(notebookId) => {
                                setTargetNotebookId(notebookId);
                                setShowNoteForm(true);
                            }}
                            onDragStart={setDraggingNoteId}
                            onDragEnd={() => setDraggingNoteId(null)}
                        />
                    ))}
                </ul>

                {/* Quick Notes */}
                <ul
                    className={`flex flex-col gap-1 px-4 pt-4 transition-colors
                        ${draggingNoteId ? "bg-foreground/5 rounded-md" : ""}
                    `}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                        if (draggingNoteId) {
                            handleMoveNote(draggingNoteId, null);
                            setDraggingNoteId(null);
                        }
                    }}
                >
                    {notes.map((note) => (
                        <li
                            key={note.id}
                            onClick={() => onNoteSelect(note.id)}
                            draggable
                            onDragStart={() => setDraggingNoteId(note.id)}
                            onDragEnd={() => setDraggingNoteId(null)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    type: "note",
                                    id: note.id,
                                    fromNotebookId: null,
                                });
                            }}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
                                ${draggingNoteId === note.id ? "opacity-50" : "hover:bg-foreground/5"}
                            `}
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
                        <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Notes</span>
                        <button
                            onClick={() => setShowNoteForm(true)}
                            className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none"
                            title="New quick note"
                        >
                            +
                        </button>
                    </div>

                    {/* Bottom row: logout + bin */}
                    <div className="flex items-center justify-between px-4 py-1.5">
                        <button
                            onClick={async () => { setSigningOut(true); await authClient.signOut(); window.location.href = "/login"; }}
                            disabled={signingOut}
                            className="flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors disabled:opacity-60"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {signingOut ? "Logging out..." : "Log out"}
                        </button>
                        <button
                            onClick={() => setShowBin(true)}
                            className="flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4h6v2" />
                            </svg>
                            Bin
                        </button>
                    </div>
                </div>
            </aside>

            {/* Create notebook popup */}
            {showNotebookForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <form
                        onSubmit={handleCreateNotebook}
                        className="bg-background rounded-xl p-6 w-72 flex flex-col gap-4 shadow-lg"
                    >
                        <h2 className="text-sm font-semibold">{targetNotebookId ? "New Subfolder" : "New Notebook"}</h2>
                        <input
                            autoFocus
                            type="text"
                            placeholder={targetNotebookId ? "Subfolder name" : "Notebook name"}
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
                        {contextMenu.type === "notebook" && (
                            <>
                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-foreground/5"
                                    onClick={() => {
                                        setTargetNotebookId(contextMenu.id);
                                        setShowNoteForm(true);
                                        setContextMenu(null);
                                    }}
                                >
                                    Create a Note
                                </button>

                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-foreground/5"
                                    onClick={() => {
                                        setTargetNotebookId(contextMenu.id);
                                        setShowNotebookForm(true);
                                        setContextMenu(null);
                                    }}
                                >
                                    Create Subfolder
                                </button>

                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-foreground/5"
                                    onClick={() => {
                                        const nb = [...notebookMap.values()].flat().find(n => n.id === contextMenu.id);
                                        setRenameTarget({ type: "notebook", id: contextMenu.id, current: nb?.name ?? "" });
                                        setRenameValue(nb?.name ?? "");
                                        setContextMenu(null);
                                    }}
                                >
                                    Rename
                                </button>

                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
                                    onClick={() => {
                                        setDeleteTargetId(contextMenu.id);
                                        setContextMenu(null);
                                    }}
                                >
                                    Delete Notebook
                                </button>
                            </>
                        )}

                        {contextMenu.type === "note" && (
                            <>
                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-foreground/5"
                                    onClick={() => {
                                        setMoveNoteId(contextMenu.id);
                                        setSelectedMoveTarget(undefined);
                                        setShowMoveMenu(true);
                                        setContextMenu(null);
                                    }}
                                >
                                    Move to
                                </button>

                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-foreground/5"
                                    onClick={() => {
                                        const note = notes.find(n => n.id === contextMenu.id);
                                        setRenameTarget({ type: "note", id: contextMenu.id, current: note?.title ?? "" });
                                        setRenameValue(note?.title ?? "");
                                        setContextMenu(null);
                                    }}
                                >
                                    Rename
                                </button>

                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
                                    onClick={() => {
                                        setDeleteNoteId(contextMenu.id);
                                        setContextMenu(null);
                                    }}
                                >
                                    Delete Note
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Notebook Delete Confirmation */}
            {deleteTargetId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <div className="bg-background rounded-xl p-6 w-80 flex flex-col gap-4 shadow-lg">
                        <h2 className="text-sm font-semibold">Delete Notebook?</h2>

                        <p className="text-xs text-foreground/60">
                            This will delete the notebook and all its notes.
                        </p>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                className="text-xs text-foreground/50 hover:text-foreground"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => handleDeleteNotebook(deleteTargetId)}
                                disabled={deleting}
                                className="rounded-md bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Delete Confirmation */}
            {deleteNoteId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <div className="bg-background rounded-xl p-6 w-80 flex flex-col gap-4 shadow-lg">
                        <h2 className="text-sm font-semibold">Delete Note?</h2>

                        <p className="text-xs text-foreground/60">
                            This note will be deleted and sent to the Bin.
                        </p>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setDeleteNoteId(null)}
                                className="text-xs text-foreground/50 hover:text-foreground"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => handleDeleteNote(deleteNoteId)}
                                disabled={deleting}
                                className="rounded-md bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renameTarget && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <form
                        onSubmit={handleRename}
                        className="bg-background rounded-xl p-6 w-72 flex flex-col gap-4 shadow-lg"
                    >
                        <h2 className="text-sm font-semibold">
                            Rename {renameTarget.type === "notebook" ? "Notebook" : "Note"}
                        </h2>
                        <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#44A194] transition-colors"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setRenameTarget(null); setRenameValue(""); }}
                                className="text-xs text-foreground/50 hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={renaming || !renameValue.trim()}
                                className="rounded-md bg-[#EC8F8D] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {renaming ? "Renaming..." : "Rename"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Move Note */}
            {showMoveMenu && moveNoteId && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                    <div className="bg-background rounded-xl p-5 w-72 shadow-lg">
                        <h2 className="text-sm font-semibold mb-3">Move to</h2>

                        <ul className="flex flex-col gap-1 max-h-48 overflow-auto">
                            {/* Quick Notes option */}
                            <li
                                onClick={() => setSelectedMoveTarget(null)}
                                className={`px-3 py-1.5 rounded-md cursor-pointer text-sm italic
                                    ${selectedMoveTarget === null
                                        ? "bg-foreground/10"
                                        : "hover:bg-foreground/5 text-foreground/60"
                                    }
                                `}
                            >
                                Quick Notes
                            </li>

                            {[...notebookMap.values()].flat().map((nb) => (
                                <li
                                    key={nb.id}
                                    onClick={() => setSelectedMoveTarget(nb.id)}
                                    className={`px-3 py-1.5 rounded-md cursor-pointer text-sm
                                        ${selectedMoveTarget === nb.id
                                            ? "bg-foreground/10"
                                            : "hover:bg-foreground/5"
                                        }
                                    `}
                                >
                                    {nb.name}
                                </li>
                            ))}
                        </ul>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowMoveMenu(false);
                                    setSelectedMoveTarget(undefined);
                                }}
                                className="text-xs text-foreground/50 hover:text-foreground"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={selectedMoveTarget === undefined || moving}
                                onClick={() => selectedMoveTarget !== undefined && handleMoveNote(moveNoteId, selectedMoveTarget)}
                                className="rounded-md bg-[#EC8F8D] px-4 py-1.5 text-xs font-medium text-white
                                hover:opacity-90 disabled:opacity-60"
                            >
                                {moving ? "Moving..." : "Move"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBin && (
                <Bin
                    onClose={() => setShowBin(false)}
                    onRestored={loadData}
                />
            )}
        </>
    )
}