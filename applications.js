const columns = [
  { status: "saved", label: "Saved", className: "saved" },
  { status: "applied", label: "Applied", className: "applied" },
  { status: "interview", label: "Interviewing", className: "interview" },
  { status: "offer", label: "Offer", className: "offer" },
  { status: "rejected", label: "Rejected", className: "rejected" },
];
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
  jobs = data.jobs;
  const savedOrder = await chrome.storage.local.get({ columnOrder: columnOrder });
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
  const orderedColumns = columnOrder.map((status) => columns.find((column) => column.status === status));
  $("#board").innerHTML = orderedColumns
    .map((column) => {
      const columnJobs = visibleJobs.filter(
        (job) => (job.status || "saved") === column.status,
      );
      return `<section class="column ${column.className}" data-status="${column.status}"><header class="column-head" draggable="true" data-column-status="${column.status}"><h2>${column.label}</h2><span class="column-count">${columnJobs.length}</span></header><div class="cards">${columnJobs.length ? columnJobs.map(renderCard).join("") : '<p class="empty-column">No applications here</p>'}</div></section>`;
    })
    .join("");
}

function renderCard(job) {
  return `<article class="job-card" draggable="true" data-id="${escapeHtml(job.id)}"><p class="company">${escapeHtml(job.company || "Company not specified")}</p><h3 class="job-title">${escapeHtml(job.title || "Untitled job")}</h3><div class="card-meta">${job.location ? `<span>⌖ ${escapeHtml(job.location)}</span>` : ""}${job.workType ? `<span>${escapeHtml(job.workType)}</span>` : ""}<span>◷ ${formatDate(job.createdAt)}</span></div><div class="card-actions"><button data-action="edit" type="button">Edit</button>${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank">Open</a>` : ""}<button class="delete" data-action="delete" type="button">Delete</button></div></article>`;
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
  if (column && !column.contains(event.relatedTarget)) column.classList.remove("drag-over");
});
$("#board").addEventListener("drop", async (event) => {
  const targetColumn = event.target.closest(".column");
  if (!targetColumn) return;
  event.preventDefault();
  document.querySelectorAll(".drag-over, .is-dragging").forEach((element) => element.classList.remove("drag-over", "is-dragging"));
  const targetStatus = targetColumn.dataset.status;
  if (draggedCardId) {
    const job = jobs.find((item) => item.id === draggedCardId);
    if (job && job.status !== targetStatus) {
      job.status = targetStatus;
      job.updatedAt = new Date().toISOString();
      await chrome.storage.local.set({ jobs });
      showFeedback(`Moved to ${columns.find((column) => column.status === targetStatus).label}.`);
    }
    draggedCardId = "";
    renderBoard();
    return;
  }
  if (draggedColumnStatus && draggedColumnStatus !== targetStatus) {
    const fromIndex = columnOrder.indexOf(draggedColumnStatus);
    const toIndex = columnOrder.indexOf(targetStatus);
    columnOrder.splice(fromIndex, 1);
    columnOrder.splice(fromIndex < toIndex ? toIndex - 1 : toIndex, 0, draggedColumnStatus);
    await chrome.storage.local.set({ columnOrder });
    draggedColumnStatus = "";
    renderBoard();
  }
});
$("#board").addEventListener("dragend", () => {
  draggedCardId = "";
  draggedColumnStatus = "";
  document.querySelectorAll(".drag-over, .is-dragging").forEach((element) => element.classList.remove("drag-over", "is-dragging"));
});
$("#board").addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const card = event.target.closest(".job-card");
  if (!action || !card) return;
  const id = card.dataset.id;
  const job = jobs.find((item) => item.id === id);
  if (action === "edit") {
    window.open(
      chrome.runtime.getURL(`edit.html?id=${encodeURIComponent(id)}`),
      "_blank",
    );
    return;
  }
  if (action === "delete") {
    jobs = jobs.filter((item) => item.id !== id);
    await chrome.storage.local.set({ jobs });
    renderBoard();
    showFeedback("Application deleted.");
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.jobs) {
    jobs = changes.jobs.newValue || [];
    renderBoard();
  }
});

loadJobs();
