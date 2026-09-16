(() => {
  const buttonId = "job-tracker-save-button";

  function text(selector) {
    const element = document.querySelector(selector);
    return (element?.innerText || element?.textContent || "").trim();
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const value = text(selector);
      if (value) return value;
    }
    return "";
  }

  function longestText(selectors, minimumLength = 1) {
    let longest = "";
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const value = (element.innerText || element.textContent || "")
          .replace(/\s+/g, " ")
          .trim();
        if (value.length >= minimumLength && value.length > longest.length) {
          longest = value;
        }
      }
    }
    return longest;
  }

  function textNearHeading(pattern) {
    const heading = [
      ...document.querySelectorAll('h2, h3, h4, [role="heading"]'),
    ].find((element) => pattern.test(element.textContent || ""));
    if (!heading) return "";
    const headingText = (heading.textContent || "").trim();
    const directSibling = heading.nextElementSibling;
    const siblingText = (directSibling?.innerText || "").trim();
    if (siblingText && siblingText.length > headingText.length) {
      return siblingText.replace(/\s+/g, " ").trim();
    }
    let ancestor = heading.parentElement;
    for (let level = 0; ancestor && level < 4; level += 1) {
      const content = [...ancestor.children]
        .filter((child) => child !== heading && !child.contains(heading))
        .map((child) => child.innerText || child.textContent || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (content.length > 40) return content;
      ancestor = ancestor.parentElement;
    }
    return "";
  }

  function locationCandidate() {
    const candidates = [
      ...document.querySelectorAll(
        '[aria-label*="location" i], [data-test*="location" i], [class*="location" i]',
      ),
      ...document.querySelectorAll(
        ".job-details-jobs-unified-top-card__primary-description-container span, .jobs-unified-top-card__primary-description-container span",
      ),
    ];
    const candidateFromElements = candidates
        .map((element) =>
          (element.innerText || element.textContent || "").trim(),
        )
        .find(
          (value) =>
            value &&
            value.length < 120 &&
            !/remote|hybrid|on-site|onsite|full-time|part-time/i.test(value) &&
            !/^mbi gmbh$/i.test(value),
        ) || "";
    if (candidateFromElements) return candidateFromElements;
    return (
      pageText()
        .split(/[\n·•|]/)
        .map((value) => value.trim())
        .find(
          (value) =>
            value &&
            value.length < 100 &&
            /,|\b[A-Z][a-z]+\b/.test(value) &&
            !/remote|hybrid|on-site|onsite|full-time|part-time|mbi gmbh/i.test(
              value,
            ),
        ) || ""
    );
  }

  function pageText() {
    return document.body?.innerText?.trim() || "";
  }

  function cleanText(value) {
    if (!value) return "";
    const container = document.createElement("div");
    container.innerHTML = value;
    return (container.innerText || container.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function structuredJob() {
    for (const script of document.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        const postings = Array.isArray(data) ? data : [data];
        const posting = postings.find((item) => {
          const type = item?.["@type"];
          return type === "JobPosting" || type?.includes?.("JobPosting");
        });
        if (posting) return posting;
      } catch {}
    }
    return {};
  }

  function metaContent(property) {
    return (
      document.querySelector(`meta[property="${property}"]`)?.content ||
      document.querySelector(`meta[name="${property}"]`)?.content ||
      ""
    ).trim();
  }

  function collectJob() {
    const structured = structuredJob();
    const title =
      text("h1") ||
      structured.title ||
      metaContent("og:title") ||
      document.title.replace(/\s*\|.*$/, "").trim();
    const topCardText = firstText([
      ".job-details-jobs-unified-top-card__primary-description-container",
      ".jobs-unified-top-card__primary-description-container",
      ".job-details-jobs-unified-top-card__primary-description",
      ".jobs-unified-top-card__primary-description",
    ]);
    const company =
      firstText([
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name",
        ".job-details-jobs-unified-top-card__primary-description a",
        ".topcard__org-name-link",
        'a[href*="/company/"]',
      ]) ||
      (Array.isArray(structured.hiringOrganization)
        ? structured.hiringOrganization[0]?.name
        : structured.hiringOrganization?.name) ||
      topCardText.split(/\s*[·•]\s*/)[0] ||
      "";
    const structuredLocation = structured.jobLocation;
    const locationFromSchema = Array.isArray(structuredLocation)
      ? structuredLocation[0]
      : structuredLocation;
    const jobLocation =
      firstText([
        ".job-details-jobs-unified-top-card__bullet",
        ".jobs-unified-top-card__bullet",
        ".topcard__flavor--bullet",
        '[class*="top-card"][class*="bullet"]',
      ]) ||
      locationFromSchema?.address?.addressLocality ||
      locationFromSchema?.address?.addressRegion ||
      locationFromSchema?.address?.name ||
      topCardText
        .split(/\s*[·•]\s*/)
        .find((part) => /,|remote|hybrid|on-site|onsite/i.test(part)) ||
      "" ||
      locationCandidate() ||
      firstText([
        '[class*="top-card"] [class*="bullet"]',
      ]) ||
      "";
    const description =
      textNearHeading(
        /about (the )?job|job description|description|details zum jobangebot|stellenbeschreibung/i,
      ) ||
      firstText([
        ".jobs-description__content .jobs-box__html-content",
        ".jobs-description-content__text",
        ".jobs-description-content__text--stretch",
      ]) ||
      longestText(
        [
          '[class*="jobs-description"]',
          '[id*="job-details"] [class*="description"]',
          '[class*="job-details"] [class*="description"]',
          '[class*="description-content"]',
        ],
        80,
      ) ||
      cleanText(structured.description) ||
      cleanText(metaContent("description"));
    const metadata = firstText([
      ".job-details-jobs-unified-top-card__primary-description",
      ".jobs-unified-top-card__primary-description",
    ]);
    const body =
      `${title} ${metadata} ${description} ${pageText()}`.toLowerCase();
    const workType =
      body.includes("remote") || body.includes("uzaktan")
        ? "Remote"
        : body.includes("hybrid") || body.includes("hibrit")
          ? "Hybrid"
          : body.includes("on-site") ||
              body.includes("onsite") ||
              body.includes("ofiste")
            ? "On-site"
            : "";
    const salary = (description.match(
      /(?:[$€£₺]\s?[\d.,]+(?:\s?-\s?[$€£₺]?\s?[\d.,]+)?|[\d.,]+\s?(?:USD|EUR|TRY|TL)\s?-?\s?[\d.,]*)/i,
    ) || [""])[0];
    return {
      title,
      company,
      location: jobLocation,
      workType,
      salary,
      description,
      notes: "",
      url: window.location.href,
      source: "LinkedIn",
    };
  }

  async function collectAfterExpanding() {
    const expandButton = [...document.querySelectorAll("button")].find(
      (element) => /show more|see more/i.test(element.textContent || ""),
    );
    if (expandButton) {
      expandButton.click();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return collectJob();
  }

  function addFloatingButton() {
    if (
      document.getElementById(buttonId) ||
      !location.pathname.startsWith("/jobs/")
    )
      return;
    const button = document.createElement("button");
    button.id = buttonId;
    button.textContent = "Save job";
    Object.assign(button.style, {
      position: "fixed",
      right: "22px",
      bottom: "24px",
      zIndex: "2147483647",
      border: "0",
      borderRadius: "6px",
      padding: "12px 16px",
      color: "#18301c",
      background: "#b7f397",
      boxShadow: "0 8px 24px rgba(23,33,27,.18)",
      font: "700 13px Arial, sans-serif",
      cursor: "pointer",
    });
    button.addEventListener("click", async () => {
      const job = {
        ...(await collectAfterExpanding()),
        id: crypto.randomUUID(),
        status: "saved",
        createdAt: new Date().toISOString(),
      };
      const data = await chrome.storage.local.get({ jobs: [] });
      await chrome.storage.local.set({ jobs: [job, ...data.jobs] });
      button.textContent = "Saved";
      button.style.background = "#dce4de";
    });
    document.body.appendChild(button);
  }

  addFloatingButton();
  new MutationObserver(addFloatingButton).observe(document.body, {
    childList: true,
    subtree: true,
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_JOB_DATA") {
      collectAfterExpanding().then(sendResponse);
    }
    return true;
  });
})();
