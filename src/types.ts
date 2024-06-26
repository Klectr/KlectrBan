export type Vector2 = {
  x: number
  y: number
}

export interface GlobalState {
  boardEditorOpen: boolean
  rootElement: HTMLElement | null
  clickedItem: ClickedItem | null
  itemDragTarget: ItemDragTarget | null
  clickedList: ClickedList | null
  listDragTarget: ListDragTarget | null
  dragging: boolean
  boards: Board[]
  boardsLoaded: boolean
}

export interface ItemTag {
  id: number
  itemId: number
  tagId: number
  boardId: number
}

export interface Tag {
  id: number
  boardId: number
  title: string
  color: string
}

export interface ListItem {
  id: number
  listId: number
  title: string
  content: string
  archived: boolean
  created: Date
  order: number
  refereceItems: number[]
  banner: string
}

export interface List {
  id: number
  boardId: number
  title: string
  archived: boolean
  created: Date
  order: number
}

export interface Board {
  id: number
  uuid: string
  title: string
  created: Date
  archived: boolean
  order: number
}

export interface ItemDragTarget {
  index: number
  listId: number
}

export interface ListDragTarget {
  index: number
}

export interface ClickedItem {
  sender?: Event
  item: ListItem
  id: number
  index: number
  dragging: boolean
  dialogOpen: boolean
  listId: number
  element?: HTMLElement
  domRect?: DOMRect
  mouseOffset?: {
    x: number
    y: number
  }
}

export interface ClickedList {
  sender?: Event
  list: List
  id: number
  index: number
  dragging: boolean
  dialogOpen: boolean
  element?: HTMLElement
  domRect?: DOMRect
  mouseOffset?: {
    x: number
    y: number
  }
}
