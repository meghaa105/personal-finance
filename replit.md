# Personal Finance Manager (₹)

## Overview

A client-side personal finance tracking application built with Next.js 13 and React. The app allows users to track income and expenses, import transactions from various sources (CSV bank statements, PDF credit card statements, Splitwise exports), visualize spending patterns through analytics, and manage custom category mappings. All data is stored locally in the browser using localStorage - there is no backend database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Next.js 13** with App Router for page routing and React Server Components
- **React 18** for UI components with client-side rendering for interactive features
- Pages use dynamic imports with `next/dynamic` for code splitting and lazy loading
- Framer Motion and GSAP for animations and page transitions

### State Management
- React Context API for global state across four main contexts:
  - `TransactionContext`: Manages all financial transactions
  - `CategoryContext`: Handles expense/income categories with budgets
  - `CustomMappingsContext`: Stores keyword-to-category mappings for auto-categorization
  - `ThemeContext`: Controls dark/light mode and primary color theming
  - `MultiSelectContext`: Manages dropdown state for multi-select components

### Data Persistence
- **localStorage** is the only data storage mechanism
- `StorageService` class handles all read/write operations with keys:
  - `personalFinance_transactions`: Array of transaction objects
  - `personalFinance_categories`: User's category definitions
  - `personalFinance_customMappings`: Keyword patterns for auto-categorization
- No backend server or database - entirely client-side

### Styling
- **Tailwind CSS 3** for utility-first styling
- CSS custom properties for theming (`--color-primary`, `--color-primary-hover`)
- Dark mode support via Tailwind's `dark:` variant with class-based toggling
- Responsive design with mobile-first approach

### File Import System
- CSV parsing via **PapaParse** library
- PDF parsing for credit card statements (supports Swiggy HDFC, SBI Cashback, Amazon ICICI)
- Splitwise CSV export format support
- Auto-categorization using pattern matching against custom mappings

### Data Visualization
- **Chart.js** with react-chartjs-2 wrapper
- Pie/Doughnut charts for category distribution
- Bar charts for monthly trends
- Real-time filtering by time period, categories, and transaction sources

### Component Architecture
- Page components in `src/app/[route]/page.js` use dynamic imports
- Reusable UI components in `src/components/`
- Analytics split into sub-components: `AnalyticsFilters`, `MetricsGrid`, `ChartGrid`
- Error boundary wrapper for graceful error handling

## External Dependencies

### Core Libraries
- `next`: React framework with file-based routing
- `react` / `react-dom`: UI library
- `tailwindcss`: Utility CSS framework

### Data Processing
- `papaparse`: CSV file parsing
- `xlsx`: Excel file support (available but PDF is primary)

### Visualization
- `chart.js`: Charting library
- `react-chartjs-2`: React wrapper for Chart.js

### Animation
- `framer-motion`: React animation library
- `gsap`: Advanced animation (used for theme toggle)

### Icons
- `react-icons`: Icon components (Font Awesome, Ant Design icons)
- `@heroicons/react`: Heroicons set
- Google Material Icons (loaded via CDN)

### Development
- `eslint` with `eslint-config-next`: Code linting

### External Services
- None - the application is entirely self-contained with localStorage