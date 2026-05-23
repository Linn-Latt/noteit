"use client"

import { useState } from "react"
import { $isLinkNode } from "@lexical/link"
import { $findMatchingParent } from "@lexical/utils"
import {
  $isElementNode,
  $isRangeSelection,
  BaseSelection,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical"
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
} from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { getSelectedNode } from "@/components/editor/utils/get-selected-node"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select"

type AlignFormat = Exclude<ElementFormatType, "start" | "end" | "">

const ALIGN_OPTIONS: {
  value: AlignFormat
  icon: React.ReactNode
  name: string
}[] = [
  { value: "left",    icon: <AlignLeftIcon    className="size-4" />, name: "Left Align"    },
  { value: "center",  icon: <AlignCenterIcon  className="size-4" />, name: "Center Align"  },
  { value: "right",   icon: <AlignRightIcon   className="size-4" />, name: "Right Align"   },
  { value: "justify", icon: <AlignJustifyIcon className="size-4" />, name: "Justify Align" },
]

const INDENT_OPTIONS: {
  value: "outdent" | "indent"
  icon: React.ReactNode
  name: string
}[] = [
  { value: "outdent", icon: <IndentDecreaseIcon className="size-4" />, name: "Outdent" },
  { value: "indent",  icon: <IndentIncreaseIcon className="size-4" />, name: "Indent"  },
]

function getAlignIcon(format: ElementFormatType): React.ReactNode {
  return (
    ALIGN_OPTIONS.find((o) => o.value === format)?.icon ?? (
      <AlignLeftIcon className="size-4" />
    )
  )
}

export function ElementFormatToolbarPlugin({
  separator = true,
}: {
  separator?: boolean
}) {
  const { activeEditor } = useToolbarContext()
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left")

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const parent = node.getParent()

      let matchingParent
      if ($isLinkNode(parent)) {
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline()
        )
      }
      setElementFormat(
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || "left"
      )
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  const handleValueChange = (value: string) => {
    if (!value) return

    if (value === "indent") {
      activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
    } else if (value === "outdent") {
      activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
    } else {
      setElementFormat(value as ElementFormatType)
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value as ElementFormatType)
    }
  }

  return (
    <>
      <Select value={elementFormat} defaultValue="left" onValueChange={handleValueChange}>
        <SelectTrigger className="!h-8 w-9 gap-0 [&>svg:last-child]:hidden">
          <span className="flex items-center justify-center">
            {getAlignIcon(elementFormat)}
          </span>
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {ALIGN_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              <span className="flex items-center gap-2">
                {option.icon}
              </span>
            </SelectItem>
          ))}
          <SelectSeparator />
          {INDENT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              <span className="flex items-center gap-2">
                {option.icon}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {separator && <Separator orientation="vertical" className="!h-7" />}
    </>
  )
}
