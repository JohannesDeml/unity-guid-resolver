chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    var url = changeInfo.url;
    if(url.indexOf("chrome:") != -1) {
      return;
    }
    if(url.indexOf("git") == -1 &&
      url.indexOf("bitbucket") == -1) {
      return;
    }
    console.log("URL changed to " + url + ", changeInfo.status: " + changeInfo.status);
    chrome.tabs.sendMessage(tabId, { message: "addGuidLabels" }, function(response) {});
  }
});