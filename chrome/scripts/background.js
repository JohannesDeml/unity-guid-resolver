chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
	if(changeInfo.url.indexOf("chrome:") != -1) {
		return;
	}
    console.log("URL changed to " + changeInfo.url + ", changeInfo.status: " + changeInfo.status);
    chrome.tabs.sendMessage(tabId, { message: "addGuidLabels" }, function(response) {});
  }
});