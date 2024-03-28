import "./HomePage.css"
import { ActionMenu } from "./components/ActionMenu"
import { LogoIcon } from "./components/icons/LogoIcon"
import { MoreIcon } from "./components/icons/MoreIcon"
import { JsonUtils } from "./idb"
import { useGlobal } from "./state/global"
import { Board } from "./types"
import { Link, useState } from "kaioken"

function readFile(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(reader.result as string))
    reader.readAsText(file, "UTF-8")
  })
}

export function HomePage() {
  const [showArchived, setShowArchived] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { boards, addBoard } = useGlobal()
  const activeBoards = boards.filter((b) => !b.archived)
  const archivedBoards = boards.filter((b) => b.archived)

  return (
    <main className="p-8">
      <header className="flex gap-2 justify-between items-center">
        <h1 className="text-4xl flex gap-2 items-end ">
          <LogoIcon size={36} />
          <span className="text-white">Kaioban</span>
        </h1>
        <div className="relative">
          <button onclick={() => setMenuOpen((prev) => !prev)}>
            <MoreIcon width="1.5rem" />
          </button>
          <ActionMenu
            open={menuOpen}
            close={() => setMenuOpen(false)}
            items={[
              {
                text: `${showArchived ? "Hide" : "Show"} archived boards`,
                onclick: () => {
                  setShowArchived((prev) => !prev)
                  setMenuOpen(false)
                },
              },
              {
                text: "Export data",
                onclick: async () => {
                  const data = await JsonUtils.export()
                  const dateStr = new Date()
                    .toLocaleString()
                    .split(",")[0]
                    .replaceAll("/", "-")

                  const a = document.createElement("a")
                  const file = new Blob([data], { type: "application/json" })
                  a.href = URL.createObjectURL(file)
                  a.download = `kaioban-export-${dateStr}.json`
                  a.click()
                  setMenuOpen(false)
                },
              },
              {
                text: "Import data",
                onclick: () => {
                  const confirmOverwrite = confirm(
                    "Continuing will overwrite your existing data. Are you sure you want to continue?"
                  )
                  if (!confirmOverwrite) return
                  const input = Object.assign(document.createElement("input"), {
                    type: "file",
                    accept: ".json",
                    onchange: async () => {
                      const file = input.files?.[0]
                      if (!file) return
                      const data = await readFile(file)
                      console.log("IMPORT", data)
                      await JsonUtils.import(data)
                      //@ts-ignore
                      window.location = "/"
                    },
                  })
                  input.click()
                },
              },
            ]}
          />
        </div>
      </header>
      <hr
        className="my-4 opacity-75"
        style="border-color:crimson;border-width:2px"
      />
      <section>
        <h2 className="text-2xl mb-2 text-white">Boards</h2>
        <div>
          {activeBoards.length > 0 && (
            <div className="p-4 mb-4 flex flex-wrap gap-4 bg-black bg-opacity-15 rounded">
              {activeBoards.map((board) => (
                <BoardCard board={board} />
              ))}
            </div>
          )}
          <button onclick={addBoard} className="bg-white rounded-xl px-4 py-2 bg-opacity-50 text-white">
            + Add New Board
          </button>
        </div>
      </section>
      {showArchived && (
        <>
          <hr className="opacity-30 my-8" />
          <section>
            <h2 className="text-2xl mb-2">Archived Boards</h2>
            <div className="p-4 mb-4 flex flex-wrap gap-4 bg-black bg-opacity-15 rounded">
              {archivedBoards.length > 0 ? (
                archivedBoards.map((board) => <BoardCard board={board} />)
              ) : (
                <div>
                  <i className="text-muted">No archived boards</i>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function BoardCard({ board }: { board: Board }) {
  return (
    <Link to={`/boards/${board.uuid}`} className="board-item px-4 py-3 rounded-xl">
      <span className="font-bold">{board.title || "(Unnamed board)"}</span>
    </Link>
  )
}
