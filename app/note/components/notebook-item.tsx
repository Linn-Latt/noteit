"use client";

type Notebook = {
    id: string;
    name: string;
    parentId: string | null;
    _count: { children: number };
};

type Note = { id: string; title: string };

type ContextMenuPayload = {
    x: number;
    y: number;
    type: "notebook" | "note";
    id: string;
    fromNotebookId?: string | null;
};

type NotebookItemProps = {
    nb: Notebook;
    depth: number;

    // state slices it reads
    expandedIds:    Set<string>;
    loadingIds:     Set<string>;
    notebookMap:    Map<string | null, Notebook[]>;
    notesMap:       Map<string, Note[]>;
    draggingNoteId: string | null;
    selectedNoteId: string | null;

    // callbacks it triggers
    onExpand:         (nb: Notebook) => void;
    onMoveNote:       (noteId: string, notebookId: string | null) => void;
    onNoteSelect:     (id: string) => void;
    onSetContextMenu: (payload: ContextMenuPayload | null) => void;
    onCreateNote:     (notebookId: string) => void;  // opens the note form pre-targeted
    onDragStart:      (noteId: string) => void;
    onDragEnd:        () => void;
};

export function NotebookItem({
    nb, depth,
    expandedIds, loadingIds, notebookMap, notesMap, draggingNoteId, selectedNoteId,
    onExpand, onMoveNote, onNoteSelect, onSetContextMenu, onCreateNote, onDragStart, onDragEnd,
}: NotebookItemProps) {
    const isExpanded  = expandedIds.has(nb.id);
    const isLoading   = loadingIds.has(nb.id);
    const children    = notebookMap.get(nb.id) ?? [];
    const nbNotes     = notesMap.get(nb.id) ?? [];

    // shared props passed to every recursive child
    const recurseProps = {
        expandedIds, loadingIds, notebookMap, notesMap, draggingNoteId, selectedNoteId,
        onExpand, onMoveNote, onNoteSelect, onSetContextMenu, onCreateNote, onDragStart, onDragEnd,
    };

    return (
        <li className="flex flex-col">
            <div
                onClick={() => onExpand(nb)}
                style={{ paddingLeft: `${8 + depth * 12}px` }}
                className={`flex items-center gap-2 pr-2 py-1.5 rounded-md hover:bg-foreground/5 cursor-pointer
                    ${draggingNoteId ? "bg-foreground/5" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                    if (draggingNoteId) {
                        onMoveNote(draggingNoteId, nb.id);
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSetContextMenu({ x: e.clientX, y: e.clientY, type: "notebook", id: nb.id });
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span className="flex-1 text-sm truncate">{nb.name}</span>
                <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {isExpanded && (
                <ul className="flex flex-col gap-0.5">
                    {isLoading && (
                        <li style={{ paddingLeft: `${8 + (depth + 1) * 12}px` }}
                            className="py-1 text-xs text-foreground/40 italic">
                            Loading...
                        </li>
                    )}
                    {!isLoading && nbNotes.length === 0 && children.length === 0 && (
                        <li
                            style={{ paddingLeft: `${8 + (depth + 1) * 12}px` }}
                            className="py-1 text-xs text-foreground/40 italic cursor-pointer hover:text-foreground/60"
                            onClick={() => onCreateNote(nb.id)}
                        >
                            No notes yet — create one
                        </li>
                    )}

                    {/* recursive children */}
                    {children.map(child => (
                        <NotebookItem key={child.id} nb={child} depth={depth + 1} {...recurseProps} />
                    ))}

                    {/* notes */}
                    {nbNotes.map(note => (
                        <li
                            key={note.id}
                            onClick={() => onNoteSelect(note.id)}
                            draggable
                            onDragStart={() => onDragStart(note.id)}
                            onDragEnd={onDragEnd}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSetContextMenu({ x: e.clientX, y: e.clientY, type: "note", id: note.id, fromNotebookId: nb.id });
                            }}
                            style={{ paddingLeft: `${8 + (depth + 1) * 12}px` }}
                            className={`flex items-center gap-2 pr-2 py-1 rounded-md cursor-pointer
                                ${draggingNoteId === note.id ? "opacity-50" : "hover:bg-foreground/5"}
                                ${selectedNoteId === note.id ? "bg-foreground/10" : ""}
                            `}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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
}

