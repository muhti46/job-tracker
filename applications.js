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
let draggedCardOriginalStatus = "";
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
  return columns.find((column) => column.status === status)?.label || status;
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

function syncColumnOrderFromDom() {
  columnOrder = [...document.querySelectorAll(".column")].map(
    (column) => column.dataset.status,
  );
}

$("#search-input").addEventListener("input", renderBoard);
$("#sort-select").addEventListener("change", renderBoard);
$("#board").addEventListener("dragstart", (event) => {
  const card = event.target.closest(".job-card");
  const columnHead = event.target.closest("[data-column-status]");
  if (card) {
    draggedCardId = card.dataset.id;
    draggedCardOriginalStatus = jobs.find((job) => job.id === draggedCardId)?.status || "applied";
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
  if (draggedColumnStatus) {
    column.classList.add("drag-over");
    const draggedColumn = document.querySelector(
      `.column[data-status="${draggedColumnStatus}"]`,
    );
    if (draggedColumn && draggedColumn !== column) {
      const bounds = column.getBoundingClientRect();
      const insertBefore = event.clientX < bounds.left + bounds.width / 2;
      if (insertBefore) {
        column.parentElement.insertBefore(draggedColumn, column);
      } else {
        column.parentElement.insertBefore(draggedColumn, column.nextElementSibling);
      }
      syncColumnOrderFromDom();
    }
    return;
  }
  if (draggedCardId) {
    const draggedCard = document.querySelector(`.job-card[data-id="${draggedCardId}"]`);
    const cards = column.querySelector(".cards");
    if (draggedCard && cards && !cards.contains(draggedCard)) {
      cards.appendChild(draggedCard);
      const job = jobs.find((item) => item.id === draggedCardId);
      if (job) job.status = column.dataset.status;
    }
    column.classList.add("drag-over");
    return;
  }
  column.classList.add("drag-over");
});
$("#board").addEventListener("dragenter", (event) => {
  const column = event.target.closest(".column");
  if (column) column.classList.add("drag-over");
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
    if (job) {
      ensureHistory(job);
      if (draggedCardOriginalStatus !== job.status) {
        job.updatedAt = new Date().toISOString();
        job.history.push({
          type: "moved",
          from: draggedCardOriginalStatus,
          status: job.status,
          at: job.updatedAt,
        });
      }
      await chrome.storage.local.set({ jobs });
      showFeedback(
        `Moved to ${columns.find((column) => column.status === job.status).label}.`,
      );
    }
    draggedCardId = "";
    draggedCardOriginalStatus = "";
    renderBoard();
    return;
  }
  if (draggedColumnStatus && draggedColumnStatus !== targetStatus) {
    syncColumnOrderFromDom();
    await chrome.storage.local.set({ columnOrder });
    draggedColumnStatus = "";
    document
      .querySelectorAll(".drag-over, .is-dragging")
      .forEach((element) => element.classList.remove("drag-over", "is-dragging"));
  }
});
$("#board").addEventListener("dragend", async () => {
  if (draggedColumnStatus) {
    syncColumnOrderFromDom();
    await chrome.storage.local.set({ columnOrder });
  }
  draggedCardId = "";
  draggedCardOriginalStatus = "";
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
document
  .querySelectorAll("[data-tab]")
  .forEach((button) =>
    button.addEventListener("click", () => switchTab(button.dataset.tab)),
  );
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
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeContactModal();
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
