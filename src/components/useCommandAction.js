import { useContext } from 'react'
import { CommandActionContext } from './CommandActionContext'

export function useCommandAction() {
  return useContext(CommandActionContext)
}
