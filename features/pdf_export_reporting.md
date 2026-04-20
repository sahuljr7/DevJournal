# Feature: Executive PDF Reporting

## Description
High-fidelity PDF generation for stakeholder-ready task reports. Transforms a detailed development ledger into a structured, printable document.

## How it Works
- Aggregates card metadata (Key, Title, Description), checklist items, and all ledger logs.
- Utilizes `jspdf` to layout content in a formal, paginated report format.
- Automatically handles long content chunks by splitting text across multiple pages.
- Includes a reference-check for all Consigned Sources (attachments).

## Usage
1. Select a record from the Kanban board.
2. In the header section, click the "Export PDF" button.
3. A formal report (`TaskReport-[ID].pdf`) is generated and downloaded immediately.
