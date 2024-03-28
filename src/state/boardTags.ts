import { createStore } from "kaioken"
import { Tag, ItemTag } from "../types"
import * as db from "../idb"
export { useBoardTagsStore }

const initialValues: BoardStoreType = { tags: [], itemTags: [] }

const useBoardTagsStore = createStore(initialValues, function (set) {
  const addItemTag = async ({ boardId, itemId, tagId }: AddItemTagProps) => {
    const itemTag = await db.addItemTag(boardId, itemId, tagId)
    set((prev) => ({ ...prev, itemTags: [...prev.itemTags, itemTag] }))
  }

  const removeItemTag = async (itemTag: ItemTag) => {
    await db.deleteItemTag(itemTag)
    set((prev) => ({
      ...prev,
      itemTags: prev.itemTags.filter((it) => it.id !== itemTag.id),
    }))
  }

  const addTag = async (boardId: number) => {
    const tag = await db.addTag(boardId)
    set((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
  }

  const updateTag = async (tag: Tag) => {
    const newTag = await db.updateTag(tag)
    set((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === tag.id ? newTag : t)),
    }))
  }

  const setState = async ({ tags, itemTags }: TagState) => {
    set({ tags, itemTags })
  }

  const deleteTag = async (tag: Tag) => {
    await db.deleteTag(tag)
    set((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== tag.id),
    }))
  }

  return {
    addItemTag,
    removeItemTag,
    setState,
    addTag,
    updateTag,
    deleteTag,
  }
})

interface AddItemTagProps {
  boardId: number
  itemId: number
  tagId: number
}

interface TagState {
  tags: Tag[]
  itemTags: ItemTag[]
}

interface BoardStoreType {
  tags: Tag[]
  itemTags: ItemTag[]
}
