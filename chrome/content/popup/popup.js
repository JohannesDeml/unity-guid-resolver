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
  const uploadArea = document.getElementById('uploadArea');
  const statusText = uploadArea.querySelector('.status-text');

  // Add loading class to the upload area to show the status text & loading spinner

  if (!file.name.toLowerCase().endsWith('.json')) {
    uploadArea.classList.add('error');
    statusText.innerText = 'Please select a JSON file.';
    setTimeout(() => {
      statusText.innerText = '';
      uploadArea.classList.remove('error');
    }, 2000);
    return;
  }

  uploadArea.classList.add('loading');
  statusText.innerText = 'Loading JSON file...';

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      statusText.innerText = 'Parsing JSON file ' + file.name + '...';
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
            uploadDate: new Date().toISOString(),
            projectName: parsedData.projectName,
            projectVersion: parsedData.projectVersion,
            mapping: parsedData.mapping
          };

          chrome.storage.local.set({ 'guidFiles': guidFiles }, function() {
            var error = chrome.runtime.lastError;
            if (error) {
               alert('JSON file upload error: ' + (error.message || JSON.stringify(error)));
            }
            generateMergedMapping(function() {
              var error = chrome.runtime.lastError;
              if (error) {
                statusText.innerText = 'JSON file upload error: ' + (error.message || JSON.stringify(error));
              } else {
                statusText.innerText = 'JSON file uploaded successfully';
                setTimeout(() => {
                  uploadArea.classList.remove('loading');
                  statusText.innerText = '';
                }, 1000);
              }
              updateFileList();
            });
          });
        });
      } else {
        statusText.innerText = 'JSON file must contain a "mapping" field in the root.';
        uploadArea.classList.remove('loading');
      }
    } catch (error) {
      statusText.innerText = 'Error parsing JSON file: ' + error.message;
      uploadArea.classList.remove('loading');
    }
  };

  reader.onerror = function() {
    statusText.innerText = 'Error reading file';
    uploadArea.classList.remove('loading');
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
    // Sort files by creation date in descending order (newest first)
    files.sort((a, b) => new Date(b[1].creationDate) - new Date(a[1].creationDate));

    var totalEntries = data.guidMapping && data.guidMapping.mapping ?
      Object.keys(data.guidMapping.mapping).length : 0;

    fileListDiv.innerHTML = files.map(([fileId, fileData]) => {
      return `
        <div class="file-item" data-file-id="${fileId}">
          <div>${fileData.fileName}</div>
          <div style="font-size: 0.8em; color: #666;">${fileData.creationDate}</div>
          ${fileData.projectName ? `<div style="font-size: 0.8em; color: #666;">${fileData.projectName} ${fileData.projectVersion ? `- ${fileData.projectVersion}` : ''}</div>` : ''}
          <div style="font-size: 0.8em;">
            ${Object.keys(fileData.mapping).length} entries
            <a href="#" class="download-link" data-file-id="${fileId}">Download</a>
          </div>
          <button class="delete-btn" data-file-id="${fileId}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      `;
    }).join('');

    totalEntriesDiv.textContent = `Total unique entries: ${totalEntries}`;

    // Add delete button listeners
    fileListDiv.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const button = this;
        button.classList.add('loading');
        deleteFile(this.dataset.fileId);
      });
    });

    // Add download link listeners
    fileListDiv.querySelectorAll('.download-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        downloadFileData(this.dataset.fileId);
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

function downloadFileData(fileId) {
  chrome.storage.local.get('guidFiles', function(data) {
    if (!data.guidFiles || !data.guidFiles[fileId]) return;

    const fileData = data.guidFiles[fileId];
    const jsonContent = JSON.stringify({
      creationDate: fileData.creationDate,
      projectName: fileData.projectName,
      projectVersion: fileData.projectVersion,
      mapping: fileData.mapping
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.fileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  });
}

