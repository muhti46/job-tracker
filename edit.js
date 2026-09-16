const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");
const form = document.querySelector("#edit-form");
const missingState = document.querySelector("#missing-state");
const feedback = document.querySelector("#feedback");
const saveButton = document.querySelector("#save-button");
let jobs = [];

function showFeedback(message, type = "success") {
  feedback.textContent = message;
  feedback.className = `feedback ${type} visible`;
  window.setTimeout(() => {
    feedback.classList.remove("visible");
  }, 2600);
}

async function loadJob() {
  const data = await chrome.storage.local.get({ jobs: [] });
  jobs = data.jobs;
  const job = jobs.find((item) => item.id === jobId);
  if (!job) {
    form.classList.add("hidden");
    missingState.classList.remove("hidden");
    return;
  }
  for (const field of [
    "title",
    "company",
    "location",
    "workType",
    "salary",
    "description",
    "notes",
  ]) {
    const input = form.elements[field];
    if (input) input.value = job[field] || "";
  }
  form.elements.status.value = job.status || "applied";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  saveButton.classList.add("is-saving");
  saveButton.disabled = true;
  saveButton.querySelector(".button-label").textContent = "Saving...";
  try {
    Object.assign(job, Object.fromEntries(new FormData(form).entries()), {
      updatedAt: new Date().toISOString(),
    });
    await chrome.storage.local.set({ jobs });
    showFeedback("Changes saved.");
  } catch {
    showFeedback("Could not save changes.", "error");
  } finally {
    saveButton.classList.remove("is-saving");
    saveButton.disabled = false;
    saveButton.querySelector(".button-label").textContent = "Save changes";
  }
});

document.querySelector("#cancel-button").addEventListener("click", () => {
  window.location.href = "popup.html";
});

loadJob();
