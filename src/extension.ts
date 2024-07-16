import path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	console.log("Chemin is active");

	const navigateToTestFile = vscode.commands.registerCommand(
		"chemin.navigateToTestFile",
		async () => {
			const fileAbsolutePath = getDocumentPath();
			const workspaceAbsolutePath =
				vscode.workspace.workspaceFolders?.at(0)?.uri.path;

			if (!workspaceAbsolutePath || !fileAbsolutePath) {
				return;
			}

			const logicalPath = getLogicalPath(
				fileAbsolutePath,
				workspaceAbsolutePath
			);

			const absoluteSpecPath = getSpecFilePath(workspaceAbsolutePath, logicalPath);

			//	In case the spec path targets a non-existing file
			const canOpenSpecFile = await canOpenFile(absoluteSpecPath);

			if (!canOpenSpecFile) {
				return vscode.window.showErrorMessage(
					"Could not open the corresponding spec file"
				);
			}

			//	Finally, opens the spec file
			const specDocument = await vscode.workspace.openTextDocument(
				absoluteSpecPath
			);
			await vscode.window.showTextDocument(specDocument);
		}
	);

	context.subscriptions.push(navigateToTestFile);
}

//	TODO: Take into account controllers, jobs, etc...
function getSpecFilePath(workspaceAbsolutePath: string, logicalPath: string): string {
	const relativeSpecPath = `spec\\models\\${logicalPath}_spec.rb`;

	return path.join(
		workspaceAbsolutePath,
		relativeSpecPath
	);
}

//	Computes the "logical" path of the current file
//	Such path takes into account modules & entity name
//	Ex: app/models/EntityModule/Entity.rb -> EntityModule/Entity
function getLogicalPath(
	fileAbsolutePath: string,
	workspaceAbsolutePath: string
): string {
	//	Substracts the absolute CWD path & file path
	const fileRelativePath = fileAbsolutePath.slice(
		workspaceAbsolutePath.length
	);

	const logicalPathExt = fileRelativePath.slice("app\\models\\".length);
	//	Basically removes the .ext substring, to be improved
	const logicalPath = logicalPathExt.substring(
		0,
		logicalPathExt.length - path.extname(logicalPathExt).length
	);

	return logicalPath;
}

//	Returns the path of the opened ruby file
function getDocumentPath(): string | undefined {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		return undefined;
	}

	const document = editor.document;
	const fileAbsolutePath = document.uri.fsPath;

	if (document.languageId !== "ruby") {
		return undefined;
	}

	return fileAbsolutePath;
}

//	Indicates if a file can be opened in vscode
async function canOpenFile(path: string): Promise<boolean> {
	const uri = vscode.Uri.file(path);

	return vscode.workspace.fs.stat(uri).then(
		(_success) => {
			return true;
		},
		(_reject) => {
			return false;
		}
	);
}
