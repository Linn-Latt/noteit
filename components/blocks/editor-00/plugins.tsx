"use client"

import { useState } from "react";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import { BlockFormatButtons } from "@/components/editor/plugins/toolbar/block-format-buttons-plugin";
import { BlockFormatSelect } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size-toolbar-plugin";
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { LineHeightToolbarPlugin } from "@/components/editor/plugins/toolbar/line-height-toolbar-plugin";
import { SummarizeToolbarPlugin } from "@/components/editor/plugins/toolbar/summarize-toolbar-plugin";
import { InsertTableToolbarPlugin } from "@/components/editor/plugins/toolbar/insert-table-toolbar-plugin";

export function Plugins() {
  const [, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) setFloatingAnchorElem(_floatingAnchorElem)
  }

  return (
    <div className="relative z-0">
      <ToolbarPlugin>
        {() => (
          <div className="flex flex-wrap items-center gap-1 border-b p-1 sticky top-0 z-50 bg-background">
            <HistoryToolbarPlugin />
            {/* Mobile: compact select, Desktop: individual icon buttons */}
            <div className="flex sm:hidden">
              <BlockFormatSelect />
            </div>
            <div className="hidden sm:flex">
              <BlockFormatButtons />
            </div>
            <FontSizeToolbarPlugin />
            <FontFormatToolbarPlugin />
            <FontColorToolbarPlugin />
            <ClearFormattingToolbarPlugin />
            <ElementFormatToolbarPlugin />
            <LineHeightToolbarPlugin />
            <InsertTableToolbarPlugin />
            <SummarizeToolbarPlugin />
          </div>
        )}
      </ToolbarPlugin>

      <div className="relative z-0">
        <RichTextPlugin
          contentEditable={
            <div>
              <div ref={onRef} className="relative z-0">
                <ContentEditable placeholder={"Start typing ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <TablePlugin />
        <HistoryPlugin />
      </div>
    </div>
  )
}
