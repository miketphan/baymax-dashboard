# Nexus Dashboard - Single Page Command Center

## Changes Made

### 1. App.tsx - Main Layout Redesign
- **Removed**: Tab navigation and sidebar
- **Added**: Single-page command center layout with:
  - Header with universal refresh button
  - Smart cascade refresh system
  - Status indicators for each section (green/yellow/red dots)
  - Responsive grid layout
  - Footer with section status summary

### 2. ConnectedServices.tsx - Compact Grid
- Added `compact` prop for compact view
- Shows up to 5 service cards in a responsive grid
- Simplified card layout for smaller display
- Removed disconnect button in compact mode
- Added empty slots for available services

### 3. UsageLimits.tsx - Compact Progress Bars
- Added `compact` prop for compact view
- Shows overall usage circle + mini progress bars
- Displays up to 4 usage categories
- Color-coded warnings for limits >90%
- Kept full view available with expanded stats

### 4. ProjectsKanban.tsx - Streamlined
- Removed header (now in App.tsx)
- Simplified to just render the KanbanBoard
- Maintains all drag-and-drop functionality

### 5. OperationsManual.tsx - Collapsible Sections
- Added `compact` prop for compact view
- Accordion-style expandable sections
- Only one section expanded at a time
- Grid layout for section headers
- Search functionality preserved
- Sync status badges on each section

## Smart Cascade Features

1. **Staleness Detection**: Sections go stale after 5 minutes
2. **Visual Indicators**: 
   - 🟢 Green = Fresh (< 5 min)
   - 🟡 Yellow = Stale (> 5 min)
   - 🔴 Red = Error
   - ⚪ Gray = Idle/never loaded
3. **Auto-refresh on Focus**: When user returns to tab, stale sections refresh
4. **Universal Refresh**: One button refreshes all sections
5. **Per-section Refresh**: Individual refresh buttons with "time ago" display

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 Nexus Command Center              [🔄 Refresh All]   │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────────┐ │
│ │ 📊 Usage & Limits    │  │ 📡 Connected Services    │ │
│ │ [compact progress]   │  │ [5 service cards grid]   │ │
│ └──────────────────────┘  └──────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📋 Projects Kanban (full width)                        │
│ [Backlog | In Progress | Done | Archived]              │
├─────────────────────────────────────────────────────────┤
│ 📖 Operations Manual (collapsible accordion)           │
│ [⚡ Protocols] [🔄 Processes] [🔧 Features] [📋 SOPs]   │
└─────────────────────────────────────────────────────────┘
```

## Responsive Design
- Top row stacks vertically on small screens (< 800px)
- Service cards use auto-fit grid
- Kanban board scrolls horizontally on overflow
- Operations Manual grid adapts to screen width

## API Integration
- All sections use existing API methods
- Smart cascade checks staleness via timestamps
- No navigation/routing bugs (single page)
