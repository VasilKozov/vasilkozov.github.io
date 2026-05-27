/* Department Activity Calendar
   Source of truth: data/events.xlsx
   Requirements:
   - Every year is a sheet named like 2023, 2024, 2025.
   - Header row must match the Excel template.
*/

const state = {
  allEvents: [],
  years: [],
  selectedYear: null,
  selectedCategory: "all",
  search: "",
  view: "roadmap"
};

const els = {
  status: document.getElementById("status"),
  yearTabs: document.getElementById("yearTabs"),
  stats: document.getElementById("stats"),
  categoryFilter: document.getElementById("categoryFilter"),
  searchInput: document.getElementById("searchInput"),
  roadmap: document.getElementById("roadmap"),
  eventCards: document.getElementById("eventCards"),
  reportTableBody: document.querySelector("#reportTable tbody"),
  dialog: document.getElementById("eventDialog"),
  dialogContent: document.getElementById("dialogContent"),
  copyReportBtn: document.getElementById("copyReportBtn")
};

const iconMap = {
  rocket: "🚀",
  magnifier: "🔎",
  lock: "🔒",
  envelope: "✉️",
  gear: "⚙️",
  star: "⭐"
};

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number") {
    // Excel serial date. 25569 = 1970-01-01.
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  const text = String(value).trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const bg = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (bg) return new Date(Number(bg[3]), Number(bg[2]) - 1, Number(bg[1]));

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  if (!date) return "без дата";
  return date.toLocaleDateString("bg-BG", { year: "numeric", month: "short", day: "2-digit" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function eventText(event) {
  return [
    event.title_bg, event.title_en, event.category, event.location, event.organizers,
    event.participants, event.description_bg, event.description_en, event.tags, event.report_notes
  ].join(" ").toLowerCase();
}

function getFilteredEvents() {
  return state.allEvents
    .filter(ev => String(ev.year) === String(state.selectedYear))
    .filter(ev => state.selectedCategory === "all" || ev.category === state.selectedCategory)
    .filter(ev => !state.search || eventText(ev).includes(state.search.toLowerCase()))
    .sort((a, b) => (a.dateObj?.getTime() || 0) - (b.dateObj?.getTime() || 0));
}

function getCategoryClass(color) {
  const allowed = ["blue", "blue-dark", "teal", "orange", "red", "green", "green-dark"];
  const value = String(color || "blue").trim();
  return allowed.includes(value) ? `color-${value}` : "color-blue";
}

function renderTabs() {
  els.yearTabs.innerHTML = "";
  state.years.forEach(year => {
    const button = document.createElement("button");
    button.className = `tab ${String(year) === String(state.selectedYear) ? "is-active" : ""}`;
    button.textContent = year;
    button.addEventListener("click", () => {
      state.selectedYear = year;
      render();
    });
    els.yearTabs.appendChild(button);
  });
}

function renderCategoryFilter() {
  const categories = Array.from(new Set(state.allEvents.map(ev => ev.category).filter(Boolean))).sort();
  const current = state.categoryFilter;
  els.categoryFilter.innerHTML = `<option value="all">Всички категории</option>`;
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.appendChild(option);
  });
  els.categoryFilter.value = current;
}

function renderStats(events) {
  const scientific = events.filter(e => /scientific|lecture|conference|науч/i.test(e.category + " " + e.tags)).length;
  const student = events.filter(e => /student|outreach|учен|студент/i.test(e.category + " " + e.tags)).length;
  const links = events.filter(e => e.facebook_url || e.university_news_url || e.publication_url || e.photos_url).length;

  els.stats.innerHTML = `
    <div class="stat"><strong>${events.length}</strong><span>събития</span></div>
    <div class="stat"><strong>${scientific}</strong><span>научни / лекции</span></div>
    <div class="stat"><strong>${student}</strong><span>студентски / outreach</span></div>
    <div class="stat"><strong>${links}</strong><span>с доказателствен линк</span></div>
  `;
}

function chunkEvents(events, size = 4) {
  const chunks = [];
  for (let i = 0; i < events.length; i += size) {
    const row = events.slice(i, i + size);
    chunks.push((chunks.length % 2 === 1) ? row.reverse() : row);
  }
  return chunks;
}

function renderRoadmap(events) {
  if (!events.length) {
    els.roadmap.innerHTML = `<div class="status">Няма събития за избраните филтри.</div>`;
    return;
  }

  els.roadmap.innerHTML = chunkEvents(events).map(row => `
    <div class="road-row">
      ${row.map(ev => `
        <button class="road-segment ${getCategoryClass(ev.color)}" data-id="${escapeHtml(ev.id)}">
          <div class="event-date">${escapeHtml(formatDate(ev.dateObj))}</div>
          <div class="event-title">${escapeHtml(iconMap[ev.icon] || "•")} ${escapeHtml(ev.title_bg || ev.title_en)}</div>
          <span class="event-category">${escapeHtml(ev.category)}</span>
        </button>
      `).join("")}
    </div>
  `).join("");

  els.roadmap.querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", () => openEvent(btn.dataset.id));
  });
}

function renderCards(events) {
  els.eventCards.innerHTML = events.map(ev => `
    <article class="card" data-id="${escapeHtml(ev.id)}">
      <div class="event-date">${escapeHtml(formatDate(ev.dateObj))}</div>
      <h3 class="event-title">${escapeHtml(ev.title_bg || ev.title_en)}</h3>
      <span class="event-category">${escapeHtml(ev.category)}</span>
      <p>${escapeHtml(ev.description_bg || ev.description_en || "").slice(0, 280)}</p>
    </article>
  `).join("") || `<div class="status">Няма събития за избраните филтри.</div>`;

  els.eventCards.querySelectorAll("[data-id]").forEach(card => {
    card.addEventListener("click", () => openEvent(card.dataset.id));
  });
}

