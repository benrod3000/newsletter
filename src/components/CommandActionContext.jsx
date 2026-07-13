import { createContext, useContext, useState, useCallback } from 'react'

const CommandActionContext = createContext(null)

export function CommandActionProvider({ children }) {
  const [action, setAction] = useState(null)

  const dispatch = useCallback((actionId) => {
    setAction({ id: actionId, timestamp: Date.now() })
  }, [])

  const consume = useCallback(() => {
    const a = action
    setAction(null)
    return a
  }, [action])

  return (
    <CommandActionContext.Provider value={{ dispatch, action, consume }}>
      {children}
    </CommandActionContext.Provider>
  )
}

export function useCommandAction() {
  return useContext(CommandActionContext)
}
