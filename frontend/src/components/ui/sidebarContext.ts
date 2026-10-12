import { createContext, useContext } from 'react'

export interface SidebarContextValue {
  isCollapsed: boolean
  isOpen: boolean
}

export const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  isOpen: false,
})

export function useSidebar() {
  return useContext(SidebarContext)
}
