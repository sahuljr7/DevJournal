# Feature: Links & References Section

## Description
A dedicated section for work items that allows engineers to consign external URLs and documentation references as formal project evidence.

## How it Works
- **CRUD Operations**: Users can add, view, and delete external URLs directly within the record overview.
- **Normalization**: Built-in logic automatically prepends `https://` to inputs that don't specify a protocol.
- **Security**: Links open in new tabs with `rel="noopener noreferrer"` to prevent security leaks from cross-origin references.
- **Persistence**: Data is synchronized through the `AppState` and persisted in `localStorage`.

## Usage
1. Open a record in the Dashboard.
2. Locate the "Link" icon below the tags section.
3. Type a URL in the `add reference url...` field and press **Enter**.
4. To visit a reference, click the link chip (it displays a shortened version of the URL).
5. To remove a reference, hover over the chip and click the **X** icon.
