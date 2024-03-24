import { useRef, useState } from "kaioken"

export function App() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function _handleTextInputChange(e: Event) {
    setText((e.target as HTMLInputElement).value)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center flex-col">
      <h1 className="text-5xl text-center">{text}</h1>
      <br />
      <br />
      <input ref={inputRef} className="text-center outline-none text-4xl bg-transparent border-b focus-visible:border-b focus-visible:border-blue-500" placeholder="Put Text Here" onchange={_handleTextInputChange}>Text here</input>
    </div>
  )
}

