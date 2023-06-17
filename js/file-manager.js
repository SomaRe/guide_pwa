let allFolsAndFils = {}; // Global object to store folder names and file names

// Function to change structure of allFolsAndFils, such a way that inside session1, the files gets arranged
// in pairs <filename> and <filename_GUIDE>, if one of them is missing, then its replaced with null
// example:
// {
// 	"session1": {
// 		"hello.pdf": "hello_GUIDE.pdf",
// 		"world.pdf": "world_GUIDE.pdf",
// 	}
// }
function arrangeInPairs(allFolsAndFils) {
  var pairedFiles = {};

  for (var folder in allFolsAndFils) {
    var files = allFolsAndFils[folder];
    var pairs = {};

    files.forEach((file) => {
      var baseName = file.replace("_GUIDE.pdf", ".pdf");

      // If the file is a guide, find its base file. If not, find its guide.
      if (file.endsWith("_GUIDE.pdf")) {
        pairs[baseName] = pairs[baseName] || { baseFile: null, guideFile: null };
        pairs[baseName].guideFile = file;
      } else {
        pairs[baseName] = pairs[baseName] || { baseFile: null, guideFile: null };
        pairs[baseName].baseFile = file;
      }
    });

    // Replace missing pairs with null
    for (var baseName in pairs) {
      pairs[baseName].baseFile = pairs[baseName].baseFile || "[missing]" + baseName;
      pairs[baseName].guideFile = pairs[baseName].guideFile || "[missing]" + baseName + "_GUIDE.pdf";
    }

    pairedFiles[folder] = pairs;
  }

  return pairedFiles;
}

// sort the files in alphabetical order
// function sortPairs(pairedFiles) {
//   var sortedPairs = {};

//   // Get the folders and sort them
//   var folders = Object.keys(pairedFiles).sort();
  
//   folders.forEach((folder) => {
//     var files = pairedFiles[folder];
    
//     // Get the files and sort them
//     var sortedFiles = Object.keys(files).sort().reduce((acc, file) => {
//       acc[file] = files[file];
//       return acc;
//     }, {});
    
//     sortedPairs[folder] = sortedFiles;
//   });

//   return sortedPairs;
// }

// Add File to Div
// function addFileToDiv(folderName, fileName, filesDiv) {
//   var fileP = document.createElement("p");
//   fileP.className = "file";
//   fileP.dataset.folder = folderName;
//   fileP.textContent = fileName;
//   filesDiv.appendChild(fileP);
// }

// Add File to Table
function addFileToTable(folderName, fileName, filePair, filesDiv) {
  var table = filesDiv.querySelector("table");

  if (!table) {
    table = document.createElement("table");
    table.className = "file";
    table.dataset.folder = folderName;
    filesDiv.appendChild(table);
  }

  var row = document.createElement("tr");

  var fileCell = document.createElement("td");
  fileCell.textContent = filePair.baseFile;
  fileCell.className = "file";
  if(fileCell.textContent.startsWith("[missing]")){
    fileCell.classList.add("missing");
  }
  fileCell.dataset.folder = folderName;

  var guideCell = document.createElement("td");
  guideCell.textContent = filePair.guideFile;
  guideCell.className = "file_guide";
  if (guideCell.textContent.startsWith("[missing]")) {
    guideCell.classList.add("missing");
  }

  row.appendChild(fileCell);
  row.appendChild(guideCell);
  table.appendChild(row);
}


// Open (or create) the IndexedDB database
var openRequest = indexedDB.open("PWA_DB", 1);
var db;

// auto incrementing keyPath
openRequest.onupgradeneeded = function (e) {
  var db = e.target.result;
  if (!db.objectStoreNames.contains("files")) {
    db.createObjectStore("files", { autoIncrement: true });
  }
};

// when we have the db, display the existing folders
openRequest.onsuccess = function (e) {
  db = e.target.result;
  // display the existing folders
  var transaction = db.transaction(["files"], "readonly");
  var store = transaction.objectStore("files");
  var request = store.openCursor();
  request.onsuccess = function (e) {
    var cursor = e.target.result;
    if (cursor) {
      var folderName = cursor.key[0];
      var fileName = cursor.key[1];
      allFolsAndFils[folderName] = allFolsAndFils[folderName] || [];
      allFolsAndFils[folderName].push(fileName);
      // var folderDivs = document.getElementsByClassName("folder");
      // var folderExists = false;
      // for (var i = 0; i < folderDivs.length; i++) {
      //   var nameP = folderDivs[i].querySelector(".folder-name");
      //   if (nameP.textContent === folderName) {
      //     folderExists = true;
      //     var filesDiv = folderDivs[i].querySelector(".folder-files");

      //     addFileToDiv(folderName, fileName, filesDiv);
      //   }
      // }
      // if (!folderExists) {
      //   createFolderSection(folderName);
      //   var filesDiv =
      //     folderDivs[folderDivs.length - 1].querySelector(".folder-files");
      //   addFileToDiv(folderName, fileName, filesDiv);
      // }
      cursor.continue();
    }
    else{
      pairedFiles = arrangeInPairs(allFolsAndFils);
      for(var folderName in pairedFiles){
        createFolderSection(folderName);
        folderLength = document.querySelectorAll(".folder-files").length;
        var filesDiv = document.querySelectorAll(".folder-files")[folderLength-1];
        for(var fileName in pairedFiles[folderName]){
          addFileToTable(folderName, fileName, pairedFiles[folderName][fileName], filesDiv);
        }
      }
    }
  };
};



