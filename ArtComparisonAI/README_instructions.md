# AI or Real Painting? Static GitHub Pages Experiment

This package contains a simple static website for an image comparison experiment. Participants see pairs of images and choose which one they think is AI-generated. Their choices can be saved to Google Sheets through Google Apps Script.

## Files

- `index.html` - main webpage
- `style.css` - visual styling
- `app.js` - experiment logic and Google Sheets submission
- `google_apps_script.js` - code to paste into Google Apps Script

## 1. Prepare your GitHub repository

Create a new GitHub repository, for example:

`ai-image-detection-study`

Upload these files to the root of the repository:

- `index.html`
- `style.css`
- `app.js`

Create a folder named:

`images`

Inside it, put your image files.

Recommended naming:

- `pair01_real.jpg`
- `pair01_ai.jpg`
- `pair02_real.jpg`
- `pair02_ai.jpg`
- `pair03_real.jpg`
- `pair03_ai.jpg`

The image file names are not shown to participants.

## 2. Edit the image list in app.js

Open `app.js` and edit the `comparisons` array.

Example:

```javascript
const comparisons = [
  {
    id: "pair01",
    real: "images/pair01_real.jpg",
    ai: "images/pair01_ai.jpg"
  },
  {
    id: "pair02",
    real: "images/pair02_real.jpg",
    ai: "images/pair02_ai.jpg"
  }
];
```

Add all 10-15 pairs in the same format.

Important: every `id` should be unique.

## 3. Enable GitHub Pages

In your GitHub repository:

1. Open `Settings`.
2. Open `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select the `main` branch and the `/root` folder.
5. Save.

GitHub will give you a public URL similar to:

`https://your-username.github.io/ai-image-detection-study/`

## 4. Create the Google Sheet

Create a new Google Sheet, for example:

`AI_Image_Detection_Responses`

In row 1, add these headers:

| timestampServer | timestampClient | sessionId | participantCode | pairId | leftImage | rightImage | correctSide | userChoice | isCorrect | confidence | responseTimeMs | userAgent |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

You can paste this directly into the first row:

```text
timestampServer	timestampClient	sessionId	participantCode	pairId	leftImage	rightImage	correctSide	userChoice	isCorrect	confidence	responseTimeMs	userAgent
```

## 5. Add the Google Apps Script

In the Google Sheet:

1. Click `Extensions`.
2. Click `Apps Script`.
3. Delete any default code.
4. Paste the contents of `google_apps_script.js`.
5. Save the project.

## 6. Deploy the Apps Script as a Web App

In Apps Script:

1. Click `Deploy`.
2. Click `New deployment`.
3. Select type: `Web app`.
4. Description: `AI image detection response endpoint`.
5. Execute as: `Me`.
6. Who has access: `Anyone`.
7. Click `Deploy`.
8. Authorize the script when Google asks.
9. Copy the Web App URL.

It will look similar to:

`https://script.google.com/macros/s/.../exec`

## 7. Add the Apps Script URL to app.js

Open `app.js` and replace this line:

```javascript
const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with your real deployment URL:

```javascript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

Commit the updated `app.js` to GitHub.

## 8. Test the experiment

Open your GitHub Pages URL.

Test with a participant code like:

`TEST001`

Complete a few comparisons.

Then open the Google Sheet and check whether new rows appear.

## 9. Important research notes

The website randomizes two things:

1. The order of the image pairs.
2. Whether the AI image appears on the left or right.

The site stores:

- participant code
- session ID
- pair ID
- left image path
- right image path
- correct side
- user choice
- correctness
- confidence rating
- response time
- browser user agent

For real data collection, tell participants not to enter personal names or emails as participant codes.

## 10. Optional improvements for later

Possible later additions:

- Disable the final score so participants cannot discuss results with others.
- Add a consent screen.
- Add demographic questions.
- Add a practice round.
- Add CSV export instructions.
- Add different groups of image comparisons.
- Add Bulgarian translation of the interface.
