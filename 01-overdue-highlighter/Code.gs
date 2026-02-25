/**
 * Overdue Highlighter
 * 
 * Scans your spreadsheet for rows where the due date has passed
 * and highlights them in red. That's it.
 * 
 * Setup:
 * 1. Open your spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Click the play button
 * 
 * The [2] on line 16 points to column C (A=0, B=1, C=2, D=3...).
 * Change it if your dates are in a different column.
 */

function highlightOverdue() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var today = new Date();
  
  for (var i = 1; i < data.length; i++) {
    var dueDate = new Date(data[i][2]); // column C — change [2] to match your date column
    if (dueDate < today) {
      sheet.getRange(i + 1, 1, 1, sheet.getLastColumn())
        .setBackground('#f4cccc');
    }
  }
}
