# Project: Xandeum pNode Analytics Dashboard

## Project Overview

This project is a real-time monitoring and analytics platform for Xandeum Provider Nodes (pNodes). It's built as a submission for a Superteam Earn Bounty. The dashboard provides a comprehensive view of the pNode network, including real-time analytics, multiple view modes (table, grid, interactive map), and an alert system.

**Key Technologies:**

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **UI Components:** React 19, Framer Motion (animations), Lucide React (icons)
*   **Charting:** Recharts
*   **Mapping:** Leaflet
*   **Data Fetching:** Custom Next.js API Routes, Axios
*   **Database/Backend:** Supabase (implied by `supabase-js` dependency and `lib/supabase.ts`)

**Architecture:**

*   **Frontend:** The frontend is a single-page application built with Next.js and React. The main dashboard is located in `app/page.tsx`, which is a large client component responsible for fetching data, managing state, and rendering the various UI components.
*   **Backend:** The backend consists of Next.js API routes (e.g., `app/api/pnodes/route.ts`). These routes likely fetch data from a primary data source, such as a Supabase database, and format it for the frontend.
*   **Data:** The application tracks both public and private pNodes, displaying metrics like CPU, RAM, storage, uptime, and network traffic. It also calculates a "health score" for each node.

## Building and Running

### Prerequisites

*   Node.js
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/CryptoNNja/xandeum-pnode-dashboard.git
    cd xandeum-pnode-dashboard
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables. Create a `.env.local` file by copying the example:
    ```bash
    cp .env.local.example .env.local
    ```
    You will need to fill in the necessary Supabase credentials in this file.

### Running the Project

*   **Development:** To run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

*   **Production Build:** To create a production build:
    ```bash
    npm run build
    ```

*   **Start Production Server:** To start the production server:
    ```bash
    npm run start
    ```

### Testing

The project uses `vitest` for testing. To run the tests:

```bash
npm run test
```
*TODO: Add more details on the testing strategy and coverage if available.*

## Development Conventions

*   **Styling:** The project uses Tailwind CSS for styling. Utility classes are used directly in the JSX. There is a `globals.css` file for global styles and CSS animations.
*   **State Management:** The main dashboard component (`app/page.tsx`) uses React's `useState`, `useMemo`, and `useCallback` hooks for state management. For a project of this complexity, consider using a dedicated state management library like Zustand or Redux if the state becomes difficult to manage.
*   **Data Fetching:** Data is fetched from the Next.js API routes using the `fetch` API.
*   **Linting:** The project uses ESLint for code linting. Run `npm run lint` to check for linting errors.
*   **Code Structure:**
    *   `app/`: Contains the main application pages and API routes.
    *   `components/`: Contains reusable React components.
    *   `lib/`: Contains utility functions, type definitions, and client-side API helpers.
    *   `hooks/`: Contains custom React hooks.
    *   `public/`: Contains static assets like images and icons.
*   **Theming:** The application has a dark/light mode theme switcher, with theme-related logic likely in `hooks/useTheme.ts` and `lib/theme.tsx`.
