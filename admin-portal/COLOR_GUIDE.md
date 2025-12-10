# SmartWash Admin Portal - Color Guide

## Color Palette

### Primary Brand Colors (Forest Green Theme)

| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| Forest Green | `#228B22` | Primary buttons, navbar, main actions | `bg-primary-500` |
| Dark Forest | `#145214` | Sidebar, headers, footer | `bg-primary-800` |
| Soft Green | `#4CAF50` | Hover states, highlights, secondary actions | `bg-primary-400` |

### Neutral UI Colors

| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| App Background | `#F5F7F6` | Main page background | `bg-app-bg` |
| Card/Panel White | `#FFFFFF` | Cards, modals, panels | `bg-white` |
| Border/Divider | `#E0E0E0` | Borders, dividers, separators | `border-[#E0E0E0]` |
| Muted Text | `#6B7280` | Secondary text, placeholders | `text-[#6B7280]` |
| Main Text | `#1F2937` | Primary text content | `text-[#1F2937]` |

### Status & Action Colors

| Status | Hex Code | Usage | Tailwind Class |
|--------|----------|-------|----------------|
| Success | `#22C55E` | Success messages, completed status | `bg-[#22C55E]` |
| Warning | `#F59E0B` | Warning messages, pending actions | `bg-[#F59E0B]` |
| Error | `#EF4444` | Error messages, failed status | `bg-[#EF4444]` |
| Info | `#3B82F6` | Info messages, notifications | `bg-[#3B82F6]` |

## Quick Usage Examples

### Sidebar Component
```jsx
<div className="sidebar h-screen w-64 p-4">
  <h1 className="text-white text-xl font-bold">SmartWash</h1>
</div>
```

### Navbar Component
```jsx
<nav className="navbar h-16 px-6 flex items-center justify-between">
  <span className="text-white font-semibold">Admin Portal</span>
</nav>
```

### Card Component
```jsx
<div className="card p-6">
  <h2 className="text-[#1F2937] text-lg font-bold mb-4">Dashboard Stats</h2>
  <p className="text-[#6B7280]">Total Requests: 125</p>
</div>
```

### Primary Button
```jsx
<button className="btn-primary">
  Submit Request
</button>
```

### Secondary Button
```jsx
<button className="btn-secondary">
  Cancel
</button>
```

### Status Badges
```jsx
<span className="badge-success">Completed</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Failed</span>
<span className="badge-info">In Progress</span>
```

## Custom Utility Classes Available

- `.sidebar` - Dark forest background with white text
- `.navbar` - Forest green background with white text
- `.card` - White background with border and shadow
- `.btn-primary` - Forest green button with soft green hover
- `.btn-secondary` - Soft green button with forest green hover
- `.badge-success` - Success status badge
- `.badge-warning` - Warning status badge
- `.badge-error` - Error status badge
- `.badge-info` - Info status badge

## Design Principles

1. **Shadows**: Use soft shadows `shadow-md` for depth
2. **Border Radius**: Use 8px-12px for rounded corners (`rounded-lg`)
3. **Icons**: Use soft green (#4CAF50) for icons
4. **Text on Green**: Always use white (#FFFFFF) text on green backgrounds

## Tailwind Primary Scale

The primary color scale is mapped to the forest green theme:

- `primary-50` to `primary-900` - Lightest to darkest shades
- `primary-500` = Forest Green (#228B22)
- `primary-800` = Dark Forest (#145214)
- `primary-400` = Soft Green (#4CAF50)

Example:
```jsx
<button className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-lg">
  Click Me
</button>
```