// Submit 
document
  .getElementById("new-folder-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    var folderName = document.getElementById("folder-name").value;

    // Check if folder name already exists
    var existingFolders = document.querySelectorAll(".folder-name");
    for (var isFolder of existingFolders) {
      if (isFolder.textContent === folderName) {
        alert("Folder name already exists!");
        folderNameInput.value = ""; // Clear the input field
        return; // Exit the function to prevent further execution
      }
    }

    if (folderName) {
      // empty object to store file names
      allFolsAndFils[folderName] = [];
      createFolderSection(folderName);
      document.getElementById("folder-name").value = "";
    }
  });

function createFolderSection(name) {
  var folderDiv = document.createElement("div");
  folderDiv.className = "folder";
  
  var filesArray = [];
  folderDiv.dataset.files = JSON.stringify(filesArray);

  var headerDiv = document.createElement("div");
  headerDiv.className = "folder-header";
  folderDiv.appendChild(headerDiv);

  var nameP = document.createElement("p");
  nameP.className = "folder-name";
  nameP.textContent = name;
  headerDiv.appendChild(nameP);

  var selectButton = document.createElement("button");
  selectButton.textContent = "Select Files";
  headerDiv.appendChild(selectButton);

  var uploadButton = document.createElement("button");
  uploadButton.textContent = "Upload Files";
  uploadButton.disabled = true;
  headerDiv.appendChild(uploadButton);

  var deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete Section";
  headerDiv.appendChild(deleteButton);

  var filesDiv = document.createElement("div");
  filesDiv.className = "folder-files";
  folderDiv.appendChild(filesDiv);

  // add a paragraph to show the number of files selected at the top
  var filesPTemp = document.createElement("p");
  filesPTemp.textContent = "";
  filesPTemp.style = "font-weight: bold; color: red;";
  filesPTemp.className = "files-selected";
  filesDiv.appendChild(filesPTemp);

  document.getElementById("folder-container").appendChild(folderDiv);

  var selectedFiles;
  selectButton.addEventListener("click", function () {
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf";
    input.addEventListener("change", function () {
      selectedFiles = input.files;
      uploadButton.disabled = false;
    });
    input.click();
    // once files are selected, show the names of the selected files
    input.addEventListener("change", function () {
      filesPTemp.textContent = input.files.length + " files selected";
    });
  });

  uploadButton.addEventListener("click", function () {
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFilesToFolderSection(name, selectedFiles);
      selectedFiles = null;
      uploadButton.disabled = true;
      filesPTemp.textContent = "";
    }
  });

  deleteButton.addEventListener("click", function () {
    deleteFolderSection(folderDiv);
  });
}

// Upload the files to IndexedDB
function uploadFilesToFolderSection(folderName, files) {
  var folderDivs = document.getElementsByClassName('folder');
  for (var i = 0; i < folderDivs.length; i++) {
    var nameP = folderDivs[i].querySelector('.folder-name');
    if (nameP.textContent === folderName) {
      var filesDiv = folderDivs[i].querySelector('.folder-files');
      for (var j = 0; j < files.length; j++) {
        allFolsAndFils[folderName].push(files[j].name);
        uploadFile(files[j], folderName, filesDiv);
      }
    }
  }
}

function uploadFile(file, folderName, filesDiv) {
  // clear the folder-container
  document.getElementById("folder-container").innerHTML = "";
  pairedFiles = arrangeInPairs(allFolsAndFils);
  for(var folderName in pairedFiles){
    createFolderSection(folderName);
    folderLength = document.querySelectorAll(".folder-files").length;
    var filesDiv = document.querySelectorAll(".folder-files")[folderLength-1];
    for(var fileName in pairedFiles[folderName]){
      addFileToTable(folderName, fileName, pairedFiles[folderName][fileName], filesDiv);
    }
  }

  // Read the file as a Blob
  var fileReader = new FileReader();
  fileReader.onload = function(event) {
    var blob = new Blob([event.target.result]);

    // Store the Blob in IndexedDB
    var transaction = db.transaction(['files'], 'readwrite');
    var store = transaction.objectStore('files');
    store.put(blob, [folderName, file.name]);
  };
  fileReader.readAsArrayBuffer(file);
}


// Delete the files from IndexedDB
function deleteFolderSection(folderDiv) {
  var nameP = folderDiv.querySelector(".folder-name");
  var transaction = db.transaction(["files"], "readwrite");
  var store = transaction.objectStore("files");
  // delete all files with the same folder name, keys are composite
  var keyRange = IDBKeyRange.bound(
    [nameP.textContent, ""],
    [nameP.textContent, "\uffff"],
    false,
    false
  );
  var request = store.delete(keyRange);
  request.onsuccess = function () {
    folderDiv.parentNode.removeChild(folderDiv);
  };
}

// event delegation to handle clicks on file names
document.addEventListener("click", function (e) {
  if (e.target.className == "file") {
    openFile(e.target.dataset.folder, e.target.textContent);
  }
});
