const statusLabels = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};
let jobs = [];

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
  renderJobs();
  requestCurrentJob();
}

function requestCurrentJob() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id || !tab.url?.includes("linkedin.com/jobs/")) return;
    chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" }, (job) => {
      if (chrome.runtime.lastError || !job) return;
      $("#capture-state").querySelector("strong").textContent =
        job.title || "Job found";
      $("#capture-state").querySelector("p").textContent =
        `${job.company || "Company unknown"} · ${job.location || "Location unknown"}`;
      $("#save-current").dataset.job = JSON.stringify(job);
    });
  });
}

async function saveCurrent() {
  const button = $("#save-current");
  const job = JSON.parse(button.dataset.job || "{}");
  if (!job.title && !job.description)
    return showFeedback("Open a LinkedIn job page first.");
  const newJob = {
    ...job,
    id: crypto.randomUUID(),
    status: "applied",
    createdAt: new Date().toISOString(),
  };
  jobs = [newJob, ...jobs];
  await chrome.storage.local.set({ jobs });
  renderJobs();
  showFeedback("Job added to your records.");
}

function showFeedback(message) {
  $("#feedback").textContent = message;
  setTimeout(() => {
    $("#feedback").textContent = "";
  }, 2800);
}

function renderJobs() {
  const filter = $("#status-filter").value;
  const visibleJobs = jobs.filter(
    (job) => filter === "all" || job.status === filter,
  );
  $("#job-count").textContent = `${jobs.length} jobs`;
  $("#empty-state").classList.toggle("hidden", visibleJobs.length > 0);
  $("#job-list").innerHTML = visibleJobs
    .map(
      (job) => `
    <article class="job-card" data-id="${job.id}">
    <div class="job-card-head"><div><h3 class="job-title">${escapeHtml(job.title || "Untitled job")}</h3><p class="company">${escapeHtml(job.company || "Company not specified")}</p></div>
    <select class="status-select" data-action="status" aria-label="Application status">${Object.entries(
      statusLabels,
    )
      .map(
        ([value, label]) =>
          `<option value="${value}" ${job.status === value ? "selected" : ""}>${label}</option>`,
      )
      .join("")}</select></div>
      <div class="meta">${job.location ? `<span>${escapeHtml(job.location)}</span>` : ""}${job.workType ? `<span>${escapeHtml(job.workType)}</span>` : ""}${job.salary ? `<span>${escapeHtml(job.salary)}</span>` : ""}</div>
      <div class="card-actions"><button class="text-button" data-action="edit" type="button">Edit</button>${job.url ? `<a class="text-button" href="${escapeHtml(job.url)}" target="_blank">Open job</a>` : ""}<button class="delete-button" data-action="delete" type="button">Delete</button></div>
    </article>`,
    )
    .join("");
}

$("#save-current").addEventListener("click", saveCurrent);
$("#status-filter").addEventListener("change", renderJobs);
$("#job-list").addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  const card = event.target.closest(".job-card");
  const id = card.dataset.id;
  const index = jobs.findIndex((job) => job.id === id);
  if (action === "delete") jobs.splice(index, 1);
  if (action === "edit") {
    await chrome.tabs.create({
      url: chrome.runtime.getURL(`edit.html?id=${encodeURIComponent(id)}`),
    });
    return;
  }
  await chrome.storage.local.set({ jobs });
  renderJobs();
});
$("#job-list").addEventListener("change", async (event) => {
  if (event.target.dataset.action !== "status") return;
  const job = jobs.find(
    (item) => item.id === event.target.closest(".job-card").dataset.id,
  );
  job.status = event.target.value;
  await chrome.storage.local.set({ jobs });
  renderJobs();
});
loadJobs();
