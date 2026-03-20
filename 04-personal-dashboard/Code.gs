/**
 * Personal Dashboard
 *
 * Turns a Google Sheet into a project tracker with:
 *   - A custom menu in the toolbar
 *   - Automatic color coding by status and due date
 *   - A summary row that counts what's on track, overdue, and done
 *   - A daily email digest of anything that needs attention
 *   - A one-click refresh that updates everything
 *
 * This combines concepts from Posts 1-3:
 *   - Conditional formatting (Post 1)
 *   - Email alerts (Post 2)
 *   - Auto-refresh triggers (Post 3)
 *
 * Setup:
 * 1. Open a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Close the Apps Script tab and reload the spreadsheet
 * 5. A "Dashboard" menu will appear in the toolbar
 * 6. Use Dashboard > Set Up Sheet to create the starting template
 */

// ── CONFIG ──────────────────────────────────────────────────

var CONFIG = {
  SHEET_NAME: "Projects",
  STATUSES: ["Not Started", "In Progress", "Blocked", "Done"],
  COLORS: {
    "Not Started": "#f3f3f3",  // light gray
    "In Progress": "#d9ead3",  // light green
    "Blocked":     "#f4cccc",  // light red
    "Done":        "#d0e0e3"   // light teal
  },
  OVERDUE_COLOR: "#e06666",    // red text for overdue dates
  HEADERS: ["Project", "Status", "Due Date", "Owner", "Notes"]
};

// ── CUSTOM MENU ─────────────────────────────────────────────
// This runs automatically when the spreadsheet opens.
// It adds a "Dashboard" menu to the toolbar.

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Dashboard")
    .addItem("Refresh", "refreshDashboard")
    .addItem("Send Email Summary", "sendSummaryEmail")
    .addSeparator()
    .addItem("Set Up Sheet", "setupSheet")
    .addItem("Set Up Daily Email", "createDailyTrigger")
    .addItem("Stop Daily Email", "removeDailyTrigger")
    .addToUi();
}

// ── SETUP ───────────────────────────────────────────────────
// Creates the starting template with headers, formatting,
// data validation dropdown for Status, and sample data.

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  // Headers
  var headerRange = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
  headerRange.setValues([CONFIG.HEADERS]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#4a86c8");
  headerRange.setFontColor("#ffffff");

  // Column widths
  sheet.setColumnWidth(1, 250);  // Project
  sheet.setColumnWidth(2, 120);  // Status
  sheet.setColumnWidth(3, 120);  // Due Date
  sheet.setColumnWidth(4, 130);  // Owner
  sheet.setColumnWidth(5, 300);  // Notes

  // Status dropdown validation (applies to rows 2-100)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.STATUSES)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 2, 99, 1).setDataValidation(statusRule);

  // Date format for Due Date column
  sheet.getRange(2, 3, 99, 1).setNumberFormat("MMM d, yyyy");

  // Sample data
  var today = new Date();
  var samples = [
    ["Quarterly report",      "In Progress",  addDays(today, -2), "Me",     "Draft done, need to review numbers"],
    ["Update team wiki",      "Not Started",  addDays(today, 3),  "Me",     ""],
    ["Client proposal",       "Blocked",      addDays(today, -5), "Me",     "Waiting on pricing from vendor"],
    ["Performance reviews",   "In Progress",  addDays(today, 7),  "Me",     "3 of 5 complete"],
    ["Onboarding doc refresh","Not Started",  addDays(today, 14), "Me",     ""],
    ["Budget reconciliation", "Done",         addDays(today, -10),"Me",     "Submitted to finance"]
  ];

  sheet.getRange(2, 1, samples.length, 5).setValues(samples);

  // Freeze header row
  sheet.setFrozenRows(1);

  // Run refresh to apply formatting
  refreshDashboard();

  // Add summary section
  buildSummary(sheet, samples.length);

  SpreadsheetApp.getUi().alert(
    "Sheet created with sample data.\n\n"
    + "Replace the sample projects with your own.\n"
    + "Use Dashboard > Refresh to update colors and summary."
  );
}

// ── REFRESH ─────────────────────────────────────────────────
// Updates all formatting and the summary section.
// Call this from the menu or run it on a trigger.

function refreshDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find where data ends (before the summary section)
  var lastDataRow = 1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === "" && data[i][1] === "") break;
    if (data[i][0] === "— Summary —") break;
    lastDataRow = i + 1;
  }

  // Apply row colors based on status
  for (var i = 1; i < lastDataRow; i++) {
    var status = data[i][1];
    var dueDate = data[i][2];
    var rowRange = sheet.getRange(i + 1, 1, 1, CONFIG.HEADERS.length);

    // Background color by status
    var bgColor = CONFIG.COLORS[status] || "#ffffff";
    rowRange.setBackground(bgColor);

    // Red text on due date if overdue and not done
    var dueDateCell = sheet.getRange(i + 1, 3);
    if (status !== "Done" && dueDate instanceof Date) {
      var due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        dueDateCell.setFontColor(CONFIG.OVERDUE_COLOR);
        dueDateCell.setFontWeight("bold");
      } else {
        dueDateCell.setFontColor("#000000");
        dueDateCell.setFontWeight("normal");
      }
    } else {
      dueDateCell.setFontColor("#000000");
      dueDateCell.setFontWeight("normal");
    }
  }

  // Rebuild summary
  buildSummary(sheet, lastDataRow - 1);

  Logger.log("Dashboard refreshed. " + (lastDataRow - 1) + " projects.");
}

