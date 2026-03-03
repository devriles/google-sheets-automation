/**
 * Email Alerts
 *
 * Scans your spreadsheet each morning and emails you a summary
 * of anything that needs attention. You define what "needs attention"
 * means — overdue dates, a status column that says "urgent," a
 * number that crossed a threshold. Whatever you want.
 *
 * Setup:
 * 1. Open your spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Edit the CONFIG section below to match your sheet
 * 5. Run sendAlertEmail() once to test it
 * 6. Run createDailyTrigger() once to schedule it every morning
 *
 * The email comes from your own Gmail. No third-party service involved.
 */

// ── CONFIG ──────────────────────────────────────────────────
// Change these to match your spreadsheet.

var CONFIG = {
  DATE_COLUMN:   2,  // Column C (A=0, B=1, C=2, D=3...)
  LABEL_COLUMN:  0,  // Column A — the name/task/item shown in the email
  SHEET_NAME:    "", // Leave blank to use the first sheet, or put "Sheet1" etc.
  SUBJECT:       "Sheets Alert: items need your attention",
  SKIP_HEADER:   true // Set to false if your sheet has no header row
};

// ── MAIN FUNCTION ───────────────────────────────────────────

function sendAlertEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = CONFIG.SHEET_NAME
    ? ss.getSheetByName(CONFIG.SHEET_NAME)
    : ss.getSheets()[0];

  var data  = sheet.getDataRange().getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var items = [];
  var startRow = CONFIG.SKIP_HEADER ? 1 : 0;

  for (var i = startRow; i < data.length; i++) {
    var dateVal = data[i][CONFIG.DATE_COLUMN];
    if (!dateVal) continue;

    var dueDate = new Date(dateVal);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate <= today) {
      var label = data[i][CONFIG.LABEL_COLUMN] || "Row " + (i + 1);
      var daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      items.push({ label: label, dueDate: dueDate, daysLate: daysLate, row: i + 1 });
    }
  }

  if (items.length === 0) {
    Logger.log("Nothing overdue. No email sent.");
    return;
  }

  var body = items.length + " item(s) need attention:\n\n";

  for (var j = 0; j < items.length; j++) {
    var item = items[j];
    var dateStr = Utilities.formatDate(item.dueDate, Session.getScriptTimeZone(), "MMM d, yyyy");
    if (item.daysLate === 0) {
      body += "• " + item.label + " — due today (" + dateStr + ")\n";
    } else {
      body += "• " + item.label + " — " + item.daysLate + " day(s) overdue (was due " + dateStr + ")\n";
    }
  }

  body += "\nSpreadsheet: " + ss.getUrl();

  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: CONFIG.SUBJECT,
    body: body
  });

  Logger.log("Email sent with " + items.length + " item(s).");
}

// ── TRIGGER SETUP ───────────────────────────────────────────
// Run this once. It schedules sendAlertEmail() to run every morning
// between 7-8am in your timezone. You never have to touch it again.

function createDailyTrigger() {
  // Remove any existing triggers for this function first
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendAlertEmail") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("sendAlertEmail")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log("Daily trigger created. sendAlertEmail() will run between 7-8am.");
}

// ── REMOVE TRIGGER ──────────────────────────────────────────
// Run this if you want to stop the daily emails.

function removeDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendAlertEmail") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log(removed > 0 ? "Trigger removed. No more daily emails." : "No trigger found.");
}