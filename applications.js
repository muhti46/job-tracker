const columns = [
  { status: "applied", label: "Applied", className: "applied" },
  { status: "interview", label: "Interviewing", className: "interview" },
  { status: "offer", label: "Offer", className: "offer" },
  { status: "rejected", label: "Rejected", className: "rejected" },
];
const columnIcons = {
  applied:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10l4 4v12H5zM9 4v5h6V4M8 15h8M8 18h5"/></svg>',
  interview:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5a9 9 0 0 0 12 12l2 2M7 5l-3 3m3-3-3-3M17 19l3-3m-3 3 3 3"/></svg>',
  offer:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16H6zM9 4v5h6V4M9 13h6M9 17h4"/></svg>',
  rejected:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16H6zM9 8l6 6m0-6-6 6"/></svg>',
};
let jobs = [];
let columnOrder = columns.map((column) => column.status);
let draggedCardId = "";
let draggedColumnStatus = "";
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

async function loadJobs() {
  const data = await chrome.storage.local.get({ jobs: [] });
  jobs = data.jobs.map((job) =>
    job.status === "saved" ? { ...job, status: "applied" } : job,
  );
  if (jobs.some((job, index) => job.status !== data.jobs[index]?.status)) {
    await chrome.storage.local.set({ jobs });
  }
  const savedOrder = await chrome.storage.local.get({
    columnOrder: columnOrder,
  });
  columnOrder = savedOrder.columnOrder.filter((status) =>
    columns.some((column) => column.status === status),
  );
  columns.forEach((column) => {
    if (!columnOrder.includes(column.status)) columnOrder.push(column.status);
  });
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

function renderBoard() {
  const visibleJobs = filteredJobs();
  $("#total-count").textContent = `${jobs.length} jobs`;
  const orderedColumns = columnOrder.map((status) =>
    columns.find((column) => column.status === status),
  );
  $("#board").innerHTML = orderedColumns
    .map((column) => {
      const columnJobs = visibleJobs.filter(
        (job) => (job.status || "applied") === column.status,
      );
      return `<section class="column ${column.className}" data-status="${column.status}"><header class="column-head" draggable="true" data-column-status="${column.status}"><div class="column-title"><span class="column-icon">${columnIcons[column.status]}</span><h2>${column.label}</h2><span class="column-count">${columnJobs.length}</span></div><div class="column-tools"><button type="button" aria-label="Column settings">⚙</button><span class="drag-handle" aria-label="Drag column">⠿</span></div></header><div class="cards">${columnJobs.length ? columnJobs.map(renderCard).join("") : '<p class="empty-column">No applications here</p>'}</div></section>`;
    })
    .join("");
}

function renderCard(job) {
  return `<article class="job-card" draggable="true" data-id="${escapeHtml(job.id)}"><p class="company">${escapeHtml(job.company || "Company not specified")}</p><h3 class="job-title">${escapeHtml(job.title || "Untitled job")}</h3><div class="card-meta">${job.location ? `<span>⌖ ${escapeHtml(job.location)}</span>` : ""}${job.workType ? `<span>${escapeHtml(job.workType)}</span>` : ""}<span>◷ ${formatDate(job.createdAt)}</span></div><div class="card-actions"><button data-action="edit" type="button">Edit</button>${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank">Open</a>` : ""}<button class="delete" data-action="delete" type="button">Delete</button></div></article>`;
}

function openModal(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job) return;
  const form = $("#modal-form");
  $("#modal-company").textContent = job.company || "Company not specified";
  $("#modal-title").textContent = job.title || "Edit application";
  $("#modal-subtitle").textContent = `${job.location || "Location not specified"} · ${job.workType || "Work arrangement not specified"}`;
  ["title", "company", "location", "workType", "salary", "description", "notes"].forEach((field) => {
    if (form.elements[field]) form.elements[field].value = job[field] || "";
  });
  form.elements.status.value = job.status || "applied";
  $("#modal-timeline").innerHTML = `<p>Created ${formatDate(job.createdAt)}</p>${job.updatedAt ? `<p>Last updated ${formatDate(job.updatedAt)}</p>` : ""}`;
  $("#job-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  form.dataset.id = id;
  switchTab("details");
}

function closeModal() {
  $("#job-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function switchTab(tab) {
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
}

function showFeedback(message) {
  $("#feedback").textContent = message;
  $("#feedback").classList.add("visible");
  setTimeout(() => $("#feedback").classList.remove("visible"), 2400);
}

$("#search-input").addEventListener("input", renderBoard);
$("#sort-select").addEventListener("change", renderBoard);
$("#board").addEventListener("dragstart", (event) => {
  const card = event.target.closest(".job-card");
  const columnHead = event.target.closest("[data-column-status]");
  if (card) {
    draggedCardId = card.dataset.id;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `card:${draggedCardId}`);
  } else if (columnHead) {
    draggedColumnStatus = columnHead.dataset.columnStatus;
    columnHead.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `column:${draggedColumnStatus}`);
  }
});
$("#board").addEventListener("dragover", (event) => {
  const column = event.target.closest(".column");
  if (!column) return;
  event.preventDefault();
  column.classList.add("drag-over");
});
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
    .querySelectorAll(".drag-over, .is-dragging")
    .forEach((element) => element.classList.remove("drag-over", "is-dragging"));
  const targetStatus = targetColumn.dataset.status;
  if (draggedCardId) {
    const job = jobs.find((item) => item.id === draggedCardId);
    if (job && job.status !== targetStatus) {
      job.status = targetStatus;
      job.updatedAt = new Date().toISOString();
      await chrome.storage.local.set({ jobs });
      showFeedback(
        `Moved to ${columns.find((column) => column.status === targetStatus).label}.`,
      );
    }
    draggedCardId = "";
    renderBoard();
    return;
  }
  if (draggedColumnStatus && draggedColumnStatus !== targetStatus) {
    const fromIndex = columnOrder.indexOf(draggedColumnStatus);
    const toIndex = columnOrder.indexOf(targetStatus);
    columnOrder.splice(fromIndex, 1);
    columnOrder.splice(
      fromIndex < toIndex ? toIndex - 1 : toIndex,
      0,
      draggedColumnStatus,
    );
    await chrome.storage.local.set({ columnOrder });
    draggedColumnStatus = "";
    renderBoard();
  }
});
$("#board").addEventListener("dragend", () => {
  draggedCardId = "";
  draggedColumnStatus = "";
  document
    .querySelectorAll(".drag-over, .is-dragging")
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
document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
$("#modal-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const job = jobs.find((item) => item.id === event.currentTarget.dataset.id);
  if (!job) return;
  Object.assign(job, Object.fromEntries(new FormData(event.currentTarget).entries()), { updatedAt: new Date().toISOString() });
  await chrome.storage.local.set({ jobs });
  renderBoard();
  closeModal();
  showFeedback("Changes saved.");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.jobs) {
    jobs = changes.jobs.newValue || [];
    renderBoard();
  }
});

loadJobs();
