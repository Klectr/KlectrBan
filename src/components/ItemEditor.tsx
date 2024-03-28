import { Transition, useEffect, useModel, useRef, useState } from "kaioken"
import { Input } from "./atoms/Input"
import { DialogBody } from "./dialog/DialogBody"
import { DialogHeader } from "./dialog/DialogHeader"
import { useGlobal } from "../state/global"
import { Modal } from "./dialog/Modal"
import { MoreIcon } from "./icons/MoreIcon"
import { ActionMenu } from "./ActionMenu"
import { Button } from "./atoms/Button"
import { DialogFooter } from "./dialog/DialogFooter"
import { maxItemNameLength } from "../constants"
import { useBoardTagsStore } from "../state/boardTags"
import { useBoardStore } from "../state/board"
import { useItemsStore } from "../state/items"

export function ItemEditorModal() {
  const { clickedItem, setClickedItem } = useGlobal()
  if (!clickedItem) return null

  const handleClose = () => {
    const tgt = clickedItem.sender?.target
    if (tgt && tgt instanceof HTMLElement) tgt.focus()
    setClickedItem(null)
  }

  return (
    <Transition
      in={clickedItem?.dialogOpen || false}
      timings={[40, 150, 150, 150]}
      element={(state) => {
        return (
          <Modal state={state} close={handleClose}>
            <ItemEditor />
          </Modal>
        )
      }}
    />
  )
}

