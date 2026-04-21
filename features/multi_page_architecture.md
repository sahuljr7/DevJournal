# Feature: Multi-Page Architecture & Records Library

## Description
A comprehensive navigation framework that introduces a high-fidelity Home Page and a centralized Records Library. This architecture separates the landing/marketing experience from the technical dashboard.

## How it Works
- **Routing Engine**: Utilizes `react-router-dom` to manage distinct views for Home, Dashboard, and specific Record Details.
- **Global Context**: State management is decoupled from components via `AppContext`, ensuring data consistency across disparate pages.
- **Records Library**: A dynamic grid/list interface that provides high-level scannability for all ledger entries.
- **Sorting Logic**: Implements multi-axis sorting (Temporal, Alphabetical, and Grouped by Month/Year) to handle large volumes of technical data.

## Usage
1. **Landing**: Access the Home page (`/`) to view the product purpose and record summaries.
2. **Sort/Filter**: Use the Sort dropdown in the library section to organize records.
3. **Toggle View**: Switch between "Grid" (high visual density) and "List" (compact management) modes.
4. **Deep Dive**: Click any record card to navigate directly to the formal Dashboard view for that specific entry.
5. **Dashboard Entry**: Use the "Enter Dashboard" button for a general Kanban overview.
