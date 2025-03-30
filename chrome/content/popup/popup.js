// Initialize the UI
updateFileList();

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

  setupFileUpload();

  var updatePageButton = document.getElementById('updatePageButton');
  updatePageButton.addEventListener('click', updateLabelsOnPage);
});

function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('jsonFile');

  // Handle drag and drop events
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
      fileInput.value = ''; // Reset file input after drop
    }
  });

  // Handle click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
      fileInput.value = ''; // Reset file input after selection
    }
  });
}

function handleFileUpload(file) {
  const statusDiv = document.getElementById('status');
  const uploadArea = document.getElementById('uploadArea');

  if (!file.name.toLowerCase().endsWith('.json')) {
    statusDiv.innerText = 'Please select a JSON file.';
    return;
  }

  statusDiv.innerText = 'Loading JSON file...';
  uploadArea.classList.add('disabled');

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      statusDiv.innerText = 'Parsing JSON file...';
      const parsedData = JSON.parse(e.target.result);

      if (parsedData && parsedData.hasOwnProperty('mapping')) {
        // Generate a unique ID for this file
        const fileId = file.name + " - " + parsedData.creationDate;

        // Store the individual file data
        chrome.storage.local.get('guidFiles', function(data) {
          const guidFiles = data.guidFiles || {};
          guidFiles[fileId] = {
            fileName: file.name,
            creationDate: parsedData.creationDate,
            mapping: parsedData.mapping
          };

          chrome.storage.local.set({ 'guidFiles': guidFiles }, function() {
            generateMergedMapping(function() {
              statusDiv.innerText = 'JSON file uploaded successfully';
              updateFileList();
            });
          });
        });
      } else {
        statusDiv.innerText = 'JSON file must contain a "mapping" field in the root.';
      }
    } catch (error) {
      statusDiv.innerText = 'Error parsing JSON file: ' + error.message;
    }
    uploadArea.classList.remove('disabled');
  };

  reader.onerror = function() {
    statusDiv.innerText = 'Error reading file';
    uploadArea.classList.remove('disabled');
  };

  reader.readAsText(file);
}

function generateMergedMapping(callback) {
  chrome.storage.local.get('guidFiles', function(data) {
    if (!data.guidFiles) {
      if (callback) callback();
      return;
    }

    var mergedMapping = {};
    var files = Object.entries(data.guidFiles);

    // Sort files by creation date (newest first)
    files.sort((a, b) => new Date(b[1].creationDate) - new Date(a[1].creationDate));

    // Merge mappings, newer files overwrite older ones
    files.forEach(([fileId, fileData]) => {
      Object.assign(mergedMapping, fileData.mapping);
    });

    // Store the merged mapping
    chrome.storage.local.set({ 'guidMapping': { mapping: mergedMapping } }, function() {
      if (callback) callback();
    });
  });
}

function updateFileList() {
  var fileListDiv = document.getElementById('fileList');
  var totalEntriesDiv = document.getElementById('totalEntries');

  chrome.storage.local.get(['guidFiles', 'guidMapping'], function(data) {
    if (!data.guidFiles) {
      fileListDiv.innerHTML = '<div class="file-item">No files uploaded</div>';
      totalEntriesDiv.textContent = 'Total entries: 0';
      return;
    }

    var files = Object.entries(data.guidFiles);
    var totalEntries = data.guidMapping && data.guidMapping.mapping ?
      Object.keys(data.guidMapping.mapping).length : 0;

    fileListDiv.innerHTML = files.map(([fileId, fileData]) => {
      return `
        <div class="file-item">
          <div>${fileData.fileName}</div>
          <div style="font-size: 0.8em; color: #666;">${fileData.creationDate}</div>
          <div style="font-size: 0.8em;">${Object.keys(fileData.mapping).length} entries</div>
          <button class="delete-btn" data-file-id="${fileId}">x</button>
        </div>
      `;
    }).join('');

    totalEntriesDiv.textContent = `Total unique entries: ${totalEntries}`;

    // Add delete button listeners
    fileListDiv.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteFile(this.dataset.fileId);
      });
    });
  });
}

function deleteFile(fileId) {
  chrome.storage.local.get('guidFiles', function(data) {
    if (!data.guidFiles) return;

    delete data.guidFiles[fileId];
    chrome.storage.local.set({ 'guidFiles': data.guidFiles }, function() {
      generateMergedMapping(function() {
        updateFileList();
      });
    });
  });
}

function updateLabelsOnPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { message: "addGuidLabels" }, function (response) { });
  });
}

