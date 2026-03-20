"use client";
import { useEffect, useState } from "react";
import { SerializedEditorState } from "lexical";
import { Editor } from "@/components/blocks/editor-00/editor";

export default function NoteEditor({ noteId }: { noteId: string | null }) {
    const [editorState, setEditorState] = useState<SerializedEditorState | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!noteId) return;
        setEditorState(undefined);
        setLoading(true);
        fetch(`/api/notes/${noteId}`)
            .then(r => r.json())
            .then(n => {
                setEditorState(n.content ? JSON.parse(n.content) : null);
            })
            .finally(() => setLoading(false));
    }, [noteId]);

    function handleChange(state: SerializedEditorState) {
        clearTimeout((window as any).__saveTimer);
        (window as any).__saveTimer = setTimeout(() => {
            if (!noteId) return;
            fetch(`/api/notes/${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: JSON.stringify(state) }),
            });
        }, 1000);
    }

    if (!noteId) return (
        <div className="flex-1 flex items-center justify-center text-foreground/30 text-sm">
            Select a note to start editing
        </div>
    );

    if (loading) return (
        <div className="flex-1 flex items-center justify-center text-foreground/30 text-sm">
            Loading...
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 p-8 mt-8">
            <div className="flex-1 flex flex-col min-h-0 [&>div]:flex-1 [&>div]:flex [&>div]:flex-col">
                <Editor key={noteId} editorSerializedState={editorState ?? undefined} onSerializedChange={handleChange} />
            </div>
        </div>
    );
}
