import { useEffect, useReducer } from "kaioken"
import {
  GlobalCtx,
  GlobalDispatchCtx,
  defaultGlobalState,
  globalStateReducer,
} from "./global"
import { loadBoards } from "../idb"

export function GlobalProvider({ children }: { children?: JSX.Element[] }) {
  const [state, dispatch] = useReducer(globalStateReducer, defaultGlobalState)

  async function _loadBoards() {
    const boards = await loadBoards()
    dispatch({ type: "SET_BOARDS", payload: boards })

  }

  useEffect(() => {
    _loadBoards()
  }, [])

  return (
    <GlobalCtx.Provider value={state}>
      <GlobalDispatchCtx.Provider value={dispatch}>
        {children}
      </GlobalDispatchCtx.Provider>
    </GlobalCtx.Provider>
  )
}
