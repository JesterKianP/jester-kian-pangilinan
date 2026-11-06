# Northstar Customer Records

Northstar is a portfolio demo of a lightweight customer operations workspace. It demonstrates accurate record entry, duplicate prevention, structured order tracking, CSV handling, and a clear activity trail in a responsive interface.

## Try the demo

Open `index.html` in a modern browser, or open the published preview. Fictional sample customers load the first time so the dashboard, filters, payment tracker, and activity feed have realistic content. Use **CSV template** to get a starter file, or add/edit/search/sort records and export the filtered or selected rows.

## Capabilities

- Create, edit, and delete customer records with name, email, phone, company, and order status
- Validate required fields and email format; prevent duplicate email addresses case-insensitively
- Search all customer fields, filter by order status, and sort by name, company, status, or recency
- Import CSV with quoted-cell support, header matching, field validation, and duplicate skipping
- Export selected records or the current filtered list to spreadsheet-safe CSV
- Paginate through larger lists and select records on the current page
- Keep workspace-specific customer lists, payment examples, and recent activity
- Explore a simulated payment ledger and local workspace/account settings

## Data-entry workflow

1. Use **CSV template** for the expected columns, or import an existing CSV with `Name` and `Email` headers.
2. Check the imported records against the search and status filters.
3. Edit a row to correct details; duplicate emails are called out before saving.
4. Export selected rows or the filtered view for handoff.

Supported CSV headers include `Name`/`Full Name`, `Email`/`Email Address`, `Phone`/`Phone Number`, `Company`, and `Order Status`/`Status`. Name and Email are required. Status values are `In progress`, `Completed`, or `On hold`.

## Run locally

No build step or server is required. Open `index.html` in a modern browser. Files are plain HTML, CSS, and JavaScript.

## Scope and privacy

This is a front-end portfolio demo, not a production CRM. Customer records, local accounts, workspaces, and payment examples are stored in the browser's local storage. They do not sync between devices or provide server-backed authentication. Payments are simulated; no card details are requested and no money is moved. Use fictional data when sharing the public preview. Exported CSV files may contain sensitive data, so handle them appropriately.

## Reset demo data

The starter customers seed only on a fresh browser profile. To reset the current local data, clear the site's local storage in browser developer tools. This removes customer records, activity, payment examples, local accounts, and workspaces for this app.
