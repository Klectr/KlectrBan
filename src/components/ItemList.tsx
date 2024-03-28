import "./ItemList.css"
import { useRef, useEffect, useMemo } from "kaioken"
import { List, ListItem, Tag } from "../types"
import { useGlobal } from "../state/global"
import { MoreIcon } from "./icons/MoreIcon"
import { useItemsStore } from "../state/items"
import { useBoardTagsStore } from "../state/boardTags"
import { useContextMenu } from "../state/contextMenu"

type InteractionEvent = MouseEvent | TouchEvent | KeyboardEvent

function isTouchEvent(e: Event): boolean {
  if (!Object.hasOwn(window, "TouchEvent")) return false
  return e instanceof TouchEvent
}

export function ItemList({ list }: { list: List }) {
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rect = useRef<DOMRect>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const { addItem, getListItems } = useItemsStore()
  const {
    clickedItem,
    setClickedItem,
    itemDragTarget,
    setItemDragTarget,
    handleItemDrag,
    clickedList,
    setClickedList,
    listDragTarget,
    setListDragTarget,
    rootElement,
  } = useGlobal()

  useEffect(() => {
    if (!listRef.current) return
    rect.current = listRef.current.getBoundingClientRect()
  }, [listRef.current])

  if (clickedList?.id === list.id && clickedList.dragging) {
    return null
  }

  const items = getListItems(list.id)

  function handleMouseMove(e: MouseEvent) {
    if (e.buttons !== 1) return
    if (!dropAreaRef.current) return
    if (!clickedItem) return
    if (!clickedItem.dragging) {
      setClickedItem({
        ...clickedItem,
        dragging: true,
      })
    }

    handleItemDrag(e, dropAreaRef.current, clickedItem, list)
  }

  function handleMouseLeave() {
    if (!clickedItem) return
    setItemDragTarget(null)
  }

  function selectList(e: InteractionEvent) {
    const element = listRef.current?.cloneNode(true) as HTMLDivElement
    if (!element) return

    const isMouse = e instanceof MouseEvent && !isTouchEvent(e)
    if (isMouse && e.buttons !== 1) return
    if (e instanceof KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return
      e.preventDefault()
    }

    const rect = listRef.current!.getBoundingClientRect()
    const mouseOffset =
      e instanceof MouseEvent
        ? {
          x: e.clientX - rect.x - 4,
          y: e.clientY - rect.y - 8,
        }
        : {
          x: 0,
          y: 0,
        }
    setClickedList({
      sender: e,
      list,
      id: list.id,
      index: list.order,
      dragging: false,
      dialogOpen: !isMouse,
      element,
      domRect: rect,
      mouseOffset,
    })
    if (isMouse) {
      setListDragTarget({ index: list.order + 1 })
    }
  }

  function getListItemsClassName() {
    let className = `list-items`

    const isOriginList = clickedItem?.listId === list.id
    if (isOriginList) {
      className += " origin"
    }

    if (!clickedItem?.dragging) {
      if (
        clickedItem &&
        clickedItem.listId === list.id &&
        clickedItem.index === items.length - 1 &&
        !clickedItem.dialogOpen
      ) {
        return `${className} last`
      }
      return className
    }

    const empty = items.length === 0 || (isOriginList && items.length === 1)

    if (empty) {
      className += " empty"
    }
    if (itemDragTarget?.listId !== list.id) return className

    return `${className} ${clickedItem?.dragging ? "dragging" : ""} ${itemDragTarget.index === items.length && !clickedItem.dialogOpen
      ? "last"
      : ""
      }`.trim()
  }

  function getListClassName() {
    let className = "list"
    if (clickedList?.id === list.id && !clickedList.dialogOpen) {
      className += " selected"
    }
    return className
  }

  function getListStyle() {
    if (listDragTarget && listDragTarget.index === list.order) {
      return "margin-left: calc(var(--selected-list-width) + var(--lists-gap));"
    }
    if (clickedList?.id !== list.id) return ""
    if (clickedList.dialogOpen) return ""
    if (!rootElement) return ""

    // initial click state
    const dropArea = document.querySelector("#board .inner")!
    const dropAreaRect = dropArea.getBoundingClientRect()
    const rect = listRef.current!.getBoundingClientRect()

    const x = rect.left - dropAreaRect.x - rootElement.scrollLeft
    const y = rect.y - dropAreaRect.y - rootElement.scrollTop
    return `transform: translate(calc(${x}px - 1rem), calc(${y}px - 1rem))`
  }

  return (
    <div
      ref={listRef}
      style={getListStyle()}
      className={getListClassName()}
      data-id={list.id}
    >
      <div className="list-header" ref={headerRef} onpointerdown={selectList}>
        <h3 className="list-title text-base font-bold">
          {list.title || `(Unnamed list)`}
        </h3>
        <button
          className="p-2"
          onkeydown={selectList}
          onclick={() =>
            setClickedList({
              ...(clickedList ?? {
                list,
                id: list.id,
                index: list.order,
                dragging: false,
              }),
              dialogOpen: true,
            })
          }
        >
          <MoreIcon />
        </button>
      </div>
      <div
        className={getListItemsClassName()}
        onmousemove={handleMouseMove}
        onmouseleave={handleMouseLeave}
      >
        <div ref={dropAreaRef} className="list-items-inner">
          {items
            .sort((a, b) => a.order - b.order)
            .map((item, i) => (
              <Item item={item} idx={i} listId={list.id} />
            ))}
        </div>
      </div>
      <div className="flex p-2">
        <button
          className="flex flex-1 hover:bg-white text-gray-500 rounded-xl flex-grow py-2 px-4 text-sm font-semibold"
          onclick={() => addItem(list.id)}
        >
          + Add Item
        </button>
      </div>
    </div>
  )
}

