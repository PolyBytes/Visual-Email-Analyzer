browser.action.onClicked.addListener((info, tab) => {
	browser.tabs.create({ url: "main/main.html" });
});