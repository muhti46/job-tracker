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

  function normalizeMultiline(value) {
    return (value || "")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function firstTextMultiline(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const value = normalizeMultiline(
        element?.innerText || element?.textContent || "",
      );
      if (value) return value;
    }
    return "";
  }

  function longestTextMultiline(selectors, minimumLength = 1) {
    let longest = "";
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const value = normalizeMultiline(
          element.innerText || element.textContent || "",
        );
        if (value.length >= minimumLength && value.length > longest.length) {
          longest = value;
        }
      }
    }
    return longest;
  }

  function firstMatchingText(selectors, predicate) {
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const value = (element.innerText || element.textContent || "")
          .replace(/\s+/g, " ")
          .trim();
        if (value && predicate(value)) return value;
      }
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
    const siblingText = normalizeMultiline(directSibling?.innerText || "");
    if (siblingText && siblingText.length > headingText.length) {
      return siblingText;
    }
    let ancestor = heading.parentElement;
    for (let level = 0; ancestor && level < 4; level += 1) {
      const content = normalizeMultiline(
        [...ancestor.children]
          .filter((child) => child !== heading && !child.contains(heading))
          .map((child) => child.innerText || child.textContent || "")
          .join("\n"),
      );
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
    const isLocation = (value) =>
      value.length < 120 &&
      /,/.test(value) &&
      !/remote|hybrid|on-site|onsite|full-time|part-time|notification|benachrichtig|bewerben|kandidat|candidate|mbi gmbh/i.test(
        value,
      );
    const candidateFromElements =
      candidates
        .map((element) =>
          (element.innerText || element.textContent || "").trim(),
        )
        .find((value) => value && isLocation(value)) || "";
    if (candidateFromElements) return candidateFromElements;
    return "";
  }

  function topCardLocation(value) {
    const parts = value
      .split(/[\n·•|]/)
      .map((part) => part.trim())
      .filter(Boolean);
    return (
      parts.find(
        (part) =>
          part.length < 80 &&
          (/,/.test(part) ||
            /^(deutschland|germany|österreich|austria|schweiz|switzerland)$/i.test(
              part,
            )) &&
          !/remote|hybrid|on-site|onsite|full-time|part-time|notification|benachrichtig|bewerben|kandidat|candidate|vor \d|bewerber/i.test(
            part,
          ),
      ) || ""
    );
  }

  function locationNearTitle() {
    const titleElement = document.querySelector("h1");
    if (!titleElement) return "";
    let ancestor = titleElement.parentElement;
    for (let level = 0; ancestor && level < 5; level += 1) {
      const parts = (ancestor.innerText || "")
        .split(/[\n·•|]/)
        .map((part) => part.trim())
        .filter(Boolean);
      const location = topCardLocation(parts.join("\n"));
      if (location) return location;
      ancestor = ancestor.parentElement;
    }
    return "";
  }

  function countryLocation() {
    const countries =
      /^(deutschland|germany|österreich|austria|schweiz|switzerland|france|frankreich|netherlands|niederlande)$/i;
    for (const element of document.querySelectorAll("body *")) {
      const value = (element.innerText || element.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (countries.test(value) && element.children.length === 0) return value;
    }
    return "";
  }

  function pageText() {
    return document.body?.innerText?.trim() || "";
  }

  function cleanText(value) {
    if (!value) return "";
    const withBreaks = value
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\u2022 ");
    const container = document.createElement("div");
    container.innerHTML = withBreaks;
    return normalizeMultiline(container.textContent || "");
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
      ".job-details-jobs-unified-top-card",
      ".jobs-unified-top-card",
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
    const schemaAddress = locationFromSchema?.address;
    const jobLocation =
      schemaAddress?.addressLocality ||
      schemaAddress?.addressRegion ||
      schemaAddress?.addressCountry?.name ||
      firstMatchingText(
        [
          ".job-details-jobs-unified-top-card__bullet",
          ".jobs-unified-top-card__bullet",
          ".topcard__flavor--bullet",
          '[class*="top-card"][class*="bullet"]',
        ],
        (value) =>
          /,/.test(value) &&
          !/remote|hybrid|on-site|onsite|full-time|part-time|notification|benachrichtig|bewerben|kandidat|candidate|mbi gmbh/i.test(
            value,
          ),
      ) ||
      locationFromSchema?.address?.addressLocality ||
      locationFromSchema?.address?.addressRegion ||
      locationFromSchema?.address?.name ||
      topCardLocation(topCardText) ||
      locationNearTitle() ||
      countryLocation() ||
      "";
    const description =
      textNearHeading(
        /about (the )?job|job description|description|details zum jobangebot|stellenbeschreibung/i,
      ) ||
      firstTextMultiline([
        ".jobs-description__content .jobs-box__html-content",
        ".jobs-description-content__text",
        ".jobs-description-content__text--stretch",
      ]) ||
      longestTextMultiline(
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
    if (!location.pathname.startsWith("/jobs/")) return;
    const existingButton = document.getElementById(buttonId);
    if (existingButton) {
      return;
    }
    const launcher = document.createElement("button");
    launcher.id = buttonId;
    launcher.type = "button";
    launcher.title = "Job Tracker";
    launcher.setAttribute("aria-label", "Open Job Tracker");
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2.5"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="2" y1="12.5" x2="22" y2="12.5"/></svg>';
    const panel = document.createElement("div");
    panel.id = "job-tracker-menu";
    panel.innerHTML =
      '<button type="button" data-action="applications"><span class="menu-icon">▦</span>Applications</button><button type="button" class="apply-job-button" data-action="save"><span class="menu-icon apply-icon"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.6 21 12 3.4 3.4l.1 6.6L15 12 3.5 14z"/></svg></span><span class="apply-label">Apply Job</span></button>';
    const shell = document.createElement("div");
    shell.id = "job-tracker-floating-shell";
    shell.append(launcher, panel);
    Object.assign(shell.style, {
      position: "fixed",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: "2147483647",
      display: "grid",
      gap: "10px",
      justifyItems: "end",
      fontFamily: "Arial, sans-serif",
    });
    Object.assign(launcher.style, {
      display: "grid",
      placeItems: "center",
      width: "46px",
      height: "46px",
      padding: "0",
      border: "1px solid #8acb6e",
      borderRadius: "12px",
      color: "#18301c",
      background: "#b7f397",
      boxShadow: "0 8px 24px rgba(23,33,27,.18)",
      cursor: "pointer",
    });
    Object.assign(panel.style, {
      display: "grid",
      gap: "8px",
      padding: "10px",
      border: "1px solid #dce4de",
      borderRadius: "14px",
      background: "#ffffff",
      boxShadow: "0 12px 30px rgba(23,33,27,.18)",
      opacity: "0",
      visibility: "hidden",
      transform: "translateX(10px)",
      transition:
        "opacity .18s ease, transform .18s ease, visibility .18s ease",
      pointerEvents: "none",
    });
    const menuButtons = panel.querySelectorAll("button");
    menuButtons.forEach((menuButton) =>
      Object.assign(menuButton.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",
        minWidth: "166px",
        padding: "11px 20px",
        border: "0",
        borderRadius: "999px",
        color: "#4c1d95",
        background: "#ede4fb",
        font: "700 13px Arial, sans-serif",
        textAlign: "center",
        cursor: "pointer",
      }),
    );
    const icon = launcher.querySelector("svg");
    Object.assign(icon.style, {
      width: "21px",
      height: "21px",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    });
    const applyButton = panel.querySelector(".apply-job-button");
    Object.assign(applyButton.style, {
      justifyContent: "center",
      minWidth: "166px",
      padding: "11px 20px",
      borderRadius: "999px",
      color: "#ffffff",
      background: "#6d28d9",
      boxShadow: "0 10px 22px rgba(109,40,217,.38)",
      fontWeight: "700",
    });
    const applyIcon = applyButton.querySelector(".apply-icon svg");
    Object.assign(applyIcon.style, { width: "16px", height: "16px" });
    const showMenu = () => {
      panel.style.opacity = "1";
      panel.style.visibility = "visible";
      panel.style.transform = "translateX(0)";
      panel.style.pointerEvents = "auto";
    };
    const hideMenu = () => {
      panel.style.opacity = "0";
      panel.style.visibility = "hidden";
      panel.style.transform = "translateX(10px)";
      panel.style.pointerEvents = "none";
    };
    shell.addEventListener("mouseenter", showMenu);
    shell.addEventListener("mouseleave", hideMenu);
    let dragging = false;
    let moved = false;
    let offsetX = 0;
    let offsetY = 0;
    launcher.style.touchAction = "none";
    launcher.style.cursor = "grab";
    launcher.addEventListener("pointerdown", (event) => {
      dragging = true;
      moved = false;
      const bounds = shell.getBoundingClientRect();
      offsetX = event.clientX - bounds.left;
      offsetY = event.clientY - bounds.top;
      launcher.setPointerCapture(event.pointerId);
      launcher.style.cursor = "grabbing";
      event.preventDefault();
    });
    launcher.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      moved = true;
      const maxX = window.innerWidth - shell.offsetWidth - 8;
      const maxY = window.innerHeight - shell.offsetHeight - 8;
      const left = Math.min(Math.max(8, event.clientX - offsetX), maxX);
      const top = Math.min(Math.max(8, event.clientY - offsetY), maxY);
      shell.style.left = `${left}px`;
      shell.style.top = `${top}px`;
      shell.style.right = "auto";
      shell.style.transform = "none";
    });
    launcher.addEventListener("pointerup", async (event) => {
      if (!dragging) return;
      dragging = false;
      launcher.releasePointerCapture(event.pointerId);
      launcher.style.cursor = "grab";
      if (moved) {
        const bounds = shell.getBoundingClientRect();
        await chrome.storage.local.set({
          floatingPosition: { left: bounds.left, top: bounds.top },
        });
      }
    });
    chrome.storage.local
      .get({ floatingPosition: null })
      .then(({ floatingPosition }) => {
        if (!floatingPosition) return;
        const left = Math.min(
          Math.max(8, floatingPosition.left),
          window.innerWidth - shell.offsetWidth - 8,
        );
        const top = Math.min(
          Math.max(8, floatingPosition.top),
          window.innerHeight - shell.offsetHeight - 8,
        );
        shell.style.left = `${left}px`;
        shell.style.top = `${top}px`;
        shell.style.right = "auto";
        shell.style.transform = "none";
      });
    panel
      .querySelector('[data-action="applications"]')
      .addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "OPEN_APPLICATIONS" });
      });
    let jobSaved = false;
    const savedIconSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
    applyButton.addEventListener("click", async () => {
      if (jobSaved) {
        chrome.runtime.sendMessage({ type: "OPEN_APPLICATIONS" });
        return;
      }
      const job = {
        ...(await collectAfterExpanding()),
        id: crypto.randomUUID(),
        status: "applied",
        createdAt: new Date().toISOString(),
      };
      const data = await chrome.storage.local.get({ jobs: [] });
      await chrome.storage.local.set({ jobs: [job, ...data.jobs] });
      jobSaved = true;
      launcher.title = "Saved";
      launcher.setAttribute("aria-label", "Saved");
      launcher.style.background = "#dce4de";
      applyButton.querySelector(".apply-label").textContent = "Saved";
      applyButton.querySelector(".apply-icon").innerHTML = savedIconSvg;
    });
    document.body.appendChild(shell);
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
