# Feature: Batch Source Archiving (ZIP)

## Description
A utility to bundle all technical assets from a specific ledger or record into a standard portable archive.

## How it Works
- Recursively gathers all attachment URLs and text content associated with a record or entry.
- Uses `jszip` to generate an in-memory archive.
- Handles base64 data URLs (for immediate uploads) and external technical resources seamlessly.
- Provides real-time feedback during the "Bundling" phase.

## Usage
- **Entry Level**: Click "Download All (.zip)" in the source section of any log entry to archive just those files.
- **Record Level**: Click "Log Archive" in the Documentation Ledger header to get a ZIP of every text entry in the history.
