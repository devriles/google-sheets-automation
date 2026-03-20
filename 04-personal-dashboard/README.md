# 04 — Personal Dashboard

Turns a Google Sheet into a project tracker with a custom toolbar menu, automatic color coding, a summary section, and daily email digests.

## What it does

- Adds a **Dashboard** menu to your Google Sheets toolbar
- Creates a project tracking sheet with status dropdowns (Not Started, In Progress, Blocked, Done)
- Color codes rows by status automatically
- Highlights overdue dates in red
- Shows a summary section with counts for each status
- Sends a daily email if anything is overdue or blocked
- One-click refresh from the toolbar menu

## Setup

1. Open a new Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete the default code and paste in `Code.gs`
4. Close the Apps Script tab
5. Reload the spreadsheet (the custom menu needs a page refresh to appear)
6. Click **Dashboard → Set Up Sheet** in the toolbar
7. Replace the sample projects with your own
8. Click **Dashboard → Refresh** after making changes

## The Dashboard menu

| Menu item | What it does |
|-----------|-------------|
| Refresh | Updates all colors and the summary section |
| Send Email Summary | Sends you an email digest right now |
| Set Up Sheet | Creates the template with sample data |
| Set Up Daily Email | Schedules a daily refresh + email at 7am |
| Stop Daily Email | Removes the daily schedule |

## Customization

- Edit the `CONFIG` section to change statuses, colors, or column headers
- Add more statuses by updating both `STATUSES` and `COLORS`
- The Notes column is optional but useful for context in email digests (blocked items include their notes)

## Notes

- The custom menu appears after the spreadsheet loads (you may need to refresh once after pasting the code)
- Works on free Google accounts
- Combines concepts from Posts 1-3: conditional formatting, email alerts, and triggers
