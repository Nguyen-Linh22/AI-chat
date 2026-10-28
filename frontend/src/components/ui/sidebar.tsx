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
          className={`sidebar-motion fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-200 dark:border-white/[0.06] bg-workspace-sidebar md:static md:translate-x-0 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:opacity-0 dark:before:opacity-100 before:bg-gradient-to-b before:from-emerald-500/[0.03] before:via-transparent before:to-transparent before:rounded-[inherit] ${
            isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'
          } ${
            isCollapsed
              ? 'w-[240px] p-3 md:w-[64px] md:min-w-[64px] md:p-3'
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
    return (
      <div
        ref={ref}
        className={`relative shrink-0 flex items-center justify-between mb-3 pb-1 px-1 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-px after:bg-gradient-to-r after:from-transparent after:via-emerald-500/20 after:to-transparent ${className}`}
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
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-3 pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-white/20 [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)] ${className}`}
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
        className={`px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-[#94A3B8] select-none before:inline-block before:w-0 dark:before:w-1.5 before:h-px dark:before:h-px before:bg-emerald-500/40 before:mr-0 dark:before:mr-1.5 before:align-middle before:rounded-full before:transition-all before:duration-200 ${className}`}
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
      <ul ref={ref} className={`space-y-1 list-none p-0 m-0 ${className}`} {...props}>
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
        className={`relative w-full text-left transition-all duration-150 cursor-pointer focus:outline-none hover:bg-slate-100/70 dark:hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent focus-visible:outline-none rounded-lg ${className}`}
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
        className={`flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#1A2230]/80 backdrop-blur-sm text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#222C3D] hover:border-slate-300 dark:hover:border-white/[0.14] hover:scale-110 transition-all duration-150 active:scale-95 cursor-pointer text-xs focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none ${
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
        className={`relative shrink-0 border-t border-transparent pt-3 mt-2 before:absolute before:top-0 before:left-2 before:right-2 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-white/[0.08] ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarFooter.displayName = 'SidebarFooter'
