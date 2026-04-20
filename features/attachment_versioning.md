# Feature: Implicit Attachment Versioning

## Description
A robust system for tracking the evolution of technical source files consigned to a work log. Instead of overwriting files, the system maintains a perfect history of all technical assets.

## How it Works
- When a user updates an existing attachment in the `RichEditor`, the current file is moved to a `versions` array associated with that attachment.
- A unique timestamp and provenance ID are assigned to each historical state.
- In the `LogEntry` view, historical states can be expanded and restored with a single click.

## Usage
1. Open a record with an existing attachment.
2. Click the "Update Source" (Refresh icon) on the attachment card.
3. Consign a new file.
4. View the "History" toggle in the saved entry to see previous versions.
5. Click "Restore" on a historical version.
6. A real-time notification (Toast) will confirm the successful restoration of the source data.
