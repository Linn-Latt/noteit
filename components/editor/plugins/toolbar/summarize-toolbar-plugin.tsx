"use client"

import { useCallback, useRef, useState } from "react";
import { $getSelection, $isRangeSelection, $createParagraphNode, $createTextNode, BaseSelection } from "lexical";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { SparklesIcon } from "lucide-react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const URL_REGEX = /^https?:\/\/.+/;

export function SummarizeToolbarPlugin() {
    const { activeEditor } = useToolbarContext();
    const [hasSelection, setHasSelection] = useState(false);
    const [isUrl, setIsUrl] = useState(false);
    const selectedTextRef = useRef("");

    // Loading 
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    // Track selection changes 
    const $updateToolbar = useCallback((selection: BaseSelection) => {
        if ($isRangeSelection(selection)) {
            const text = selection.getTextContent();
            const trimmed = text.trim();
            selectedTextRef.current = trimmed;
            setHasSelection(trimmed.length > 0);
            setIsUrl(URL_REGEX.test(trimmed));
        } else {
            selectedTextRef.current = "";
            setHasSelection(false);
            setIsUrl(false);
        }
    }, [])

    useUpdateToolbarHandler($updateToolbar);

    // Call the API and stream the response 
    const handleSummarize = async () => {
        const text = selectedTextRef.current;
        if (!text) return;

        setSummary(null);
        setError(null);
        setLoading(true);
        setOpen(true);

        try {
            const body = URL_REGEX.test(text) ? { mode: "url", url: text } : { mode: "note", content: text };

            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const msg = await res.text();
                setError(msg || "Something went wrong");
                return;
            }

            // Stream the response text chunk by chunk
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    accumulated += decoder.decode(value, { stream: true });
                    setSummary(accumulated);
                }
            }
        } catch {
            setError("Failed to reach the server");
        } finally {
            setLoading(false);
        }
    }

    // Insert summary below the selection 
    const handleInsert = () => {
        if (!summary) return;
        activeEditor.update(() => {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(summary));
            $insertNodeToNearestRoot(paragraph);
        });
        setOpen(false);
        setSummary(null);
    }

    // Replace the selection with the summary
    const handleReplace = () => {
        if (!summary) return;
        activeEditor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.insertText(summary);
            }
        })
        setOpen(false);
        setSummary(null);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    className="!h-8 gap-1.5 px-2 text-xs"
                    aria-label={isUrl ? "Summarize webpage" : "Summarize"}
                    variant="outline"
                    size="sm"
                    onClick={hasSelection ? handleSummarize : () => setOpen(true)}
                >
                    <SparklesIcon
                        className={`size-3.5 transition-colors ${hasSelection ? "text-teal" : "text-foreground/30"
                            }`}
                    />
                    Summarize
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={6} className="w-80 p-3 space-y-3">
                {!hasSelection && !loading && !summary && (
                    <p className="text-xs text-foreground/50 text-center py-2">
                        Select text to summarize
                    </p>
                )}

                {loading && (
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                        <SparklesIcon className="size-3 animate-pulse text-teal" />
                        {isUrl ? "Fetching and summarizing webpage…" : "Summarizing…"}
                    </div>
                )}

                {error && (
                    <p className="text-xs text-rose">{error}</p>
                )}

                {summary && (
                    <>
                        <div className="text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {summary}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-7"
                                onClick={handleInsert}
                            >
                                Insert below
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 text-xs h-7"
                                onClick={handleReplace}
                            >
                                Replace
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}