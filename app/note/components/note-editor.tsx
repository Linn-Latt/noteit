"use client";
import { useEffect, useRef, useState } from "react";
import { SerializedEditorState } from "lexical";
import { Editor } from "@/components/blocks/editor-00/editor";

export default function NoteEditor({ noteId }: { noteId: string | null }) {
    const [editorState, setEditorState] = useState<SerializedEditorState | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!noteId) return;

        setEditorState(undefined);
        setLoading(true);

        async function loadNote() {
            try {
                setEditorState(undefined);
                setLoading(true);

                const res = await fetch(`/api/notes/${noteId}`);

                if (!res.ok) throw new Error("Failed to load note");

                const note = await res.json();
                setEditorState(note.content ? JSON.parse(note.content) : undefined);
            } catch (err) {
                console.error("Load note error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadNote();
    }, [noteId]);

    function handleChange(state: SerializedEditorState) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            if (!noteId) return;

            try {
                const res = await fetch(`/api/notes/${noteId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: JSON.stringify(state) }),
                });

                if (!res.ok) throw new Error("Failed to save note");
            } catch (err) {
                console.error("Save note error:", err);
            }
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-8 mt-8">
            <div className="flex-1 overflow-y-auto min-h-0 [&>div]:flex-1 [&>div]:flex [&>div]:flex-col">
                <Editor key={noteId} editorSerializedState={editorState ?? undefined} onSerializedChange={handleChange} />
            </div>
        </div>
    );
}
