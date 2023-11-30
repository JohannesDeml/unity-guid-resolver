updateStoredItem();

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('optionsButton').addEventListener('click', function () {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, introduced in Chrome 42.
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
  var uploadButton = document.getElementById('uploadButton');
  uploadButton.addEventListener('click', uploadJSON);

  var updatePageButton = document.getElementById('updatePageButton');
  updatePageButton.addEventListener('click', updateLabelsOnPage);
});

function uploadJSON() {
  var fileInput = document.getElementById('jsonFile');
  var statusDiv = document.getElementById('status');

  if (fileInput.files.length > 0) {
    var file = fileInput.files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
      var jsonData = e.target.result;
      try {
        statusDiv.innerText = 'Parsing JSON file...';
        var parsedData = JSON.parse(jsonData);

        // Check if the parsed data contains a "mapping" field in the root
        if (parsedData && parsedData.hasOwnProperty('mapping')) {
          // Store JSON data (you can use chrome.storage.local or another storage method here)
          chrome.storage.local.set({ 'guidMapping': parsedData }, function () {
            statusDiv.innerText = 'JSON file updated';
            updateStoredItem();
          });
        } else {
          statusDiv.innerText = 'JSON file must contain a "mapping" field in the root.';
        }
      } catch (error) {
        statusDiv.innerText = 'Error parsing JSON file: ' + error.message;
      }
    };

    reader.readAsText(file);
  } else {
    statusDiv.innerText = 'Please choose a JSON file.';
  }
}

function updateStoredItem() {
  var statusDiv = document.getElementById('storedItem');

  chrome.storage.local.get('guidMapping', function (data) {
    if (data && data.guidMapping && data.guidMapping.mapping) {
      var mappingLength = Object.keys(data.guidMapping.mapping).length;
      statusDiv.innerHTML = data.guidMapping.identifier + " - " + data.guidMapping.creationDate + "<br>" + mappingLength + " entries";
    } else {
      statusDiv.innerText = 'No data stored.';
    }
  });
}

function updateLabelsOnPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { message: "addGuidLabels" }, function (response) { });
  });
}

