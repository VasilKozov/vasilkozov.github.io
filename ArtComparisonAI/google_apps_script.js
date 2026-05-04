/*
  Google Apps Script endpoint for the image comparison study
  ----------------------------------------------------------
  How to use:
  1. Create a Google Sheet.
  2. Add the header row listed in the instructions.
  3. Open Extensions -> Apps Script.
  4. Paste this code.
  5. Deploy -> New deployment -> Web app.
  6. Execute as: Me.
  7. Who has access: Anyone.
  8. Copy the Web App URL into GOOGLE_SCRIPT_URL in app.js.
*/

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.timestampClient || "",
      data.sessionId || "",
      data.participantCode || "",
      data.pairId || "",
      data.leftImage || "",
      data.rightImage || "",
      data.correctSide || "",
      data.userChoice || "",
      data.isCorrect === true ? "TRUE" : "FALSE",
      data.confidence || "",
      data.responseTimeMs || "",
      data.userAgent || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
