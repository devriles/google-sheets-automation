# 01 - Overdue Highlighter

Highlights rows in your spreadsheet where a due date has already passed. Overdue rows turn red.

## What it looks like

Before: a spreadsheet with due dates scattered across rows, no visual indicator of what's overdue.

After: every overdue row is highlighted in light red so you can see at a glance what needs attention.

## Setup

1. Open any Google Sheet that has due dates in a column
2. Go to **Extensions > Apps Script**
3. Delete any default code in the editor
4. Copy the contents of `Code.gs` and paste it in
5. Click the play button (triangle icon) at the top
6. When prompted, click **Advanced > Go to [project name] (unsafe)** and authorize it

This authorization warning is normal for personal scripts. It's your own code running in your own Google account. Nothing is shared externally.

## Customization

The script assumes your dates are in **column C**. If they're in a different column, change the `[2]` in this line:

```javascript
var dueDate = new Date(data[i][2]); // column C
```

Columns are zero-indexed:
- A = 0
- B = 1
- C = 2
- D = 3
- E = 4

So if your dates are in column E, change `[2]` to `[4]`.

## How it works

The script reads every row in your active sheet, checks if the date in the specified column is before today, and if so, sets the background color of that entire row to light red (`#f4cccc`).

It skips the header row (row 1) automatically.

## Notes

- This runs once when you click play. It doesn't auto-update. If you want it to run automatically, check out Part 2 of the series where we cover triggers.
- Running it again won't cause problems. It just re-highlights everything.
- To clear the highlighting, select all (Ctrl+A) and set background to white.
