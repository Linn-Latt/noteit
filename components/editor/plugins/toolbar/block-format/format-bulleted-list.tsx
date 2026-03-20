import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "@/components/ui/select"

const BLOCK_FORMAT_VALUE = "bullet"

export function FormatBulletedList() {
  return (
    <SelectItem value={BLOCK_FORMAT_VALUE}>
      <div className="flex items-center gap-1 font-normal">
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].label}
      </div>
    </SelectItem>
  )
}
