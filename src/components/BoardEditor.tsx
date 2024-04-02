import { useModel, useState, useEffect, ElementProps } from "kaioken"
import { loadItems, loadLists } from "../idb"
import { useBoardStore } from "../state/board"
import { List, ListItem, Tag, Board } from "../types"
import { Button } from "./atoms/Button"
import { Input } from "./atoms/Input"
import { Spinner } from "./atoms/Spinner"
import { DialogHeader } from "./dialog/DialogHeader"
import { useGlobal } from "../state/global"
import { ActionMenu } from "./ActionMenu"
import { MoreIcon } from "./icons/MoreIcon"
import { maxBoardNameLength, maxTagNameLength } from "../constants"
import { Transition } from "kaioken"
import { Drawer } from "./dialog/Drawer"
import { useListsStore } from "../state/lists"
import { useBoardTagsStore } from "../state/boardTags"
import { useItemsStore } from "../state/items"

export function BoardEditorDrawer() {
  const { boardEditorOpen, setBoardEditorOpen } = useGlobal()
  return (
    <Transition
      in={!!boardEditorOpen}
      timings={[40, 150, 150, 150]}
      element={(state) =>
        state === "exited" ? null : (
          <Drawer state={state} close={() => setBoardEditorOpen(false)}>
            <BoardEditor />
          </Drawer>
        )
      }
    />
  )
}

function BoardEditor() {
  const { setBoardEditorOpen } = useGlobal()
  const {
    value: { board },
    deleteBoard,
    archiveBoard,
    restoreBoard,
    updateSelectedBoard,
  } = useBoardStore()

  const [titleRef, title] = useModel<HTMLInputElement, string>(
    board?.title || ""
  )
  const [ctxMenuOpen, setCtxMenuOpen] = useState(false)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function handleSubmit() {
    updateSelectedBoard({ ...board, title })
  }

  async function handleDeleteClick() {
    if (!board) return
    await deleteBoard()
    setBoardEditorOpen(false)
  }

  async function handleArchiveClick() {
    await archiveBoard()
    setBoardEditorOpen(false)
  }

  async function handleRestoreClick() {
    if (!board) return
    await restoreBoard()
    setBoardEditorOpen(false)
  }

  return (
    <>
      <DialogHeader>
        Board Details
        <div className="relative">
          <button
            className="w-9 flex justify-center items-center h-full"
            onclick={() => setCtxMenuOpen((prev) => !prev)}
          >
            <MoreIcon />
          </button>
          <ActionMenu
            open={ctxMenuOpen}
            close={() => setCtxMenuOpen(false)}
            items={[
              board?.archived
                ? {
                  text: "Restore",
                  onclick: handleRestoreClick,
                }
                : {
                  text: "Archive",
                  onclick: handleArchiveClick,
                },
              {
                text: "Delete",
                onclick: handleDeleteClick,
              },
            ]}
          />
        </div>
      </DialogHeader>
      <div className="flex gap-2">
        <Input
          className="bg-opacity-15 bg-black w-full border-0"
          ref={titleRef}
          maxLength={maxBoardNameLength}
          placeholder="(Unnamed Board)"
        />
        <Button
          variant="primary"
          onclick={handleSubmit}
          disabled={title === board?.title}
        >
          Save
        </Button>
      </div>
      <br />
      <BoardTagsEditor board={board} />
      <br />
      <ArchivedLists board={board} />
      <br />
      <ArchivedItems board={board} />
    </>
  )
}

function BoardTagsEditor({ board }: { board: Board | null }) {
  const {
    addTag,
    value: { tags },
  } = useBoardTagsStore()

  function handleAddTagClick() {
    if (!board) return
    addTag(board.id)
  }

  return (
    <ListContainer>
      <ListTitle>Board Tags</ListTitle>

      <div className="mb-2">
        {tags.map((tag) => (
          <BoardTagEditor tag={tag} />
        ))}
      </div>
      <div className="flex">
        <Button variant="link" className="ml-auto" onclick={handleAddTagClick}>
          Add Tag
        </Button>
      </div>
    </ListContainer>
  )
}

