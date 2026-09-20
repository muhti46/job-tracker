const columns = [
  { status: "applied", label: "Applied", className: "applied" },
  { status: "interview", label: "Interviewing", className: "interview" },
  { status: "offer", label: "Offer", className: "offer" },
  { status: "rejected", label: "Rejected", className: "rejected" },
];
const iconLibrary = {
  document: {
    label: "Document",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6M9 8h2"/></svg>',
  },
  phone: {
    label: "Phone",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>',
  },
  thumbsUp: {
    label: "Thumbs Up",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
  },
  thumbsDown: {
    label: "Thumbs Down",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.7a2 2 0 0 0-2 1.7l-1.4 9a2 2 0 0 0 2 2.3z"/><path d="M17 2h2.7A2.3 2.3 0 0 1 22 4v7a2.3 2.3 0 0 1-2.3 2H17"/></svg>',
  },
  star: {
    label: "Star",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
  },
  bell: {
    label: "Bell",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  },
  sadFace: {
    label: "Sad Face",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  },
};
const colorLibrary = {
  blue: { label: "Blue", hex: "#1f8fce" },
  purple: { label: "Purple", hex: "#6d28d9" },
  green: { label: "Green", hex: "#16a34a" },
  red: { label: "Red", hex: "#ef4444" },
  gray: { label: "Gray", hex: "#9ca3af" },
  orange: { label: "Orange", hex: "#f0703c" },
};
const defaultColumnSettings = {
  applied: { label: "Applied", color: "purple", icon: "document" },
  interview: { label: "Interviewing", color: "green", icon: "phone" },
  offer: { label: "Offer", color: "green", icon: "document" },
  rejected: { label: "Rejected", color: "red", icon: "thumbsDown" },
};
let columnSettings = {};

function getColumnSettings(status) {
  return {
    ...defaultColumnSettings[status],
    ...(columnSettings[status] || {}),
  };
}
let jobs = [];
let columnOrder = columns.map((column) => column.status);
let draggedCardId = "";
let draggedColumnStatus = "";
let draggedCardOriginalStatus = "";
let dragOffsetX = 0;
let dragOffsetY = 0;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );

// Simple confetti fallback – creates a few colored pieces that fall using CSS animation.
function showConfetti() {
  const colors = [
    "#ff5e7e",
    "#88ff5a",
    "#fcff42",
    "#ffa62d",
    "#26ccff",
    "#a25afd",
    "#ff36ff",
  ];
  const pieceCount = 30;
  for (let i = 0; i < pieceCount; i++) {
    const div = document.createElement("div");
    div.className = "confetti-piece";
    // Random horizontal position
    div.style.left = Math.random() * 100 + "%";
    // Random color
    div.style.background = colors[Math.floor(Math.random() * colors.length)];
    // Random size
    const size = 6 + Math.random() * 8;
    div.style.width = size + "px";
    div.style.height = size + "px";
    document.body.appendChild(div);
    // Remove after animation (3s)
    setTimeout(() => div.remove(), 3200);
  }
  console.log("showConfetti called, pieces created");
}

async function loadJobs() {
  const data = await chrome.storage.local.get({ jobs: [] });
  jobs = data.jobs.map((job) =>
    ensureHistory(job.status === "saved" ? { ...job, status: "applied" } : job),
  );
  await chrome.storage.local.set({ jobs });
  const savedOrder = await chrome.storage.local.get({
    columnOrder: columnOrder,
  });
  columnOrder = savedOrder.columnOrder.filter((status) =>
    columns.some((column) => column.status === status),
  );
  columns.forEach((column) => {
    if (!columnOrder.includes(column.status)) columnOrder.push(column.status);
  });
  const savedColumnSettings = await chrome.storage.local.get({
    columnSettings: {},
  });
  columnSettings = savedColumnSettings.columnSettings;
  renderBoard();
}

