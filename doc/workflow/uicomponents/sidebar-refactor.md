# Implementation Plan: Full shadcn Sidebar Refactor

## Overview
Replace current custom sidebar implementation with full shadcn sidebar component while maintaining all existing functionality.

## Current State Analysis
- Current implementation uses `buttonVariants` + custom HTML structure
- Missing true shadcn sidebar features (mobile drawer, keyboard shortcuts, etc.)
- Need to maintain: role-based filtering, active states, icons, responsive behavior

## Phase 1: Dependencies & Setup

### 1.1 Install Required Components
```bash
npx shadcn@latest add sidebar
# Check if additional dependencies needed:
# - @radix-ui/react-collapsible (likely already installed)
# - @radix-ui/react-scroll-area (likely already installed)
```

### 1.2 Verify CSS Variables
- Confirm sidebar CSS variables exist in `app/globals.css`
- Add missing variables if needed for proper theming

## Phase 2: Component Architecture

### 2.1 Create New SettingsSidebar Component
**File**: `app/(dashboard)/settings/components/settings-sidebar-v2.tsx`

**Structure**:
```tsx
SidebarProvider (wrap entire settings section)
├── Sidebar (collapsible="none" for always-visible desktop)
│   ├── SidebarContent
│   │   └── SidebarGroup
│   │       ├── SidebarGroupLabel ("Settings")
│   │       └── SidebarGroupContent
│   │           └── SidebarMenu
│   │               └── SidebarMenuItem (per nav item)
│   │                   └── SidebarMenuButton (asChild, isActive prop)
```

### 2.2 Update Settings Layout
**File**: `app/(dashboard)/settings/layout.tsx`

**Changes**:
- Wrap entire settings area with `SidebarProvider`
- Replace current `<aside><SettingsSidebar /></aside>` with `<SettingsSidebarV2 />`
- Wrap main content with `SidebarInset`
- Add mobile `SidebarTrigger` for drawer behavior

## Phase 3: Data Structure & Features

### 3.1 Enhanced Item Interface
```tsx
interface SettingsNavItem {
  href: string
  title: string
  icon?: LucideIcon  // All items get icons
  isAdmin?: boolean  // Preserve role filtering
}
```

### 3.2 Icon Mapping Strategy
```tsx
const iconMap = {
  "Company": Building,
  "Departments": Users, 
  "Bank Holidays": Calendar,
  "Leave Types": FileText,
  "Delegations": UserCheck
}
```

### 3.3 Active State Implementation
- Use `SidebarMenuButton`'s `isActive` prop
- Leverage `usePathname()` for current route detection
- Ensure styling matches current active state appearance

## Phase 4: Responsive Design

### 4.1 Mobile Behavior
- `collapsible="offcanvas"` for mobile drawer
- `SidebarTrigger` appears on mobile only (`md:hidden`)
- Off-canvas drawer with overlay

### 4.2 Desktop Behavior  
- `collapsible="none"` for always-visible sidebar
- Fixed width sidebar as requested
- No collapse-to-icon functionality

### 4.3 Layout Integration
- `SidebarProvider` at layout level for context management
- `SidebarInset` for proper content spacing
- Preserve existing `lg:max-w-2xl` content constraint

## Phase 5: Accessibility & UX Features

### 5.1 Built-in shadcn Features
- Keyboard navigation (arrow keys, Tab)
- ARIA attributes (handled by Radix)
- Focus management
- Screen reader support

### 5.2 Mobile Enhancements
- Touch-friendly drawer behavior
- Swipe gestures (if supported by shadcn)
- Proper mobile viewport handling

## Phase 6: Migration & Testing

### 6.1 Implementation Steps
1. Install shadcn sidebar components
2. Create new `SettingsSidebarV2` component
3. Update layout to use new component + `SidebarProvider`/`SidebarInset`
4. Test role-based access control
5. Test responsive behavior on mobile/desktop
6. Verify active state highlighting
7. Test navigation functionality

### 6.2 Rollback Strategy
- Keep old component as backup during development
- Feature flag for easy rollback
- Test both implementations side-by-side

## Phase 7: Cleanup & Optimization

### 7.1 Remove Old Code
- Delete old settings-sidebar.tsx component
- Remove unused imports
- Clean up any redundant styling

### 7.2 Performance
- Verify no unnecessary re-renders
- Check bundle size impact
- Ensure proper memoization if needed

## Questions & Decisions

### 7.1 Technical Decisions Needed
1. **Sidebar Provider Scope**: Wrap entire settings layout or just sidebar area?
2. **Mobile Trigger Placement**: Where should mobile hamburger menu appear?
3. **Sidebar Width**: Use shadcn defaults or custom width to match current design?
4. **Animation**: Preserve current animations or use shadcn defaults?

### 7.2 User Preferences Confirmation
1. **Keyboard Shortcuts**: Keep shadcn default `Ctrl/Cmd+B` to toggle sidebar?
2. **Mobile Drawer**: Standard overlay drawer or slide-in from side?
3. **Icon Style**: Use current icon mapping or prefer different icons?

## Expected Outcomes

### Benefits
- ✅ Full shadcn compliance
- ✅ Better accessibility (ARIA, keyboard navigation)
- ✅ Improved mobile experience
- ✅ Built-in animations and transitions
- ✅ Proper focus management
- ✅ Consistent with shadcn ecosystem

### Maintained Features  
- ✅ Role-based filtering (admin/supervisor)
- ✅ Active state highlighting
- ✅ All navigation items and icons
- ✅ Responsive behavior
- ✅ Content width constraints

### Risk Mitigation
- ✅ Backward compatibility maintained during development
- ✅ Easy rollback if issues arise
- ✅ Gradual migration approach
- ✅ Comprehensive testing strategy

## Implementation Checklist

### Pre-Implementation
- [ ] Backup current working implementation
- [ ] Review shadcn sidebar documentation thoroughly
- [ ] Plan testing approach (unit, integration, manual)
- [ ] Prepare rollback strategy

### Implementation
- [ ] Install shadcn sidebar components
- [ ] Create new SettingsSidebarV2 component
- [ ] Update settings layout.tsx
- [ ] Test all navigation items
- [ ] Verify role-based access control
- [ ] Test mobile responsiveness
- [ ] Test desktop behavior

### Post-Implementation
- [ ] Remove old sidebar component
- [ ] Clean up unused imports
- [ ] Run linting and type checking
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Cross-browser testing

## Success Criteria
1. Settings sidebar uses full shadcn component set
2. All existing functionality preserved (role filtering, active states, icons)
3. Improved mobile experience with drawer behavior
4. Enhanced accessibility with keyboard navigation
5. Responsive design works on all viewport sizes
6. No regression in navigation or layout
7. Performance maintained or improved

This plan ensures a complete migration to shadcn sidebar while preserving all existing functionality and improving overall user experience.