// ── SUMMARY ─────────────────────────────────────────────────

function buildSummary(sheet, dataRowCount) {
  var data = sheet.getRange(2, 1, dataRowCount, CONFIG.HEADERS.length).getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var counts = { "Not Started": 0, "In Progress": 0, "Blocked": 0, "Done": 0, "Overdue": 0 };

  for (var i = 0; i < data.length; i++) {
    var status = data[i][1];
    if (counts[status] !== undefined) counts[status]++;

    if (status !== "Done" && data[i][2] instanceof Date) {
      var due = new Date(data[i][2]);
      due.setHours(0, 0, 0, 0);
      if (due < today) counts["Overdue"]++;
    }
  }

  // Write summary starting 2 rows after data
  var summaryStart = dataRowCount + 3;

  // Clear old summary area
  var clearRange = sheet.getRange(summaryStart - 1, 1, 10, CONFIG.HEADERS.length);
  clearRange.clearContent().clearFormat();

  // Separator
  var sepRange = sheet.getRange(summaryStart, 1, 1, CONFIG.HEADERS.length);
  sepRange.merge();
  sepRange.setValue("— Summary —");
  sepRange.setFontWeight("bold");
  sepRange.setHorizontalAlignment("center");
  sepRange.setBackground("#eeeeee");

  var summaryData = [
    ["In Progress", counts["In Progress"]],
    ["Not Started", counts["Not Started"]],
    ["Blocked",     counts["Blocked"]],
    ["Overdue",     counts["Overdue"]],
    ["Done",        counts["Done"]]
  ];

  for (var j = 0; j < summaryData.length; j++) {
    var row = summaryStart + 1 + j;
    sheet.getRange(row, 1).setValue(summaryData[j][0]).setFontWeight("bold");
    sheet.getRange(row, 2).setValue(summaryData[j][1]);

    // Color the count cells
    var label = summaryData[j][0];
    if (label === "Overdue") {
      sheet.getRange(row, 2).setFontColor(CONFIG.OVERDUE_COLOR).setFontWeight("bold");
    } else if (CONFIG.COLORS[label]) {
      sheet.getRange(row, 1, 1, 2).setBackground(CONFIG.COLORS[label]);
    }
  }
}

// ── EMAIL SUMMARY ───────────────────────────────────────────
// Sends a quick digest of anything overdue or blocked.

function sendSummaryEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var overdue = [];
  var blocked = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === "" || data[i][0] === "— Summary —") break;

    var project = data[i][0];
    var status  = data[i][1];
    var dueDate = data[i][2];

    if (status === "Blocked") {
      blocked.push(project + (data[i][4] ? " — " + data[i][4] : ""));
    }

    if (status !== "Done" && dueDate instanceof Date) {
      var due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        var daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
        overdue.push(project + " (" + daysLate + " day" + (daysLate === 1 ? "" : "s") + " overdue)");
      }
    }
  }

  if (overdue.length === 0 && blocked.length === 0) {
    Logger.log("Nothing overdue or blocked. No email sent.");
    return;
  }

  var body = "Dashboard update:\n\n";

  if (overdue.length > 0) {
    body += "OVERDUE (" + overdue.length + "):\n";
    for (var j = 0; j < overdue.length; j++) {
      body += "  • " + overdue[j] + "\n";
    }
    body += "\n";
  }

  if (blocked.length > 0) {
    body += "BLOCKED (" + blocked.length + "):\n";
    for (var k = 0; k < blocked.length; k++) {
      body += "  • " + blocked[k] + "\n";
    }
    body += "\n";
  }

  body += "Spreadsheet: " + ss.getUrl();

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "Dashboard: " + overdue.length + " overdue, " + blocked.length + " blocked",
    body: body
  });

  Logger.log("Summary email sent.");
}

// ── TRIGGERS ────────────────────────────────────────────────

function createDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "dailyRefresh") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("dailyRefresh")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  SpreadsheetApp.getUi().alert("Daily email set up. You'll get a summary each morning if anything needs attention.");
}

function removeDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "dailyRefresh") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  SpreadsheetApp.getUi().alert(removed > 0 ? "Daily email stopped." : "No daily email was set up.");
}

function dailyRefresh() {
  refreshDashboard();
  sendSummaryEmail();
}

// ── HELPERS ─────────────────────────────────────────────────

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
