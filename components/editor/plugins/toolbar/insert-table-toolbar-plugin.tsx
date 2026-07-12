"use client"

import { useState } from "react"
import { INSERT_TABLE_COMMAND } from "@lexical/table"
import { TableIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function InsertTableDialog({ onClose, onInsert }: { onClose: () => void; onInsert: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  function handleInsert() {
    if (rows > 0 && cols > 0) {
      onInsert(rows, cols)
      onClose()
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Rows</span>
        <Input
          id="table-rows"
          type="number"
          min={1}
          max={50}
          value={rows}
          onChange={(e) => setRows(Math.max(1, Number(e.target.value)))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Columns</span>
        <Input
          id="table-cols"
          type="number"
          min={1}
          max={20}
          value={cols}
          onChange={(e) => setCols(Math.max(1, Number(e.target.value)))}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleInsert}>
          Insert
        </Button>
      </div>
    </div>
  )
}

export function InsertTableToolbarPlugin() {
  const { activeEditor, showModal } = useToolbarContext()

  function openDialog() {
    showModal("Insert Table", (onClose) => (
      <InsertTableDialog
        onClose={onClose}
        onInsert={(rows, cols) => {
          activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
            rows: String(rows),
            columns: String(cols),
            includeHeaders: false,
          })
        }}
      />
    ))
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="!h-8 !w-8"
          aria-label="Insert table"
          onMouseDown={(e) => {
            e.preventDefault()
            openDialog()
          }}
        >
          <TableIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Insert Table</TooltipContent>
    </Tooltip>
  )
}