function renderReport(events) {
  els.reportTableBody.innerHTML = events.map(ev => `
    <tr>
      <td>${escapeHtml(formatDate(ev.dateObj))}</td>
      <td>${escapeHtml(ev.category)}</td>
      <td><strong>${escapeHtml(ev.title_bg || ev.title_en)}</strong></td>
      <td>${escapeHtml(ev.participants)}</td>
      <td>${escapeHtml(ev.description_bg || ev.description_en)}</td>
      <td>${ev.facebook_url ? `<a href="${escapeHtml(ev.facebook_url)}" target="_blank" rel="noreferrer">Facebook</a>` : ""}</td>
      <td>${escapeHtml(ev.report_notes)}</td>
    </tr>
  `).join("");
}

function openEvent(id) {
  const ev = state.allEvents.find(item => String(item.id) === String(id));
  if (!ev) return;

  const links = [
    ["Facebook", ev.facebook_url],
    ["Новина", ev.university_news_url],
    ["Публикация", ev.publication_url],
    ["Снимки", ev.photos_url]
  ].filter(([, url]) => url);

  els.dialogContent.innerHTML = `
    <div class="dialog-inner">
      <h3>${escapeHtml(ev.title_bg || ev.title_en)}</h3>
      <div class="dialog-meta">
        <span class="pill">${escapeHtml(formatDate(ev.dateObj))}</span>
        ${ev.endDateObj ? `<span class="pill">до ${escapeHtml(formatDate(ev.endDateObj))}</span>` : ""}
        <span class="pill">${escapeHtml(ev.category)}</span>
        ${ev.location ? `<span class="pill">${escapeHtml(ev.location)}</span>` : ""}
      </div>
      <p>${escapeHtml(ev.description_bg || ev.description_en || "")}</p>
      <p><strong>Участници:</strong> ${escapeHtml(ev.participants || "не е попълнено")}</p>
      <p><strong>Организатори:</strong> ${escapeHtml(ev.organizers || "не е попълнено")}</p>
      <p><strong>Отчетна бележка:</strong> ${escapeHtml(ev.report_notes || "не е попълнено")}</p>
      ${ev.source_status ? `<p><strong>Статус на източника:</strong> ${escapeHtml(ev.source_status)}</p>` : ""}
      <div class="link-list">
        ${links.map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`).join("")}
      </div>
    </div>
  `;
  els.dialog.showModal();
}

function render() {
  renderTabs();
  const events = getFilteredEvents();
  renderStats(events);
  renderRoadmap(events);
  renderCards(events);
  renderReport(events);

  document.querySelectorAll(".view").forEach(view => view.classList.remove("view--active"));
  document.getElementById(`${state.view}View`).classList.add("view--active");
  document.querySelectorAll(".view-button").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.view === state.view);
  });
}

function sheetRowsToEvents(sheetName, rows) {
  return rows.map((row, index) => {
    const dateObj = normalizeDate(row.date);
    const endDateObj = normalizeDate(row.end_date);
    return {
      ...row,
      id: row.id || `${sheetName}-${index + 1}`,
      year: sheetName,
      dateObj,
      endDateObj
    };
  });
}

async function loadWorkbook() {
  if (!window.XLSX) throw new Error("SheetJS did not load. Check your internet connection or vendor the library locally.");
  const response = await fetch("data/events.xlsx", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Cannot load data/events.xlsx (${response.status})`);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const yearSheets = workbook.SheetNames.filter(name => /^\d{4}$/.test(name)).sort();

  const events = [];
  yearSheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
    events.push(...sheetRowsToEvents(sheetName, rows));
  });

  state.allEvents = events;
  state.years = yearSheets;
  state.selectedYear = yearSheets[yearSheets.length - 1] || null;
}

function copyReportTable() {
  const events = getFilteredEvents();
  const rows = [
    ["Дата", "Категория", "Събитие", "Участници", "Описание", "Facebook", "Отчетна бележка"],
    ...events.map(ev => [
      formatDate(ev.dateObj), ev.category, ev.title_bg || ev.title_en, ev.participants,
      ev.description_bg || ev.description_en, ev.facebook_url, ev.report_notes
    ])
  ];
  const tsv = rows.map(row => row.map(cell => String(cell || "").replace(/\s+/g, " ").trim()).join("\t")).join("\n");
  navigator.clipboard.writeText(tsv).then(() => {
    els.copyReportBtn.textContent = "Копирано!";
    setTimeout(() => els.copyReportBtn.textContent = "Копирай отчетната таблица", 1400);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  els.categoryFilter.addEventListener("change", e => {
    state.selectedCategory = e.target.value;
    render();
  });
  els.searchInput.addEventListener("input", e => {
    state.search = e.target.value;
    render();
  });
  document.querySelectorAll(".view-button").forEach(btn => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      render();
    });
  });
  els.copyReportBtn.addEventListener("click", copyReportTable);

  try {
    await loadWorkbook();
    els.status.textContent = `Заредени са ${state.allEvents.length} записа от ${state.years.length} годишни листа в Excel файла.`;
    renderCategoryFilter();
    render();
  } catch (error) {
    console.error(error);
    els.status.classList.add("is-error");
    els.status.innerHTML = `
      <strong>Неуспешно зареждане.</strong>
      <span>${escapeHtml(error.message)}</span>
      <br />
      <span>Сайтът трябва да се отвори през GitHub Pages или локален уеб сървър, не директно като file://.</span>
    `;
  }
});