function BoardTagEditor({ tag }: { tag: Tag }) {
  const { updateTag, deleteTag } = useBoardTagsStore()

  const handleTitleChange = (e: Event) => {
    const title = (e.target as HTMLInputElement).value
    updateTag({ ...tag, title })
  }

  const handleColorChange = (e: Event) => {
    const color = (e.target as HTMLInputElement).value
    updateTag({ ...tag, color })
  }

  const _handleDeleteTag = () => {
    deleteTag(tag)
  }

  return (
    <ListItemContainer className="items-center">

      <button onclick={_handleDeleteTag}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 hover:text-red-500">
          <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
        </svg>
      </button>

      <Input
        value={tag.title}
        onchange={handleTitleChange}
        placeholder="(Unnamed Tag)"
        className="border-0 text-sm flex-grow"
        maxLength={maxTagNameLength}
      />
      <input
        value={tag.color}
        onchange={handleColorChange}
        type="color"
        className="cursor-pointer"
      />
    </ListItemContainer>
  )
}

function ArchivedItems({ board }: { board: Board | null }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<(ListItem & { list: string })[]>([])
  const { restoreItem } = useItemsStore()
  const {
    value: { lists },
  } = useListsStore()

  useEffect(() => {
    if (!board) return
    setLoading(true)
      ; (async () => {
        const res = await Promise.all(
          lists.map(async (list) => {
            return (await loadItems(list.id, true)).map((item) => ({
              ...item,
              list: list.title,
            }))
          })
        )
        setLoading(false)
        setItems(res.flat())
      })()
  }, [])

  async function handleItemRestore(item: ListItem & { list: string }) {
    const { list, ...rest } = item
    await restoreItem(rest)
    setItems((prev) => prev.filter((l) => l.id !== item.id))
  }

  return (
    <ListContainer>
      <ListTitle>Archived Items</ListTitle>
      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <span className="text-sm text-gray-400">
          <i>No archived items</i>
        </span>
      ) : (
        items.map((item) => (
          <ListItemContainer>
            <span className="text-sm">{item.title || "(Unnamed item)"}</span>
            <div className="flex flex-col items-end">
              <span className="text-xs align-super text-gray-400 text-nowrap mb-2">
                {item.list || "(Unnamed list)"}
              </span>
              <Button
                variant="link"
                className="px-0 py-0"
                onclick={() => handleItemRestore(item)}
              >
                Restore
              </Button>
            </div>
          </ListItemContainer>
        ))
      )}
    </ListContainer>
  )
}

function ArchivedLists({ board }: { board: Board | null }) {
  const [loading, setLoading] = useState(false)
  const [lists, setLists] = useState<List[]>([])
  const { restoreList } = useListsStore()
  useEffect(() => {
    if (!board) return
    setLoading(true)
      ; (async () => {
        const res = await loadLists(board.id, true)
        setLists(res)
        setLoading(false)
      })()
  }, [])

  async function handleSendToBoard(list: List) {
    await restoreList(list)
    setLists((prev) => prev.filter((l) => l.id !== list.id))
  }

  return (
    <ListContainer>
      <ListTitle>Archived Lists</ListTitle>
      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : lists.length === 0 ? (
        <span className="text-sm text-gray-400">
          <i>No archived lists</i>
        </span>
      ) : (
        lists.map((list) => (
          <ListItemContainer>
            <span className="text-sm">{list.title || "(Unnamed List)"}</span>
            <Button
              variant="link"
              className="text-sm py-0 px-0"
              onclick={() => handleSendToBoard(list)}
            >
              Restore
            </Button>
          </ListItemContainer>
        ))
      )}
    </ListContainer>
  )
}

function ListContainer({ children }: ElementProps<"div">) {
  return <div className="p-3 bg-black bg-opacity-15 rounded-xl">{children}</div>
}

function ListTitle({ children }: ElementProps<"div">) {
  return (
    <h4 className="text-sm mb-2 pb-1 border-b border-white text-gray-400 border-opacity-10">
      {children}
    </h4>
  )
}

function ListItemContainer({ children, className }: ElementProps<"div">) {
  return (
    <div
      className={`flex gap-4 p-2 justify-between bg-white bg-opacity-5 border-b border-black border-opacity-30 last:border-b-0 ${className || ""
        }`}
    >
      {children}
    </div>
  )
}