function filteredJobs() {
  const query = $("#search-input").value.trim().toLowerCase();
  const sort = $("#sort-select").value;
  const result = jobs.filter((job) =>
    `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(query),
  );
  return result.sort((first, second) => {
    if (sort === "company")
      return (first.company || "").localeCompare(second.company || "");
    if (sort === "title")
      return (first.title || "").localeCompare(second.title || "");
    const firstDate = new Date(first.createdAt || 0).getTime();
    const secondDate = new Date(second.createdAt || 0).getTime();
    return sort === "oldest" ? firstDate - secondDate : secondDate - firstDate;
  });
}

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status) {
  return getColumnSettings(status)?.label || status;
}

function relativeTime(value) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86400000),
  );
  return days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`;
}

function ensureHistory(job) {
  const createdAt = job.createdAt || new Date().toISOString();
  if (!job.history?.length) {
    job.history = [{ type: "created", status: "applied", at: createdAt }];
    if (job.status && job.status !== "applied") {
      job.history.push({
        type: "moved",
        status: job.status,
        at: job.updatedAt || createdAt,
      });
    }
    return job;
  }
  const firstEvent = job.history.find((event) => event.type === "created");
  if (firstEvent && firstEvent.status !== "applied") {
    firstEvent.status = "applied";
    const hasCurrentStatus = job.history.some(
      (event) => event.type === "moved" && event.status === job.status,
    );
    if (job.status && job.status !== "applied" && !hasCurrentStatus) {
      job.history.push({
        type: "moved",
        status: job.status,
        at: job.updatedAt || createdAt,
      });
    }
  }
  return job;
}

function renderTimeline(job) {
  const events = (job.history || [])
    .slice()
    .sort((first, second) => new Date(second.at) - new Date(first.at));
  $("#modal-timeline").innerHTML = events.length
    ? `<div class="timeline-list">${events.map((event) => `<div class="timeline-event"><span class="timeline-dot"></span><div><strong>${event.type === "created" ? "Created in" : "Moved to"} <em class="status-${escapeHtml(event.status)}">${escapeHtml(statusLabel(event.status))}</em></strong><small>${relativeTime(event.at)}</small></div></div>`).join("")}</div>`
    : '<p class="timeline-empty">No timeline events yet.</p>';
}

function renderBoard() {
  const visibleJobs = filteredJobs();
  $("#total-count").textContent = `${jobs.length} jobs`;
  const orderedColumns = columnOrder.map((status) =>
    columns.find((column) => column.status === status),
  );
  $("#board").innerHTML = orderedColumns
    .map((column) => {
      const settings = getColumnSettings(column.status);
      const columnJobs = visibleJobs
        .filter((job) => (job.status || "applied") === column.status)
        .sort((first, second) => {
          const firstOrder = Number.isFinite(first.order)
            ? first.order
            : Number.MAX_SAFE_INTEGER;
          const secondOrder = Number.isFinite(second.order)
            ? second.order
            : Number.MAX_SAFE_INTEGER;
          return firstOrder - secondOrder;
        });
      return `<section class="column ${column.className}" data-status="${column.status}"><header class="column-head" draggable="true" data-column-status="${column.status}" style="background:${colorLibrary[settings.color].hex}"><div class="column-title"><span class="column-icon">${iconLibrary[settings.icon].svg}</span><h2>${escapeHtml(settings.label)}</h2><span class="column-count">(${columnJobs.length})</span></div><div class="column-tools"><button type="button" data-action="edit-column" data-status="${column.status}" aria-label="Column settings">⚙</button><span class="drag-handle" aria-label="Drag column">⠿</span></div></header><div class="cards">${columnJobs.length ? columnJobs.map(renderCard).join("") : '<p class="empty-column">No applications here</p>'}</div></section>`;
    })
    .join("");
}

function renderCard(job) {
  return `<article class="job-card" draggable="true" data-id="${escapeHtml(job.id)}"><p class="company">${escapeHtml(job.company || "Company not specified")}</p><h3 class="job-title">${escapeHtml(job.title || "Untitled job")}</h3><div class="card-meta">${job.location ? `<span>⌖ ${escapeHtml(job.location)}</span>` : ""}${job.workType ? `<span>${escapeHtml(job.workType)}</span>` : ""}<span>◷ ${formatDate(job.createdAt)}</span></div><div class="card-actions"><button data-action="edit" type="button">Edit</button>${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank">Open</a>` : ""}<button class="delete" data-action="delete" type="button">Delete</button></div></article>`;
}

function formatDescriptionHtml(rawText) {
  const lines = (rawText || "").split("\n").map((line) => line.trim());
  const blocks = [];
  let currentList = null;
  const isBullet = (line) => /^([•\-*]|\d+[.)])\s+/.test(line);
  const isHeading = (line, nextLine) =>
    line.length > 0 &&
    line.length <= 70 &&
    !/[.!?]$/.test(line) &&
    !isBullet(line) &&
    (nextLine === undefined ||
      nextLine === "" ||
      isBullet(nextLine) ||
      /^[A-ZÄÖÜ0-9]/.test(nextLine));

  lines.forEach((line, index) => {
    if (!line) {
      currentList = null;
      return;
    }
    if (isBullet(line)) {
      const content = line.replace(/^([•\-*]|\d+[.)])\s+/, "");
      if (!currentList) {
        currentList = [];
        blocks.push({ type: "list", items: currentList });
      }
      currentList.push(content);
      return;
    }
    currentList = null;
    if (isHeading(line, lines[index + 1])) {
      blocks.push({ type: "heading", text: line });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  });

  return blocks
    .map((block) => {
      if (block.type === "list")
        return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      if (block.type === "heading") return `<h4>${escapeHtml(block.text)}</h4>`;
      return `<p>${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

function renderDescriptionView(rawText) {
  $("#description-view").innerHTML =
    formatDescriptionHtml(rawText) ||
    '<p class="description-empty">No description saved.</p>';
}

function openModal(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job) return;
  const form = $("#modal-form");
  $("#modal-company").textContent = job.company || "Company not specified";
  $("#modal-title").textContent = job.title || "Edit application";
  $("#modal-subtitle").textContent =
    `${job.location || "Location not specified"} · ${job.workType || "Work arrangement not specified"}`;
  [
    "title",
    "company",
    "location",
    "workType",
    "salary",
    "description",
    "notes",
  ].forEach((field) => {
    if (form.elements[field]) form.elements[field].value = job[field] || "";
  });
  form.elements.status.value = job.status || "applied";
  renderDescriptionView(job.description || "");
  $("#description-view").classList.remove("hidden");
  $("#description-input").classList.add("hidden");
  $("#description-edit-toggle").textContent = "Edit";
  renderTimeline(job);
  renderContacts(job);
  $("#contact-form").classList.add("hidden");
  $("#job-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  form.dataset.id = id;
  switchTab("details");
}

function renderContacts(job) {
  const contacts = job.contacts || [];
  $("#contacts-list").innerHTML = contacts.length
    ? contacts
        .map(
          (contact, index) =>
            `<article class="contact-card"><div class="contact-avatar">${escapeHtml((contact.name || "?").slice(0, 1).toUpperCase())}</div><div class="contact-info"><strong>${escapeHtml(contact.name || "Unnamed contact")}</strong><span>${escapeHtml(contact.position || "Position not specified")}${contact.company ? ` · ${escapeHtml(contact.company)}` : ""}</span>${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>` : ""}<p>${escapeHtml(contact.notes || "")}</p></div><button class="contact-delete" data-contact-index="${index}" type="button" aria-label="Delete contact">×</button></article>`,
        )
        .join("")
    : '<div class="contacts-empty">Contacts will appear here.<br><button id="empty-add-contact" class="empty-add-contact" type="button">+ Add contact</button></div>';
}

function findContactDefaults(job) {
  const source = `${job.description || ""} ${job.notes || ""}`;
  return {
    name: (source.match(
      /(?:contact|ansprechpartner(?:in)?)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
    ) || ["", ""])[1],
    position: /recruiter/i.test(source)
      ? "Recruiter"
      : /hiring manager/i.test(source)
        ? "Hiring Manager"
        : "",
    company: job.company || "",
    email: (source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0],
    phone: (source.match(
      /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]\d{3,4}/,
    ) || [""])[0],
    linkedin: (source.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i) || [
      "",
    ])[0],
    job: job.title || "",
    notes: "",
  };
}

function openContactModal() {
  const job = jobs.find((item) => item.id === $("#modal-form").dataset.id);
  if (!job) return;
  const defaults = findContactDefaults(job);
  const form = $("#contact-modal-form");
  Object.entries(defaults).forEach(([field, value]) => {
    if (form.elements[field]) form.elements[field].value = value;
  });
  $("#contact-modal").classList.remove("hidden");
  form.elements.name.focus();
}

function closeContactModal() {
  $("#contact-modal").classList.add("hidden");
}

let editingColumnStatus = "";
let pendingColumnColor = "";
let pendingColumnIcon = "";

function currentColumnPreviewName() {
  const nameInput = $("#column-name-input");
  return nameInput.value.trim() || nameInput.placeholder;
}

function updateColumnColorTrigger() {
  const color = colorLibrary[pendingColumnColor];
  $("#column-color-swatch").style.background = color.hex;
  $("#column-color-label").textContent = color.label;
}

function updateColumnIconTrigger() {
  const icon = iconLibrary[pendingColumnIcon];
  $("#column-icon-swatch").innerHTML = icon.svg;
  $("#column-icon-label").textContent = icon.label;
}

function renderColumnColorMenu() {
  $("#column-color-menu").innerHTML = Object.entries(colorLibrary)
    .map(
      ([key, value]) =>
        `<button type="button" class="dropdown-option" data-color="${key}"><span class="swatch" style="background:${value.hex}"></span><span>${value.label}</span>${key === pendingColumnColor ? '<span class="option-check">\u2713</span>' : ""}</button>`,
    )
    .join("");
}

function renderColumnIconMenu() {
  $("#column-icon-menu").innerHTML = Object.entries(iconLibrary)
    .map(
      ([key, value]) =>
        `<button type="button" class="dropdown-option" data-icon="${key}"><span class="icon-swatch">${value.svg}</span><span>${value.label}</span>${key === pendingColumnIcon ? '<span class="option-check">\u2713</span>' : ""}</button>`,
    )
    .join("");
}

function updateColumnPreview() {
  const color = colorLibrary[pendingColumnColor];
  const icon = iconLibrary[pendingColumnIcon];
  const count = jobs.filter(
    (job) => (job.status || "applied") === editingColumnStatus,
  ).length;
  const preview = $("#column-preview");
  preview.style.background = color.hex;
  preview.innerHTML = `<span class="column-icon">${icon.svg}</span><span class="preview-name">${escapeHtml(currentColumnPreviewName().toUpperCase())}</span><span class="preview-count">(${count})</span>`;
}

function openColumnModal(status) {
  editingColumnStatus = status;
  const settings = getColumnSettings(status);
  pendingColumnColor = settings.color;
  pendingColumnIcon = settings.icon;
  const nameInput = $("#column-name-input");
  nameInput.value = "";
  nameInput.placeholder = settings.label;
  renderColumnColorMenu();
  renderColumnIconMenu();
  updateColumnColorTrigger();
  updateColumnIconTrigger();
  updateColumnPreview();
  $("#column-color-menu").classList.add("hidden");
  $("#column-icon-menu").classList.add("hidden");
  $("#column-modal").classList.remove("hidden");
}

function closeColumnModal() {
  $("#column-modal").classList.add("hidden");
  $("#column-color-menu").classList.add("hidden");
  $("#column-icon-menu").classList.add("hidden");
}

function closeModal() {
  $("#job-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function switchTab(tab) {
  document
    .querySelectorAll("[data-tab]")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.tab === tab),
    );
  document
    .querySelectorAll("[data-panel]")
    .forEach((panel) =>
      panel.classList.toggle("active", panel.dataset.panel === tab),
    );
}

function showFeedback(message) {
  $("#feedback").textContent = message;
  $("#feedback").classList.add("visible");
  setTimeout(() => $("#feedback").classList.remove("visible"), 2400);
}

function syncJobOrderFromDom(status) {
  const column = document.querySelector(`.column[data-status="${status}"]`);
  if (!column) return;
  [...column.querySelectorAll(".job-card")].forEach((card, index) => {
    const job = jobs.find((item) => item.id === card.dataset.id);
    if (job) job.order = index;
  });
}

$("#search-input").addEventListener("input", renderBoard);
$("#sort-select").addEventListener("change", renderBoard);
$("#board").addEventListener("dragstart", (event) => {
  const card = event.target.closest(".job-card");
  const columnHead = event.target.closest("[data-column-status]");
  if (card) {
    event.stopPropagation();
    document
      .querySelectorAll(".drag-over")
      .forEach((element) => element.classList.remove("drag-over"));
    draggedCardId = card.dataset.id;
    draggedCardOriginalStatus =
      jobs.find((job) => job.id === draggedCardId)?.status || "applied";
    card.classList.add("is-dragging");
    const cardBounds = card.getBoundingClientRect();
    dragOffsetX = event.clientX - cardBounds.left;
    dragOffsetY = event.clientY - cardBounds.top;
    const transparentDragImage = document.createElement("canvas");
    transparentDragImage.width = 1;
    transparentDragImage.height = 1;
    event.dataTransfer.setDragImage(transparentDragImage, 0, 0);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `card:${draggedCardId}`);
    // Defer turning the card into a fixed-position element: mutating its
    // layout synchronously inside dragstart makes some browsers cancel drag.
    setTimeout(() => {
      if (draggedCardId !== card.dataset.id) return;
      card.classList.add("drag-floating");
      card.style.width = `${cardBounds.width}px`;
      moveDraggedCard(event.clientX, event.clientY);
    }, 0);
  } else if (columnHead) {
    event.stopPropagation();
    draggedColumnStatus = columnHead.dataset.columnStatus;
    const columnEl = columnHead.closest(".column");
    columnHead.classList.add("is-dragging");
    const columnBounds = columnEl.getBoundingClientRect();
    dragOffsetX = event.clientX - columnBounds.left;
    dragOffsetY = event.clientY - columnBounds.top;
    const transparentColumnDragImage = document.createElement("canvas");
    transparentColumnDragImage.width = 1;
    transparentColumnDragImage.height = 1;
    event.dataTransfer.setDragImage(transparentColumnDragImage, 0, 0);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `column:${draggedColumnStatus}`);
    // Same deferred-fixed-position trick as card dragging: mutating layout
    // synchronously inside dragstart makes some browsers cancel the drag.
    setTimeout(() => {
      if (draggedColumnStatus !== columnEl.dataset.status) return;
      columnEl.classList.add("column-floating");
      columnEl.style.width = `${columnBounds.width}px`;
      columnEl.style.height = `${columnBounds.height}px`;
      moveDraggedColumn(event.clientX, event.clientY);
    }, 0);
  }
});
$("#board").addEventListener("dragover", (event) => {
  const column = event.target.closest(".column");
  if (draggedCardId) moveDraggedCard(event.clientX, event.clientY);
  if (draggedColumnStatus) moveDraggedColumn(event.clientX, event.clientY);
  if (!column) return;
  event.preventDefault();
});
function moveDraggedCard(x, y) {
  const card = document.querySelector(`.job-card[data-id="${draggedCardId}"]`);
  if (!card) return;
  card.style.left = `${x - dragOffsetX}px`;
  card.style.top = `${y - dragOffsetY}px`;
}

function moveDraggedColumn(x, y) {
  const columnEl = document.querySelector(
    `.column[data-status="${draggedColumnStatus}"]`,
  );
  if (!columnEl) return;
  columnEl.style.left = `${x - dragOffsetX}px`;
  columnEl.style.top = `${y - dragOffsetY}px`;
}

document.addEventListener("dragover", (event) => {
  if (draggedCardId) moveDraggedCard(event.clientX, event.clientY);
  if (draggedColumnStatus) moveDraggedColumn(event.clientX, event.clientY);
});

function mostOverlappingColumn(card) {
  return mostOverlappingColumnExcluding(card.getBoundingClientRect(), null);
}

function mostOverlappingColumnExcluding(bounds, excludeColumn) {
  let winner = null;
  let winnerArea = 0;
  document.querySelectorAll(".column").forEach((column) => {
    if (column === excludeColumn) return;
    const columnBounds = column.getBoundingClientRect();
    const overlapX = Math.max(
      0,
      Math.min(bounds.right, columnBounds.right) -
        Math.max(bounds.left, columnBounds.left),
    );
    const overlapY = Math.max(
      0,
      Math.min(bounds.bottom, columnBounds.bottom) -
        Math.max(bounds.top, columnBounds.top),
    );
    const area = overlapX * overlapY;
    if (area > winnerArea) {
      winnerArea = area;
      winner = column;
    }
  });
  return winner;
}

$("#board").addEventListener("dragleave", (event) => {
  const column = event.target.closest(".column");
  if (column && !column.contains(event.relatedTarget))
    column.classList.remove("drag-over");
});
$("#board").addEventListener("drop", async (event) => {
  const targetColumn = event.target.closest(".column");
  if (!targetColumn) return;
  event.preventDefault();
  document
    .querySelectorAll(".drag-over, .drag-ready, .is-dragging")
    .forEach((element) => element.classList.remove("drag-over", "is-dragging"));
  if (draggedCardId) {
    const job = jobs.find((item) => item.id === draggedCardId);
    const draggedCard = document.querySelector(
      `.job-card[data-id="${draggedCardId}"]`,
    );
    // Overlap must be measured while the card is still floating at the
    // drop position, before its fixed styles are cleared.
    const targetColumnForCard = draggedCard
      ? mostOverlappingColumn(draggedCard)
      : null;
    if (draggedCard) {
      draggedCard.classList.remove("is-dragging", "drag-floating");
      draggedCard.removeAttribute("style");
    }
    if (job && draggedCard) {
      ensureHistory(job);
      job.status =
        targetColumnForCard?.dataset.status || draggedCardOriginalStatus;
      if (draggedCardOriginalStatus !== job.status) {
        job.updatedAt = new Date().toISOString();
        job.history.push({
          type: "moved",
          from: draggedCardOriginalStatus,
          status: job.status,
          at: job.updatedAt,
        });
        job.order = Number.MAX_SAFE_INTEGER;
      }
      const movedLabel = getColumnSettings(job.status).label;
      // Clear drag state before awaiting so a stray dragend (which fires
      // right after drop, before this promise settles) can't revert status.
      draggedCardId = "";
      draggedCardOriginalStatus = "";
      await chrome.storage.local.set({ jobs });
      showFeedback(`Moved to ${movedLabel}.`);
      // If the job was moved to the Offer column, celebrate with confetti.
      if (job.status === "offer") {
        console.log("Offer status detected, triggering confetti");
        if (typeof confetti === "function") {
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch (e) {
            // If the library fails, fall back to CSS pieces.
            showConfetti();
          }
        } else {
          // Simple CSS‑based fallback.
          showConfetti();
        }
      }
      renderBoard();
      return;
    }
    draggedCardId = "";
    draggedCardOriginalStatus = "";
    renderBoard();
    return;
  }
  if (draggedColumnStatus) {
    const columnEl = document.querySelector(
      `.column[data-status="${draggedColumnStatus}"]`,
    );
    // Overlap must be measured while the column is still floating at the
    // drop position, before its fixed styles are cleared.
    const columnBounds = columnEl ? columnEl.getBoundingClientRect() : null;
    const winner = columnBounds
      ? mostOverlappingColumnExcluding(columnBounds, columnEl)
      : null;
    if (columnEl) {
      columnEl.classList.remove("is-dragging", "column-floating");
      columnEl.removeAttribute("style");
    }
    if (winner && winner.dataset.status !== draggedColumnStatus) {
      const winnerBounds = winner.getBoundingClientRect();
      const insertBefore =
        columnBounds.left + columnBounds.width / 2 <
        winnerBounds.left + winnerBounds.width / 2;
      const fromIndex = columnOrder.indexOf(draggedColumnStatus);
      columnOrder.splice(fromIndex, 1);
      let toIndex = columnOrder.indexOf(winner.dataset.status);
      if (!insertBefore) toIndex += 1;
      columnOrder.splice(toIndex, 0, draggedColumnStatus);
      // Clear drag state before awaiting so a stray dragend (which fires
      // right after drop, before this promise settles) can't re-derive order.
      draggedColumnStatus = "";
      await chrome.storage.local.set({ columnOrder });
      renderBoard();
      return;
    }
    draggedColumnStatus = "";
    renderBoard();
  }
});
$("#board").addEventListener("dragend", async () => {
  if (draggedCardId) {
    const job = jobs.find((item) => item.id === draggedCardId);
    const draggedCard = document.querySelector(
      `.job-card[data-id="${draggedCardId}"]`,
    );
    if (draggedCard) {
      draggedCard.classList.remove("is-dragging", "drag-floating");
      draggedCard.removeAttribute("style");
    }
    if (job) job.status = draggedCardOriginalStatus || job.status;
    renderBoard();
  }
  if (draggedColumnStatus) {
    const columnEl = document.querySelector(
      `.column[data-status="${draggedColumnStatus}"]`,
    );
    if (columnEl) {
      columnEl.classList.remove("is-dragging", "column-floating");
      columnEl.removeAttribute("style");
    }
  }
  draggedCardId = "";
  draggedCardOriginalStatus = "";
  draggedColumnStatus = "";
  document
    .querySelectorAll(".drag-over, .drag-ready, .is-dragging")
    .forEach((element) => element.classList.remove("drag-over", "is-dragging"));
});
$("#board").addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const card = event.target.closest(".job-card");
  if (action === "close-modal") return closeModal();
  if (!card) return;
  const id = card.dataset.id;
  const job = jobs.find((item) => item.id === id);
  if (action === "edit") {
    openModal(id);
    return;
  }
  if (action === "delete") {
    jobs = jobs.filter((item) => item.id !== id);
    await chrome.storage.local.set({ jobs });
    renderBoard();
    showFeedback("Application deleted.");
  }
});

$("#board").addEventListener("click", (event) => {
  const card = event.target.closest(".job-card");
  if (card && !event.target.closest("button, a")) openModal(card.dataset.id);
});
$("#job-modal").addEventListener("click", (event) => {
  if (event.target.dataset.action === "close-modal") closeModal();
});
document
  .querySelectorAll("[data-tab]")
  .forEach((button) =>
    button.addEventListener("click", () => switchTab(button.dataset.tab)),
  );
$("#description-edit-toggle").addEventListener("click", () => {
  const view = $("#description-view");
  const input = $("#description-input");
  const isEditing = !input.classList.contains("hidden");
  if (isEditing) {
    renderDescriptionView(input.value);
    view.classList.remove("hidden");
    input.classList.add("hidden");
    $("#description-edit-toggle").textContent = "Edit";
  } else {
    view.classList.add("hidden");
    input.classList.remove("hidden");
    $("#description-edit-toggle").textContent = "Preview";
    input.focus();
  }
});
$("#modal-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const job = jobs.find((item) => item.id === event.currentTarget.dataset.id);
  if (!job) return;
  const previousStatus = job.status;
  Object.assign(
    job,
    Object.fromEntries(new FormData(event.currentTarget).entries()),
    { updatedAt: new Date().toISOString() },
  );
  if (previousStatus !== job.status) {
    ensureHistory(job);
    job.history.push({ type: "moved", status: job.status, at: job.updatedAt });
  }
  await chrome.storage.local.set({ jobs });
  renderBoard();
  closeModal();
  showFeedback("Changes saved.");
});
$("#add-contact-button").addEventListener("click", openContactModal);
$("#cancel-contact-button").addEventListener("click", () => {
  $("#contact-form").classList.add("hidden");
});
$("#save-contact-button").addEventListener("click", async () => {
  const form = $("#contact-form");
  const job = jobs.find((item) => item.id === $("#modal-form").dataset.id);
  if (!job) return;
  const contact = {
    name: form.querySelector('[name="contactName"]').value.trim(),
    position: form.querySelector('[name="contactPosition"]').value.trim(),
    company: form.querySelector('[name="contactCompany"]').value.trim(),
    email: form.querySelector('[name="contactEmail"]').value.trim(),
    phone: form.querySelector('[name="contactPhone"]').value.trim(),
    linkedin: form.querySelector('[name="contactLinkedin"]').value.trim(),
    notes: form.querySelector('[name="contactNotes"]').value.trim(),
  };
  if (!contact.name) return showFeedback("Add a contact name first.");
  job.contacts = [...(job.contacts || []), contact];
  await chrome.storage.local.set({ jobs });
  renderContacts(job);
  form.reset();
  form.classList.add("hidden");
  showFeedback("Contact added.");
});
$("#contacts-list").addEventListener("click", async (event) => {
  if (event.target.id === "empty-add-contact") {
    openContactModal();
    return;
  }
  const button = event.target.closest("[data-contact-index]");
  if (!button) return;
  const job = jobs.find((item) => item.id === $("#modal-form").dataset.id);
  if (!job) return;
  job.contacts.splice(Number(button.dataset.contactIndex), 1);
  await chrome.storage.local.set({ jobs });
  renderContacts(job);
  showFeedback("Contact removed.");
});
$("#contact-modal").addEventListener("click", (event) => {
  if (event.target.dataset.action === "close-contact-modal")
    closeContactModal();
});
$("#contact-modal-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const job = jobs.find((item) => item.id === $("#modal-form").dataset.id);
  if (!job) return;
  const values = Object.fromEntries(
    new FormData(event.currentTarget).entries(),
  );
  if (!values.name.trim()) return showFeedback("Add a contact name first.");
  job.contacts = [...(job.contacts || []), values];
  await chrome.storage.local.set({ jobs });
  renderContacts(job);
  closeContactModal();
  showFeedback("Contact added.");
});
$("#board").addEventListener("click", (event) => {
  const settingsButton = event.target.closest('[data-action="edit-column"]');
  if (!settingsButton) return;
  event.stopPropagation();
  openColumnModal(settingsButton.dataset.status);
});
$("#column-modal").addEventListener("click", (event) => {
  if (event.target.dataset.action === "close-column-modal") closeColumnModal();
});
$("#column-name-input").addEventListener("input", updateColumnPreview);
$("#column-color-trigger").addEventListener("click", (event) => {
  event.stopPropagation();
  $("#column-icon-menu").classList.add("hidden");
  $("#column-color-menu").classList.toggle("hidden");
});
$("#column-icon-trigger").addEventListener("click", (event) => {
  event.stopPropagation();
  $("#column-color-menu").classList.add("hidden");
  $("#column-icon-menu").classList.toggle("hidden");
});
$("#column-color-menu").addEventListener("click", (event) => {
  const option = event.target.closest("[data-color]");
  if (!option) return;
  pendingColumnColor = option.dataset.color;
  renderColumnColorMenu();
  updateColumnColorTrigger();
  updateColumnPreview();
  $("#column-color-menu").classList.add("hidden");
});
$("#column-icon-menu").addEventListener("click", (event) => {
  const option = event.target.closest("[data-icon]");
  if (!option) return;
  pendingColumnIcon = option.dataset.icon;
  renderColumnIconMenu();
  updateColumnIconTrigger();
  updateColumnPreview();
  $("#column-icon-menu").classList.add("hidden");
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown-field")) {
    $("#column-color-menu")?.classList.add("hidden");
    $("#column-icon-menu")?.classList.add("hidden");
  }
});
$("#column-modal-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  columnSettings[editingColumnStatus] = {
    label: currentColumnPreviewName(),
    color: pendingColumnColor,
    icon: pendingColumnIcon,
  };
  await chrome.storage.local.set({ columnSettings });
  closeColumnModal();
  renderBoard();
  showFeedback("Column updated.");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeContactModal();
    closeColumnModal();
    closeModal();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.jobs) {
    jobs = changes.jobs.newValue || [];
    renderBoard();
  }
});

loadJobs();
// Temporary test trigger
showConfetti();
