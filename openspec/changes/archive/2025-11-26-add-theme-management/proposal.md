# Change: Add Theme Management with Light/Dark Mode Support

## Why
The application currently has complete dark theme CSS styling implemented but lacks any functionality for users to switch between light and dark themes. Users need a way to select their preferred theme (light, dark, or system default) and have that preference persist across sessions.

## What Changes
- Install `next-themes` library for theme management
- Add ThemeProvider wrapper to enable theme switching
- Create theme toggle component with three options (light, dark, system)
- Add theme preference persistence using localStorage
- Implement system theme detection using `prefers-color-scheme`
- Update root layout to support dynamic theme class application
- Add theme toggle to navigation/sidebar for easy access

## Impact
- Affected specs: New capability - `theme-management`
- Affected code: 
  - `frontend/app/layout.tsx` - Add ThemeProvider
  - `frontend/app/providers.tsx` - Add theme provider
  - `frontend/components/` - New ThemeToggle component
  - `frontend/components/Sidebar.tsx` - Add theme toggle
  - `frontend/package.json` - Add next-themes dependency
- User experience: Users can now switch between light and dark themes with system preference support