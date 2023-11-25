updateStoredItem();

document.addEventListener('DOMContentLoaded', function () {
  var uploadButton = document.getElementById('uploadButton');
  uploadButton.addEventListener('click', uploadJSON);
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
        var parsedData = JSON.parse(jsonData);

        // Check if the parsed data contains a "mapping" field in the root
        if (parsedData && parsedData.hasOwnProperty('mapping')) {
          // Store JSON data (you can use chrome.storage.local or another storage method here)
          chrome.storage.local.set({ 'guidMapping': parsedData }, function () {
            statusDiv.innerText = 'JSON file uploaded and stored.';
            console.log(parsedData);
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
    if (data) {
      statusDiv.innerText = JSON.stringify(data.guidMapping);
    } else {
      statusDiv.innerText = 'No data stored.';
    }
  });
}

