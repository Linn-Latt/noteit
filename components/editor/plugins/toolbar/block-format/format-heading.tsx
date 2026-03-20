import { HeadingTagType } from "@lexical/rich-text"

import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "@/components/ui/select"

export function FormatHeading({ levels = [] }: { levels: HeadingTagType[] }) {
  return levels.map((level) => (
    <SelectItem key={level} value={level}>
      <div className="flex items-center gap-1 font-normal">
        {blockTypeToBlockName[level].icon}
        {blockTypeToBlockName[level].label}
      </div>
    </SelectItem>
  ))
}