function ItemEditor() {
  const { setClickedItem, clickedItem } = useGlobal()
  const {
    value: { board },
  } = useBoardStore()
  const {
    value: { tags, itemTags },
    addItemTag,
    removeItemTag,
  } = useBoardTagsStore()
  const { updateItem, deleteItem, archiveItem } = useItemsStore()

  const [titleRef, title] = useModel<HTMLInputElement, string>(
    clickedItem?.item.title || ""
  )
  const [contentRef, content] = useModel<HTMLTextAreaElement, string>(
    clickedItem?.item.content || ""
  )
  const bannerRef = useRef<HTMLDivElement>(null)
  const saveBtnRef = useRef<HTMLButtonElement>(null)

  const savedTagIds =
    itemTags.filter((t) => t.itemId === clickedItem?.id).map((i) => i.tagId) ??
    []

  const [ctxOpen, setCtxOpen] = useState(false)
  const [itemTagIds, setItemTagIds] = useState(savedTagIds)

  const addedItemTagIds = itemTagIds.filter((id) => !savedTagIds.includes(id))
  const removedItemTagIds = savedTagIds.filter((id) => !itemTagIds.includes(id))
  const itemTagIdsChanged = addedItemTagIds.length || removedItemTagIds.length

  useEffect(() => {
    titleRef.current?.focus()

    const savebtnPressEventHandler = function(event: KeyboardEvent) {
      // If the user presses the "Enter" key on the keyboard
      if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        saveBtnRef.current?.click()
      }
    }
    document.addEventListener('keypress', savebtnPressEventHandler)
    return () => document.removeEventListener('keypress', savebtnPressEventHandler)
  }, [])

  async function saveChanges() {
    if (!clickedItem) return

    if (addedItemTagIds.length || removedItemTagIds.length) {
      await Promise.all([
        ...addedItemTagIds.map((it) =>
          addItemTag({ boardId: board!.id, itemId: clickedItem.id, tagId: it })
        ),
        ...removedItemTagIds
          .map(
            (it) =>
              itemTags.find(
                (t) => t.tagId === it && t.itemId === clickedItem.id
              )!.id
          )
          .map((id) => {
            return removeItemTag(itemTags.find((it) => it.id === id)!)
          }),
      ])
    }

    const blob = bannerRef.current?.style.backgroundImage.match(/^url\("(\S*)"\)/)?.[1]

    if (
      blob !== clickedItem.item.banner ||
      content !== clickedItem.item.content ||
      title !== clickedItem.item.title
    ) {
      const newItem = { ...clickedItem.item, content, title }
      if (blob) newItem.banner = blob
      await updateItem(newItem)
    }
    setClickedItem(null)
  }

  async function handleCtxAction(action: "delete" | "archive") {
    if (!clickedItem) return
    await (action === "delete" ? deleteItem : archiveItem)(clickedItem.item)
    setClickedItem(null)
  }

  async function handleItemTagChange(e: Event, id: number) {
    const checked = (e.target as HTMLInputElement).checked
    const newTagIds = checked
      ? [...itemTagIds, id]
      : itemTagIds.filter((item) => item !== id)

    setItemTagIds(newTagIds)
  }

  async function _handleDropImage(ev: DragEvent) {
    const thisElement = ev.target as HTMLDivElement
    ev.preventDefault()
    if (!ev.dataTransfer) return
    if (!ev.dataTransfer.items) return alert("Unsupported file drop")
    if (ev.dataTransfer.items.length > 1) return alert("Too many files dropped")

    const item = ev.dataTransfer.items[0]
    if (!item.type.startsWith('image/')) return alert("Unsupported file type")
    if (item.kind !== 'file') return alert("Unsupported file type")
    const file = item.getAsFile();
    if (!file) return alert("Not a valid file");

    (thisElement.firstElementChild as HTMLSpanElement).style.display = 'none'


    const base64 = await new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    if (!base64) return alert("Oh no - something went wrong parsing image")

    thisElement.classList.remove(..."border-dashed border-2 w-full h-16 flex justify-center items-center".split(' '))
    thisElement.style.backgroundImage = `url(${base64})`
    thisElement.style.height = '200px'
    thisElement.style.backgroundPosition = 'center'
    thisElement.style.backgroundSize = 'cover'
  }

  function _handleDragEnter(e: DragEvent) {
    e.preventDefault()
    const list = (e.target as HTMLDivElement).classList
    list.add("border-red-700")
  }

  function _handleDragLeave(e: DragEvent) {
    e.preventDefault()
    const list = (e.target as HTMLDivElement).classList
    list.remove("border-red-700")
  }

  return (
    <>
      <DialogHeader>
        {/* Image section */}
        <div className="flex flex-col w-full gap-4">
          {!clickedItem?.item.banner && <div
            ref={bannerRef}
            className="border-dashed border-2 w-full h-16 rounded flex justify-center items-center"
            ondrop={_handleDropImage}
            ondragover={e => e.preventDefault()}
            ondragenter={_handleDragEnter}
            ondragleave={_handleDragLeave}
          >
            <span id="drop-instructions" className="block text-grey">Drop Image Here</span>
          </div>}

          {clickedItem?.item.banner && <img className="rounded h-[200px] object-cover" src={clickedItem?.item.banner} />}

          <Input
            ref={titleRef}
            maxLength={maxItemNameLength}
            placeholder="(Unnamed Item)"
            className="w-full border-0"
            onfocus={(e) => (e.target as HTMLInputElement)?.select()}
          />
        </div>
        {/* END Image section */}



      </DialogHeader>

      <DialogBody>
        <div>
          <label className="text-sm font-semibold">Description</label>
          <textarea ref={contentRef} className="w-full border-0 resize-none rounded-xl" />
        </div>
        <div>
          <label className="text-sm font-semibold">Tags</label>
          <ul>
            {tags.map((t) => (
              <li className="flex items-center gap-2">
                <input
                  id={`item-tag-${t.id}`}
                  type={"checkbox"}
                  checked={itemTagIds?.includes(t.id)}
                  onchange={(e) => handleItemTagChange(e, t.id)}
                />
                <label
                  className="text-sm "
                  htmlFor={`item-tag-${t.id}`}
                >
                  {t.title}
                </label>
                <div className="w-10 h-4 rounded-2xl" style={{
                  backgroundColor: t.color
                }} />
              </li>
            ))}
          </ul>
        </div>
      </DialogBody>
      <DialogFooter>
        {/* menu section*/}
        <div className="relative">
          <button
            onclick={() => setCtxOpen((prev) => !prev)}
            className="w-9 flex justify-center items-center h-full"
          >
            <MoreIcon />
          </button>
          <ActionMenu
            open={ctxOpen}
            close={() => setCtxOpen(false)}
            items={[
              { text: "Archive", onclick: () => handleCtxAction("archive") },
              { text: "Delete", onclick: () => handleCtxAction("delete") },
            ]}
          />
        </div>
        {/* END menu section*/}

        <span></span>
        <Button
          ref={saveBtnRef}
          variant="primary"
          onclick={saveChanges}
          disabled={
            title === clickedItem?.item.title &&
            content === clickedItem?.item.content &&
            !itemTagIdsChanged
          }
        >
          Save & close
        </Button>
      </DialogFooter>
    </>
  )
}
