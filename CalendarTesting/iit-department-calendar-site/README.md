# IIT Department Activity Calendar

Static GitHub Pages prototype for the Department of Informatics and Information Technologies, University of Ruse.

## What this repository contains

```text
.
├── index.html
├── assets/
│   ├── style.css
│   └── app.js
└── data/
    └── events.xlsx
```

The public site loads `data/events.xlsx` directly in the browser using SheetJS.

## Data model

The Excel file is the source of truth. Each year is a separate worksheet named with the year, for example:

- `2023`
- `2024`
- `2025`

Use the same columns in every year sheet:

| Column | Purpose |
|---|---|
| `id` | Stable unique identifier. Use `YYYY-MM-short-title`. |
| `date` | Event date. Use `YYYY-MM-DD`. |
| `end_date` | Optional end date for multi-day events. |
| `date_precision` | `event-date`, `post-date`, `approximate`, etc. |
| `title_bg` | Bulgarian event title. |
| `title_en` | Optional English title. |
| `category` | Category used for filters. |
| `location` | Physical or online location. |
| `organizers` | Organizers / responsible unit. |
| `participants` | Main participants. |
| `description_bg` | Short Bulgarian summary. |
| `description_en` | Optional English summary. |
| `facebook_url` | Main evidence link. |
| `university_news_url` | Optional official university news link. |
| `publication_url` | Optional paper/proceedings/publication link. |
| `photos_url` | Optional photo album link. |
| `report_notes` | Short note useful for annual reports. |
| `visibility` | Public / Internal / Draft. |
| `audience` | Who benefits from this event. |
| `tags` | Search keywords. |
| `icon` | `rocket`, `magnifier`, `lock`, `envelope`, `gear`, `star`. |
| `color` | `blue`, `blue-dark`, `teal`, `orange`, `red`, `green`, `green-dark`. |
| `source_status` | Verification note. |

## GitHub Pages deployment

1. Create a new GitHub repository, for example `iit-calendar`.
2. Upload all files from this folder.
3. Go to **Settings -> Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Open the GitHub Pages URL.

## Local testing

Because the site fetches `data/events.xlsx`, do not open `index.html` directly with `file://`.

Use a small local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Suggested Google Drive workflow

Use Google Drive as the working archive and GitHub as the public site.

1. Keep a master copy of `events.xlsx` in the department Google Drive.
2. Colleagues edit the Drive copy.
3. Once per week/month, download the Excel file as `.xlsx`.
4. Replace `data/events.xlsx` in GitHub.
5. Commit the change. The public site updates automatically.

## Future improvements

- Add a Google Form for event submission.
- Add an automatic Google Sheet -> JSON export.
- Add image thumbnails for event cards.
- Add Bulgarian/English language toggle.
- Add annual statistics by category and participant.
- Add an automatic report generator.
