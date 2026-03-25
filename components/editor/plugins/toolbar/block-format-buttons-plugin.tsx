"use client"

import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND, $isListNode, ListNode } from "@lexical/list"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingTagType } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils"
import { $createParagraphNode, $getSelection, $isRangeSelection, $isRootOrShadowRoot, BaseSelection } from "lexical"
import { Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, ListTodoIcon, QuoteIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type BlockButton = {
    type: string
    label: string
    icon: React.ReactNode
    action: () => void
}

export function BlockFormatButtons() {
    const { activeEditor, blockType, setBlockType } = useToolbarContext()

    function $updateToolbar(selection: BaseSelection) {
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode()
            let element =
                anchorNode.getKey() === "root"
                    ? anchorNode
                    : $findMatchingParent(anchorNode, (e) => {
                        const parent = e.getParent()
                        return parent !== null && $isRootOrShadowRoot(parent)
                    })
            if (element === null) element = anchorNode.getTopLevelElementOrThrow()

            const elementDOM = activeEditor.getElementByKey(element.getKey())
            if (elementDOM !== null) {
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
                    setBlockType(parentList ? parentList.getListType() : element.getListType())
                } else {
                    const type = $isHeadingNode(element) ? element.getTag() : element.getType()
                    setBlockType(type)
                }
            }
        }
    }

    useUpdateToolbarHandler($updateToolbar)

    const formatParagraph = () =>
        activeEditor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection))
                $setBlocksType(selection, () => $createParagraphNode())
        })

    const formatHeading = (tag: HeadingTagType) =>
        activeEditor.update(() => {
            const selection = $getSelection()
            $setBlocksType(selection, () => $createHeadingNode(tag))
        })

    const buttons: BlockButton[] = [
        { type: "h1", label: "Heading 1", icon: <Heading1Icon className="size-4" />, action: () => blockType === "h1" ? formatParagraph() : formatHeading("h1") },
        { type: "h2", label: "Heading 2", icon: <Heading2Icon className="size-4" />, action: () => blockType === "h2" ? formatParagraph() : formatHeading("h2") },
        { type: "h3", label: "Heading 3", icon: <Heading3Icon className="size-4" />, action: () => blockType === "h3" ? formatParagraph() : formatHeading("h3") },
        { type: "bullet", label: "Bulleted List", icon: <ListIcon className="size-4" />, action: () => blockType === "bullet" ? formatParagraph() : activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
        { type: "number", label: "Numbered List", icon: <ListOrderedIcon className="size-4" />, action: () => blockType === "number" ? formatParagraph() : activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) },
        { type: "check", label: "Check List", icon: <ListTodoIcon className="size-4" />, action: () => blockType === "check" ? formatParagraph() : activeEditor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined) },
        { type: "quote", label: "Quote", icon: <QuoteIcon className="size-4" />, action: () => blockType === "quote" ? formatParagraph() : activeEditor.update(() => { const selection = $getSelection(); $setBlocksType(selection, () => $createQuoteNode()) }) },
    ]

    return (
        <div className="flex items-center gap-0.5">
            {buttons.map(({ type, label, icon, action }) => (
                <Tooltip key={type}>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant={blockType === type ? "secondary" : "ghost"}
                            size="icon"
                            className="!h-8 !w-8"
                            aria-label={label}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                action()
                            }}
                        >
                            {icon}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                </Tooltip>
            ))}
        </div>
    )
}
