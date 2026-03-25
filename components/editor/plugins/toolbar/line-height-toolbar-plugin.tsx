"use client"

import { useState } from "react"
import { $getSelection, $isRangeSelection, BaseSelection, ElementNode } from "lexical"
import { $findMatchingParent } from "@lexical/utils"
import { $isRootOrShadowRoot } from "lexical"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LINE_HEIGHTS = ["1", "1.15", "1.5", "2", "2.5", "3"]
const DEFAULT_LINE_HEIGHT = "1.5"

export function LineHeightToolbarPlugin() {
    const { activeEditor } = useToolbarContext()
    const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT)

    const $updateToolbar = (selection: BaseSelection) => {
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode()
            const element =
                anchorNode.getKey() === "root"
                    ? anchorNode
                    : $findMatchingParent(anchorNode, (e) => {
                        const parent = e.getParent()
                        return parent !== null && $isRootOrShadowRoot(parent)
                    }) ?? anchorNode.getTopLevelElementOrThrow()

            const dom = activeEditor.getElementByKey(element.getKey())
            const current = dom?.style.lineHeight
            setLineHeight(current && LINE_HEIGHTS.includes(current) ? current : DEFAULT_LINE_HEIGHT)
        }
    }

    useUpdateToolbarHandler($updateToolbar)

    const applyLineHeight = (value: string) => {
        setLineHeight(value)
        activeEditor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return

            const nodes = selection.getNodes()
            const seen = new Set<string>()

            for (const node of nodes) {
                const block =
                    node.getKey() === "root"
                        ? node
                        : ($findMatchingParent(node, (e) => {
                            const parent = e.getParent()
                            return parent !== null && $isRootOrShadowRoot(parent)
                        }) ?? node.getTopLevelElementOrThrow())

                if (!seen.has(block.getKey()) && block instanceof ElementNode) {
                    seen.add(block.getKey())
                    const dom = activeEditor.getElementByKey(block.getKey())
                    if (dom) dom.style.lineHeight = value
                }
            }
        })
    }

    return (
        <Select value={lineHeight} onValueChange={applyLineHeight}>
            <SelectTrigger className="!h-8 w-20 gap-1 text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {LINE_HEIGHTS.map((h) => (
                    <SelectItem key={h} value={h} className="text-xs">
                        {h}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
