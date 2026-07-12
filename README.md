# TransitOps

TransitOps is a transport operations platform for managing vehicles, drivers, trips, maintenance, fuel, expenses, and operational analytics in one place.

## Business Context

Many logistics teams still manage dispatch and fleet operations in spreadsheets and manual logbooks. TransitOps replaces that workflow with a centralized web app that helps reduce scheduling conflicts, improve compliance, track maintenance, and surface operational performance.

## Target Users

- Fleet Manager: oversees fleet assets, maintenance, lifecycle, and efficiency
- Driver: creates trips, assigns vehicles and drivers, and monitors active deliveries
- Safety Officer: tracks driver compliance, license validity, and safety scores
- Financial Analyst: reviews expenses, fuel consumption, maintenance costs, and profitability

## Core Modules

- Authentication with email and password
- Role-based access control across protected screens
- Dashboard with KPIs and vehicle filters
- Vehicle registry with unique registration numbers
- Driver management with license and safety tracking
- Trip management with lifecycle validation
- Maintenance logs and automatic vehicle status changes
- Fuel and expense tracking with operational cost calculation
- Reports and analytics with CSV export

## Functional Requirements

- Vehicle registration number must be unique
- Vehicle status values: Available, On Trip, In Shop, Retired
- Driver status values: Available, On Trip, Off Duty, Suspended
- Retired or In Shop vehicles must not appear in dispatch selection
- Drivers with expired licenses or Suspended status cannot be assigned to trips
- Drivers or vehicles already On Trip cannot be assigned again
- Cargo weight must not exceed the vehicle maximum load capacity
- Dispatching a trip changes both vehicle and driver status to On Trip
- Completing a trip changes both vehicle and driver status back to Available
- Cancelling a dispatched trip restores vehicle and driver to Available
- Creating an active maintenance record changes vehicle status to In Shop
- Closing maintenance restores the vehicle to Available unless it is Retired

## Example Workflow

1. Register vehicle Van-05 with maximum capacity 500 kg and status Available
2. Register driver Alex with a valid driving license
3. Create a trip with cargo weight 450 kg
4. The system validates that 450 kg is within the 500 kg limit and allows dispatch
5. Vehicle and driver automatically become On Trip
6. Complete the trip by entering final odometer and fuel consumed
7. Vehicle and driver return to Available
8. Create a maintenance record such as Oil Change
9. Vehicle automatically moves to In Shop and is removed from dispatch selection
10. Reports update operational cost and fuel efficiency from the latest activity

## Expected Data Model

- Users
- Roles
- Vehicles
- Drivers
- Trips
- Maintenance logs
- Fuel logs
- Expenses

## Current UI Areas

- Dashboard for live fleet KPIs
- Trips for planning and dispatch
- Fleet for vehicle registry and editing
- Drivers for driver profiles and compliance data
- Maintenance for service records and shop status
- Expenses for fuel logs and operational costs
- Analytics for KPI trends and CSV export
- Settings for general preferences and role permissions

## Tech Stack

- React 19
- TanStack Router
- TanStack Query
- Vite
- TypeScript
- Tailwind CSS
- Radix UI components

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the app in your browser and sign in from the auth page.

## Available Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` creates a production build
- `npm run preview` serves the built app locally
- `npm run lint` runs ESLint across the project
- `npm run format` formats the code with Prettier

## API Mode

The app uses the in-memory mock API by default. To connect it to a real backend, set `VITE_API_BASE_URL` in your environment. When that value is present, the app switches away from the mock layer automatically.

## Route Map

- `/auth` for login
- `/dashboard` for the operational overview
- `/trips` for dispatch and trip lifecycle management
- `/fleet` for vehicle registry
- `/drivers` for driver management
- `/maintenance` for maintenance records
- `/expenses` for fuel and cost tracking
- `/analytics` for reporting and CSV export
- `/settings` for preferences and RBAC

## Project Structure

- `src/routes` contains the app pages and route layout
- `src/components` contains shared UI and layout components
- `src/lib/api` contains the API client, mock data, and types
- `src/lib` contains auth, RBAC, formatting, and utility helpers

## Notes

- Visiting `/` redirects to `/dashboard` when a token is present, otherwise to `/auth`.
- The mock API keeps data in memory for the current session.
- The current build focuses on the core workflow above; additional items from the brief such as PDF export, email reminders, vehicle document management, and dark mode can be added on top of the same structure.