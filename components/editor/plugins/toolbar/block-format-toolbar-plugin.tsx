"use client"

import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, $isListNode, ListNode } from "@lexical/list"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingTagType } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils"
import { $createParagraphNode, $getSelection, $isRangeSelection, $isRootOrShadowRoot, BaseSelection, LexicalEditor } from "lexical"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

function formatBlockType(editor: LexicalEditor, value: string) {
  switch (value) {
    case "paragraph":
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection))
          $setBlocksType(selection, () => $createParagraphNode())
      })
      break
    case "h1":
    case "h2":
    case "h3":
      editor.update(() => {
        const selection = $getSelection()
        $setBlocksType(selection, () => $createHeadingNode(value as HeadingTagType))
      })
      break
    case "bullet":
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      break
    case "number":
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      break
    case "check":
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      break
    case "quote":
      editor.update(() => {
        const selection = $getSelection()
        $setBlocksType(selection, () => $createQuoteNode())
      })
      break
  }
}

function useBlockFormatToolbar() {
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

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      const elementDOM = activeEditor.getElementByKey(element.getKey())

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
          const type = parentList ? parentList.getListType() : element.getListType()
          setBlockType(type)
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType()
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName)
          }
        }
      }
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  return { activeEditor, blockType, setBlockType }
}

// Original dropdown (used on desktop via BlockFormatDropDown)
export function BlockFormatDropDown({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeEditor, blockType, setBlockType } = useBlockFormatToolbar()

  return (
    <Select
      value={blockType}
      onValueChange={(value) => {
        setBlockType(value as keyof typeof blockTypeToBlockName)
        formatBlockType(activeEditor, value)
      }}
    >
      <SelectTrigger className="!h-8 w-min gap-1">
        {blockTypeToBlockName[blockType]?.icon}
        <span>{blockTypeToBlockName[blockType]?.label}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  )
}

// Mobile select — shows all block types in a compact dropdown
export function BlockFormatSelect() {
  const { activeEditor, blockType, setBlockType } = useBlockFormatToolbar()

  return (
    <Select
      value={blockType}
      defaultValue="paragraph"
      onValueChange={(value) => {
        setBlockType(value as keyof typeof blockTypeToBlockName)
        formatBlockType(activeEditor, value)
      }}
    >
      <SelectTrigger className="!h-8 w-9 gap-0 [&>svg:last-child]:hidden">
        <span className="flex items-center justify-center">
          {blockTypeToBlockName[blockType]?.icon ?? blockTypeToBlockName["paragraph"].icon}
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectGroup>
          {Object.entries(blockTypeToBlockName).map(([value, { label, icon }]) => (
            <SelectItem key={value} value={value} className="text-xs">
              <span className="flex items-center gap-2">
                {icon}
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
