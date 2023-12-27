window.onload = () => {
	chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
};

