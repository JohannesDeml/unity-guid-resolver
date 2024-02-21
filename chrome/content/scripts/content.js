// If the domain contains any of these strings, the script will be run
const gitUrls = [
  "git",
  "bitbucket",
  "codeberg",
  "sourceforge",
  "gogs",
];

// Define the regex pattern for GUIDs
const guidRegex = /\b([a-f0-9]{32})\b/g;
const invalidGuid = "00000000000000000000000000000000";

// Will be set to true when the guid mapping is loaded
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

  // Collect all text nodes with possible GUID values (default)
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

      // skip script nodes
      if (node.parentNode.nodeName === "SCRIPT") {
        continue;
      }

      textNodes.push(treeWalker.currentNode);
    }

    textNodes.forEach(function(node) {
      processTextNode(node);
    });
  }

  // Function to process a text node and add labels to GUIDs
  function processTextNode(node) {
    var originalContent = node.nodeValue;
    var modifiedContent = originalContent.replace(guidRegex, function (match) {
      if (match === invalidGuid) {
        return match;
      }

      var replacement = guidLookup[match];
      var tagText = replacement ? replacement.fileName : "No matching GUID found";
      matchCount++;
      return match + '<span class="guidResolverTag">[' + tagText + ']</span>';
    });
    if (originalContent !== modifiedContent) {
      node.nodeValue = '';
      var span = document.createElement('span');
      span.innerHTML = modifiedContent;
      node.parentNode.replaceChild(span, node);
    }
    nodeCount++;
  }


  // collect all special github elements with data-code-text attribute
  function traverseDataCodeTextElements(element) {
    var treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node) {
        if (node.hasAttribute('data-code-text') && node.getAttribute('data-code-text').length >= 32) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }, false);

    // Cache all elements to be able to add elements while traversing
    var dataCodeTextElements = [];
    while (treeWalker.nextNode()) {
      var element = treeWalker.currentNode;
      dataCodeTextElements.push(element);
    }

    dataCodeTextElements.forEach(function(element) {
      processElementWithCodeTextAttribute(element);
    });
  }

  // Function to process an element with data-code-text attribute
  // Tag elements need to be added in between the attributes to give them a special style
  function processElementWithCodeTextAttribute(element) {
    var originalContent = element.getAttribute('data-code-text');
    var matches = originalContent.match(guidRegex);
    var currentIndex = 0;
    if (matches) {
      for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        if (match === invalidGuid) {
          continue;
        }

        var replacement = guidLookup[match];
        var tagText = replacement ? replacement.fileName : "No matching GUID found";

        matchCount++;
        var index = originalContent.indexOf(match, currentIndex);
        var upToMatch = originalContent.substring(currentIndex, index + match.length);
        var afterMatch = originalContent.substring(index + match.length);
        currentIndex = index + match.length;

        var upToMatchElement = element.cloneNode(true);
        upToMatchElement.setAttribute('data-code-text', upToMatch);
        element.parentNode.insertBefore(upToMatchElement, element);
        var tagElement = document.createElement('span');
        tagElement.innerHTML = '[' + tagText + ']';
        tagElement.classList.add('guidResolverTag');
        upToMatchElement.parentNode.insertBefore(tagElement, upToMatchElement.nextSibling);
        element.setAttribute('data-code-text', afterMatch);
      }
    }
  }


  // measure time
  var startTime = performance.now();

  // Remove all old labels
  var elements = document.querySelectorAll('span.guidResolverTag');
  for(var i = 0; i < elements.length; i++){
    elements[i].parentNode.removeChild(elements[i]);
  }

  // Traverse all potential nodes in the document body
  traverseTextNodes(document.body);
  if (window.location.hostname === "github.com") {
    // Additionally traverse all special github elements with data-code-text attribute
    traverseDataCodeTextElements(document.body);
  }

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
  if (!gitUrls.some(urlPart => url.includes(urlPart))) {
    // No git indicator in the url, don't run the script automatically
    return;
  }

  // Add listener to run the script when the page is loaded
  addEventListener("load", (event) => {
    addGuidLabels();
  });
}

initIfMatchingDomain();