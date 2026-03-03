# 02 — Email Alerts

Makes your spreadsheet email you a summary of anything that needs attention. Runs every morning automatically.

## What it does

- Scans a date column for anything due today or overdue
- Sends you a plain-text email listing each item and how many days late it is
- Includes a link back to the spreadsheet
- Runs on a daily schedule so you never have to think about it

## Setup

1. Open your spreadsheet in Google Sheets
2. Go to **Extensions → Apps Script**
3. Delete the default code and paste in `Code.gs`
4. Edit the `CONFIG` section at the top:
    - `DATE_COLUMN`: which column has your dates (A=0, B=1, C=2...)
    - `LABEL_COLUMN`: which column has the task name or label
    - `SHEET_NAME`: leave blank for the first sheet, or put the sheet name
5. Click the function dropdown (top bar) and select `sendAlertEmail`
6. Click the play button to test — check your email
7. Switch the dropdown to `createDailyTrigger` and run it once

That's it. You'll get a daily email between 7–8am if anything is overdue.

## Stopping the emails

Run `removeDailyTrigger()` from the same dropdown menu.

## Notes

- The email comes from your own Gmail address — no third-party service
- If nothing is overdue, no email is sent (no spam on good days)
- Works on free Google accounts
- First run will ask for authorization (same "this app isn't verified" step as Post 1)