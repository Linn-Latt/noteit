"use client"

import { useCallback, useState } from "react"
import { $isTableSelection } from "@lexical/table"
import {
  $isRangeSelection,
  BaseSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
} from "lexical"
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  TypeIcon,
  UnderlineIcon,
} from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const FORMATS = [
  { format: "bold",          icon: BoldIcon,          label: "Bold"          },
  { format: "italic",        icon: ItalicIcon,         label: "Italic"        },
  { format: "underline",     icon: UnderlineIcon,      label: "Underline"     },
  { format: "strikethrough", icon: StrikethroughIcon,  label: "Strikethrough" },
] as const

export function FontFormatToolbarPlugin() {
  const { activeEditor } = useToolbarContext()
  const [activeFormats, setActiveFormats] = useState<string[]>([])

  const $updateToolbar = useCallback((selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const formats: string[] = []
      FORMATS.forEach(({ format }) => {
        if (selection.hasFormat(format as TextFormatType)) formats.push(format)
      })
      setActiveFormats((prev) => {
        if (
          prev.length !== formats.length ||
          !formats.every((f) => prev.includes(f))
        ) {
          return formats
        }
        return prev
      })
    }
  }, [])

  useUpdateToolbarHandler($updateToolbar)

  const dispatchFormat = (format: TextFormatType) => {
    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  return (
    <>
      {/* Mobile: popover trigger showing active-state indicator */}
      <div className="flex sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="!h-8 !w-9 relative"
              aria-label="Text formatting"
            >
              <TypeIcon className="size-4" />
              {activeFormats.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-foreground/60" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-auto p-1"
          >
            <ToggleGroup
              type="multiple"
              value={activeFormats}
              onValueChange={setActiveFormats}
              variant="outline"
              size="sm"
            >
              {FORMATS.map(({ format, icon: Icon, label }) => (
                <ToggleGroupItem
                  key={format}
                  value={format}
                  aria-label={label}
                  onClick={() => dispatchFormat(format as TextFormatType)}
                >
                  <Icon className="size-4" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop: inline toggle group */}
      <div className="hidden sm:flex">
        <ToggleGroup
          type="multiple"
          value={activeFormats}
          onValueChange={setActiveFormats}
          variant="outline"
          size="sm"
        >
          {FORMATS.map(({ format, icon: Icon, label }) => (
            <ToggleGroupItem
              key={format}
              value={format}
              aria-label={label}
              onClick={() => dispatchFormat(format as TextFormatType)}
            >
              <Icon className="size-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </>
  )
}
