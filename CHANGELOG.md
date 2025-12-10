# Changelog

All notable changes to Xandeum pNode Analytics Dashboard.

## [Unreleased]

### Added
- Animated Aurora gradient in hero section (15s violet/cyan loop)
- KPI cards with Lucide React icons and glow effects on hover
- Storage Distribution chart (4 charts total layout)
- Alert Panel modal with severity-based badges
- Donut charts with centered totals and fixed legends
- pNode detail pages with historical trends

### Changed
- Private nodes badge color changed to red neon (#EF4444)
- Health status "Good" color changed from cyan to blue (#3B82F6)
- Pie charts replaced with donut charts for modern aesthetic
- Chart legends moved below visualizations

### Performance
- Memoized filteredAndSortedPNodes to prevent 30 recalculations/second
- Memoized cpuDistribution and healthDistribution
- Memoized healthCounts and healthPercent
- Significant performance improvement with 100+ nodes

### Fixed
- TypeScript error in health sorting function
- Missing grid closing div tags causing JSX errors
- Hero gradient not displaying correctly

## [0.2.0] - 2024-12-09

### Added
- Table view with sortable columns
- Grid view with compact cards
- Interactive Map view with geolocation
- Health Distribution progress bars
- Client Versions chart
- Toolbar with search, filter, and view mode toggles
- Theme system foundation (lib/theme.tsx)

### Changed
- Improved responsive layout
- Enhanced mobile experience

## [0.1.0] - 2024-12-06

### Added
- Initial dashboard with 15 responding pNodes
- CPU Load Distribution chart
- Network Health pie chart
- Search functionality
- Sort by multiple metrics
- Auto-refresh every 30 seconds
- GitHub repository with README