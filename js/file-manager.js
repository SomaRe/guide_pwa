// Open (or create) the IndexedDB database
var openRequest = indexedDB.open("PWA_DB", 1);
var db;

openRequest.onupgradeneeded = function (e) {
  var db = e.target.result;
  if (!db.objectStoreNames.contains("files")) {
    db.createObjectStore("files", { autoIncrement: true });
  }
};

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
      var folderDivs = document.getElementsByClassName("folder");
      var folderExists = false;
      for (var i = 0; i < folderDivs.length; i++) {
        var nameP = folderDivs[i].querySelector(".folder-name");
        if (nameP.textContent === folderName) {
          folderExists = true;
          var filesDiv = folderDivs[i].querySelector(".folder-files");
          var fileP = document.createElement("p");
          fileP.className = "file";
          fileP.textContent = fileName;
          filesDiv.appendChild(fileP);
        }
      }
      if (!folderExists) {
        createFolderSection(folderName);
        var filesDiv =
          folderDivs[folderDivs.length - 1].querySelector(".folder-files");
        var fileP = document.createElement("p");
        fileP.textContent = fileName;
        fileP.className = "file";
        filesDiv.appendChild(fileP);
      }
      cursor.continue();
    }
  };
};

// JavaScript
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
      createFolderSection(folderName);
      document.getElementById("folder-name").value = "";
    }
  });

function createFolderSection(name) {
  var folderDiv = document.createElement("div");
  folderDiv.className = "folder";

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
              var file = files[j];
              var fileP = document.createElement('p');
              fileP.textContent = file.name;
              fileP.className = 'file';
              // add foldername as data attribute
              fileP.dataset.folder = folderName;
              filesDiv.appendChild(fileP);

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
      }
  }
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

document.addEventListener("click", function (e) {
  if (e.target.className == "file") {
    console.log("file clicked");
    openFile(e.target.dataset.folder, e.target.textContent);
  }
});
