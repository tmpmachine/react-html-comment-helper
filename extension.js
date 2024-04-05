const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {

	let activeCommandListener = vscode.commands.registerCommand('reactcommenthelper.createCommentFile', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
		  vscode.window.showErrorMessage('No active editor');
		  return;
		}
	  
		const document = editor.document;
		const currentFilePath = document.uri.fsPath;
		const currentFileDir = path.dirname(currentFilePath);
		const currentFileName = path.basename(currentFilePath);
		const currentExt = path.extname(currentFilePath);
	  
		const divlessDirPath = path.join(currentFileDir);
		const targetFilePath = path.join(divlessDirPath, currentFileName.replace(`${currentExt}`, `.comment${currentExt}`));
	  
		// if (!fs.existsSync(divlessDirPath)) {
		//   fs.mkdirSync(divlessDirPath);
		// }
	  
		if (!fs.existsSync(targetFilePath)) {
		  const content = document.getText();
		  fs.writeFileSync(targetFilePath, content);
		}
	  
		/* vscode.workspace.openTextDocument(targetFilePath).then((document) => {
		  vscode.window.showTextDocument(document);
		}); */
	});
	
	let commentRemover = vscode.commands.registerCommand('reactcommenthelper.removeCommentHelper', async () => {
        // Get the workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace opened!');
            return;
        }

        // Define the file pattern to search for
        const filePattern = '**/*.comment.tsx';

        // Iterate over each workspace folder
        for (const folder of workspaceFolders) {
            // Search for files matching the pattern
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, filePattern));

            // Filter out development folders
            const filteredFiles = files.filter(file => {
                const filePath = file.fsPath;
                return !filePath.includes('/node_modules/') && !filePath.includes('/.git/') && !filePath.includes('/.vscode/');
            });

            // Log the file paths
            filteredFiles.forEach(file => {
                console.log('Found .comment.tsx file:', file.fsPath);
				clearCommentFromFileAtPath(file.fsPath);
            });
        }
    });

	function clearCommentFromFileAtPath(commentFilePath) {

		try {
			// const currentExt = path.extname(event.fileName);

			if (!commentFilePath.includes(`.comment.tsx`)) return;

			// const editor = vscode.window.activeTextEditor;
			// if (!editor) {
				// vscode.window.showErrorMessage('No active editor');
				// return;
			// }
			// const document = editor.document;
			// const currentFilePath = document.uri.fsPath;
			// const currentFileDir = path.dirname(currentFilePath);
    		// const parentDirPath = path.dirname(currentFileDir);
			// const currentFileName = path.basename(currentFilePath);

			// const content = event.getText();
			const filePath = commentFilePath.replace(`.comment.tsx`, `.tsx`);
			let content = fs.readFileSync(filePath, 'utf8');
			let comments = content.match(/<HTMLComment text.*\/>/g);
			 // Get the end-of-line sequence from the content
			const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';

			if (comments) {
				for (let comment of comments) {
					content = content.replace(comment, '');
				}
			}
		
			// Check the line endings of the document
			content = content.replace(`import HTMLComment from 'react-html-comment';${lineEnding}`, '');	

			fs.writeFileSync(filePath, content);

		} catch (e) {
			console.error(e)
		}	
	}

	/* const openFileListener = vscode.workspace.onDidOpenTextDocument(async event => {
		const currentExt = path.extname(event.fileName);
		
		if (currentExt != '.tsx' || event.fileName.includes(`.comment.tsx`)) {
			return;
		}
	
		const currentFilePath = getFilePathFromUri(vscode.Uri.file(event.fileName));
		const currentFileDir = path.dirname(currentFilePath);
		const currentFileName = path.basename(currentFilePath);
		const divlessFilePath = path.join(currentFileDir, '.divless', currentFileName.replace(`${currentExt}`, `.divless${currentExt}`));
	
		if (fs.existsSync(divlessFilePath)) {
			const divlessFileUri = vscode.Uri.file(divlessFilePath);
			// const document = await vscode.workspace.openTextDocument(divlessFileUri);
			// await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Active, preserveFocus: true });

			// const filePath = divlessFileUri; // Replace with the desired file path

			const openFileAction = 'Open divless File';
			vscode.window.showInformationMessage('A divless version of this file is exists. Avoid making changes to this file.', openFileAction)
			.then(selection => {
				if (selection === openFileAction) {
					vscode.commands.executeCommand('vscode.open', divlessFileUri);
				}
			});
		}
	}); */

	/* function getFilePathFromUri(uri) {
		if (uri.scheme === 'file') {
		  return uri.fsPath;
		} else {
		  // Handle other schemes like 'untitled'
		  return null;
		}
	} */

	const saveListener = vscode.workspace.onDidSaveTextDocument((event) => {
		try {
			// const currentExt = path.extname(event.fileName);

			if (!event.fileName.includes(`.comment.tsx`)) return;

			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}
			const document = editor.document;
			const currentFilePath = document.uri.fsPath;
			const currentFileDir = path.dirname(currentFilePath);
    		// const parentDirPath = path.dirname(currentFileDir);
			const currentFileName = path.basename(currentFilePath);

			const finalPath = path.join(currentFileDir, currentFileName.replace(`.comment.tsx`, `.tsx`));
			const content = event.getText();
			fs.writeFileSync(finalPath, customContentReplacer(document, content));

		} catch (e) {
			console.error(e)
		}
	});
	
	context.subscriptions.push(activeCommandListener);
	// context.subscriptions.push(openFileListener);
	context.subscriptions.push(saveListener);
    context.subscriptions.push(commentRemover);
}

function customContentReplacer(document, content) {

	let comments = content.match(/\{\/\*<!-- # .*-->\*\/\}/g)
	
	if (comments) {
		for (let comment of comments) {
			let txt = comment.substring(8, comment.length-8);
			let reactComment = `<HTMLComment text="${txt}" />`;
			content = content.replace(comment, reactComment);
		}
	}

	// Check the line endings of the document
	const lineEnding = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

	return `import HTMLComment from 'react-html-comment';${lineEnding}${content}`;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}