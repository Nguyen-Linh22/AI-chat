import React from 'react'
import { SidebarContext, useSidebar } from './sidebarContext'

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean
  isCollapsed?: boolean
  children?: React.ReactNode
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ isOpen = false, isCollapsed = false, className = '', children, ...props }, ref) => {
    return (
      <SidebarContext.Provider value={{ isCollapsed, isOpen }}>
        <aside
          ref={ref}
          data-collapsed={isCollapsed ? 'true' : 'false'}
          className={`fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#121824]/90 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all duration-200 ease-in-out md:static md:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${
            isCollapsed
              ? 'w-[240px] p-2.5 md:w-[64px] md:min-w-[64px] md:p-2'
              : 'w-[240px] p-3 md:w-[240px] md:min-w-[240px] md:p-3'
          } ${className}`}
          {...props}
        >
          {children}
        </aside>
      </SidebarContext.Provider>
    )
  }
)
Sidebar.displayName = 'Sidebar'

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    const { isCollapsed } = useSidebar()
    return (
      <div
        ref={ref}
        className={`shrink-0 flex items-center mb-3 transition-all duration-150 ${
          isCollapsed ? 'justify-center px-0 flex-col gap-2' : 'justify-between px-1'
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarHeader.displayName = 'SidebarHeader'

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5 scrollbar-thin ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarContent.displayName = 'SidebarContent'

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <section ref={ref} className={`space-y-1 ${className}`} {...props}>
        {children}
      </section>
    )
  }
)
SidebarGroup.displayName = 'SidebarGroup'

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ className = '', children, ...props }, ref) => {
    const { isCollapsed } = useSidebar()
    if (isCollapsed) {
      return (
        <div className="sr-only" aria-hidden="false">
          {children}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 select-none ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  children?: React.ReactNode
}

export const SidebarMenu = React.forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <ul ref={ref} className={`space-y-1.5 list-none p-0 m-0 ${className}`} {...props}>
        {children}
      </ul>
    )
  }
)
SidebarMenu.displayName = 'SidebarMenu'

export interface SidebarMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode
}

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <li ref={ref} className={`relative group list-none ${className}`} {...props}>
        {children}
      </li>
    )
  }
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  tooltip?: string
  children?: React.ReactNode
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ isActive = false, tooltip, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-active={isActive ? 'true' : 'false'}
        title={tooltip}
        className={`relative w-full text-left transition-all duration-150 cursor-pointer focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

export interface SidebarMenuActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  show?: boolean
  children?: React.ReactNode
}

export const SidebarMenuAction = React.forwardRef<HTMLButtonElement, SidebarMenuActionProps>(
  ({ show = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#161d28]/90 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all duration-150 active:scale-95 cursor-pointer text-xs ${
          show ? 'opacity-100 ring-1 ring-slate-300 dark:ring-white/20' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        } ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SidebarMenuAction.displayName = 'SidebarMenuAction'

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`shrink-0 border-t border-slate-200/80 dark:border-white/[0.08] pt-2.5 mt-2 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarFooter.displayName = 'SidebarFooter'
