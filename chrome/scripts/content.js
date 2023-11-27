// Define the regex pattern for GUIDs
const guidRegex = /\b([a-fA-F0-9]{32})\b/g;
var guidLoaded = false;

// Will be updated with stored guid mapping, if set in local storage
var guidLookup = {};

function addGuidLabels() {
  if(guidLoaded) {
    runGuidReplacerDelayed();
    return;
  }

  chrome.storage.local.get('guidMapping', function (data) {
    if (data) {
      console.log("Found guid mapping from " + JSON.stringify(data.guidMapping.creationDate));
      guidLookup = data.guidMapping.mapping;
    } else {
      console.log('No guid mapping stored');
    }
    guidLoaded = true;
    runGuidReplacerDelayed();
  });
}

function runGuidReplacerDelayed() {
  // Call adding labels with a small delay to make sure everything is set up
  setTimeout(runGuidReplacer, 500);
}

function runGuidReplacer() {
  console.log("Running unity guid replacer");
  var matchCount = 0;
  var nodeCount = 0;

  // Function to process a text node and add labels to GUIDs
  function processTextNode(node) {
    var originalContent = node.nodeValue;
    var modifiedContent = originalContent.replace(guidRegex, function (match) {
      var replacement = guidLookup[match];
      var tagText = replacement ? replacement.fileName : "No matching GUID found";
      return match + '<span class="guidResolverTag">[' + tagText + ']</span>';
    });
    if (originalContent !== modifiedContent) {
      matchCount++;
      node.nodeValue = '';
      var span = document.createElement('span');
      span.innerHTML = modifiedContent;
      node.parentNode.replaceChild(span, node);
    }
    nodeCount++;
  }

  // Recursive function to traverse all text nodes in an element
  function traverseTextNodes(element) {
    var treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);

    // Cache all nodes to be able to add nodes while traversing
    var textNodes = [];
    while (treeWalker.nextNode()) {
      var node = treeWalker.currentNode;
      // Skip nodes that are too short to contain a GUID
      if (!node.nodeValue || node.nodeValue.length < 32) {
        continue;
      }
      textNodes.push(treeWalker.currentNode);
    }

    textNodes.forEach(function(node) {
      processTextNode(node);
    });
  }

  // measure time
  var startTime = performance.now();

  // Remove all old labels
  var elements = document.querySelectorAll('span.guidResolverTag');
  for(var i = 0; i < elements.length; i++){
    elements[i].parentNode.removeChild(elements[i]);
  }

  // Traverse all text nodes in the document body
  traverseTextNodes(document.body);
  console.log("Found " + matchCount + " matches" + " in " + nodeCount + " nodes (duration: " + (performance.now() - startTime) + " ms)");
}

// Add listener to run the script when the url is updated
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "addGuidLabels") {
    addGuidLabels();
    sendResponse({message: "Labels added"});
  }
});

function initIfMatchingDomain()
{
  var url = window.location.href;
  if(url.indexOf("git") == -1 &&
    url.indexOf("bitbucket") == -1) {
    return;
  }

  // Add listener to run the script when the page is loaded
  addEventListener("load", (event) => {
    addGuidLabels();
  });
}

initIfMatchingDomain();