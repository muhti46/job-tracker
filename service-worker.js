chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "OPEN_APPLICATIONS") {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});
