import { Transition, useEffect, useMemo, useRef } from "kaioken"
import { useContextMenu } from "../state/contextMenu"
import "./ContextMenu.css"
import { useBoardTagsStore } from "../state/boardTags"
import { useItemsStore } from "../state/items"
import { useBoardStore } from "../state/board"
import { Tag } from "../types"

export function ContextMenu() {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    value: { open, click },
    setOpen,
  } = useContextMenu()

  useEffect(() => {
    document.body.addEventListener("pointerdown", handleClickOutside)
    document.body.addEventListener("keydown", handleKeydown)
    return () => {
      document.body.removeEventListener("pointerdown", handleClickOutside)
      document.body.removeEventListener("keydown", handleKeydown)
    }
  }, [])

  if (!open) return null

  function handleClickOutside(e: PointerEvent) {
    if (!menuRef.current || !e.target || !(e.target instanceof Element)) return
    if (menuRef.current.contains(e.target)) return
    if (useContextMenu.getState().rightClickHandled) return
    setOpen(false)
  }
  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== "Escape") return
    setOpen(false)
  }

  return (
    <Transition
      timings={[30, 150, 150, 150]}
      in={open}
      element={(state) => {
        if (state === "exited") return null
        const opacity = String(state === "entered" ? 1 : 0)
        return (
          <div
            ref={menuRef}
            id="context-menu"
            style={{
              transform: `translate(${click.x}px, ${click.y}px)`,
              transition: "all .15s",
              opacity,
              zIndex: "99999"
            }}
          >
            <ContextMenuDisplay />
          </div>
        )
      }}
    />
  )
}

function ContextMenuDisplay() {
  const { value: { item }, reset } = useContextMenu()
  const { deleteItem, archiveItem } = useItemsStore()
  const { value: { board } } = useBoardStore()
  const {
    value: { tags, itemTags: boardItemTags },
    addItemTag,
    removeItemTag,
  } = useBoardTagsStore()

  const itemTags = useMemo(() => {
    if (!item) return []
    return boardItemTags.filter((it) => it.itemId === item.id)
  }, [boardItemTags, item?.id])

  async function handleDelete() {
    if (!item) return
    await deleteItem(item)
    reset()
  }

  async function handleArchive() {
    if (!item) return
    await archiveItem(item)
    reset()
  }

  function handleTagToggle(tag: Tag, selected: boolean) {
    if (!item || !board) return
    if (selected) {
      const itemTag = itemTags.find((it) => it.tagId === tag.id)
      if (!itemTag) return console.error("itemTag not found")
      removeItemTag(itemTag)
    } else {
      addItemTag({
        itemId: item.id,
        tagId: tag.id,
        boardId: board.id,
      })
    }
  }

  return (
    <div id="context-menu-inner" className="flex flex-col w-full">
      <div className="flex m-l-auto w-full justify-between">
        <button onclick={handleDelete} className="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 hover:text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>

        <button onclick={handleArchive} className="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 hover:text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </button>
      </div>

      <hr className="mt-2" />

      <div className="flex flex-col context-menu-item tag-selector mt-2">
        <span className="mb-1 font-bold">Tags</span>
        <div className="flex  tag-selector gap-1 flex-wrap">
          {tags.map((tag) => {
            const selected = itemTags.some((it) => it.tagId === tag.id)
            return (
              <button
                className="px-[4px] py-[1px] text-xs border border-black border-opacity-30 rounded-full min-w-10"
                style={{
                  backgroundColor: selected ? tag.color : "#333",
                  opacity: selected ? "1" : ".5",
                }}
                onclick={() => handleTagToggle(tag, selected)}
              >
                {tag.title}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
