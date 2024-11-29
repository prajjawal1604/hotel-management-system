const { ipcRenderer } = require('electron');

// Add an event listener to the button
document.getElementById('upload').addEventListener('click', () => {
	ipcRenderer.invoke('open-file-dialog').then((filePath) => {
		if (filePath) {
			document.getElementById('file-path').innerText = `File Path: ${filePath}`;
		} else {
			document.getElementById('file-path').innerText = 'No file selected';
		}
	});
});