interface ItemProps {
  item: ListItem
  idx: number
  listId: number
}

function Item({ item, idx, listId }: ItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const { clickedItem, setClickedItem, itemDragTarget, setItemDragTarget } =
    useGlobal()
  const {
    // @ts-ignore
    value: { tags, itemTags },
    removeItemTag
  } = useBoardTagsStore((state) => [
    ...state.tags,
    ...state.itemTags.filter((it) => it.itemId === item.id),
  ])

  const itemItemTags: Array<Tag | undefined> = useMemo(() => {
    // @ts-ignore
    const tagsForThisItem = itemTags.filter((it) => it.itemId === item.id)
    // @ts-ignore
    const mappedTags = tagsForThisItem.map((it) => {
      // @ts-ignore
      const foundTag = tags.find((t) => t.id === it.tagId)
      if (!foundTag) {
        void removeItemTag(it)
        return undefined
      }
      return foundTag
    })
    return mappedTags.filter(Boolean)
  }, [itemTags, item.id])

  if (clickedItem?.id === item.id && clickedItem.dragging) {
    return null
  }

  function selectItem(e: InteractionEvent) {
    const element = ref.current?.cloneNode(true) as HTMLButtonElement
    if (!element) return console.error("selectItem fail, no element")

    const isMouse = e instanceof MouseEvent && !isTouchEvent(e)
    if (isMouse && e.buttons !== 1) {
      if (e.buttons == 2) {
        useContextMenu.setState({
          rightClickHandled: true,
          click: {
            x: e.clientX,
            y: e.clientY,
          },
          open: true,
          item,
        })
      }
      return
    }

    if (e instanceof KeyboardEvent) {
      // check if either 'enter' or 'space' key
      if (e.key !== "Enter" && e.key !== " ") return
      e.preventDefault()
    }

    const mEvt = e as MouseEvent

    const rect = ref.current!.getBoundingClientRect()
    setClickedItem({
      sender: e,
      item,
      id: item.id,
      listId: listId,
      index: idx,
      dragging: false,
      dialogOpen: !isMouse,
      element,
      domRect: rect,
      mouseOffset: isMouse
        ? { x: mEvt.offsetX, y: mEvt.offsetY }
        : { x: 0, y: 0 },
    })

    if (isMouse) {
      setItemDragTarget({
        index: idx + 1,
        listId,
      })
    }
  }

  function handleClick() {
    setClickedItem({
      ...(clickedItem ?? {
        item,
        id: item.id,
        listId: listId,
        index: idx,
        dragging: false,
      }),
      dialogOpen: true,
    })
  }

  function getStyle() {
    if (itemDragTarget?.index === idx && itemDragTarget?.listId === listId)
      return "margin-top: calc(var(--selected-item-height) + var(--items-gap));"
    if (clickedItem?.id !== item.id) return ""
    if (clickedItem.dialogOpen) return ""
    const dropArea = document.querySelector(
      `#board .inner .list[data-id="${listId}"] .list-items-inner`
    )!
    const dropAreaRect = dropArea.getBoundingClientRect()
    if (!dropAreaRect) return ""

    if (!ref.current) return ""
    const rect = ref.current.getBoundingClientRect()

    const x = rect.x - dropAreaRect.x
    const y = rect.y - dropAreaRect.y
    return `transform: translate(calc(${x}px - .5rem), ${y}px)`
  }

  function getClassName() {
    let className = "list-item text-sm gap-2"
    if (clickedItem?.id === item.id && !clickedItem.dialogOpen) {
      className += " selected"
    }
    return className
  }

  return (
    <button
      ref={ref}
      className={getClassName()}
      style={getStyle()}
      onpointerdown={selectItem}
      onkeydown={selectItem}
      onclick={handleClick}
      data-id={item.id}
    >

      {!!item.banner && (
        <img className="rounded" src={item.banner} />
      )}

      <span>{item.title || "(Unnamed Item)"}</span>

      <div className="flex gap-2 flex-wrap">
        {itemItemTags.map((tag) => {
          return (
            <span
              className="px-4 py-1 text-xs rounded"
              style={{ backgroundColor: tag?.color ?? '#000' }}
            />
          )
        })}
      </div>
    </button>
  )
}
