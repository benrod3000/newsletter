import { useContext } from 'react'
import { CommandActionContext } from './CommandActionContextValue'

export function useCommandAction() {
  return useContext(CommandActionContext)
}
