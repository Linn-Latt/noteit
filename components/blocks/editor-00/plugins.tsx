import { useState } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin"
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin"
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin"
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph"
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading"
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list"
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list"
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote"
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin"
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size-toolbar-plugin"
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin"
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin"
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin"

export function Plugins() {
  const [, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) setFloatingAnchorElem(_floatingAnchorElem)
  }

  return (
    <div className="relative">
      <ToolbarPlugin>
        {() => (
          <div className="flex flex-wrap items-center gap-1 border-b p-1">
            <HistoryToolbarPlugin />
            <BlockFormatDropDown>
              <FormatParagraph />
              <FormatHeading levels={["h1", "h2", "h3"]} />
              <FormatBulletedList />
              <FormatNumberedList />
              <FormatQuote />
            </BlockFormatDropDown>
            <FontSizeToolbarPlugin />
            <FontFormatToolbarPlugin />
            <FontColorToolbarPlugin />
            <ClearFormattingToolbarPlugin />
            <ElementFormatToolbarPlugin />
          </div>
        )}
      </ToolbarPlugin>

      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div>
              <div ref={onRef}>
                <ContentEditable placeholder={"Start typing ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
      </div>
    </div>
  )
}
