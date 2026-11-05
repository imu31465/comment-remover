const vscode = require('vscode');
function removeComments(code) {
    let result = '';
    let i = 0;
    const len = code.length;
    let lastSignificant = '';
    while (i < len) {
        if (code[i] === '"') {
            let j = i + 1;
            while (j < len && code[j] !== '"') {
                if (code[j] === '\\') j++;
                j++;
            }
            result += code.slice(i, j + 1);
            lastSignificant = 'string';
            i = j + 1;
        }
        else if (code[i] === "'") {
            let j = i + 1;
            while (j < len && code[j] !== "'") {
                if (code[j] === '\\') j++;
                j++;
            }
            result += code.slice(i, j + 1);
            lastSignificant = 'string';
            i = j + 1;
        }
        else if (code[i] === '`') {
            let j = i + 1;
            let depth = 0;
            while (j < len) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === '$' && code[j + 1] === '{') { depth++; j += 2; continue; }
                if (depth > 0 && code[j] === '}') { depth--; j++; continue; }
                if (depth === 0 && code[j] === '`') break;
                j++;
            }
            result += code.slice(i, j + 1);
            lastSignificant = 'string';
            i = j + 1;
        }
        else if (code[i] === '/' && code[i + 1] === '*') {
            let j = i + 2;
            while (j < len - 1 && !(code[j] === '*' && code[j + 1] === '/')) {
                j++;
            }
            i = j + 2;
        }
        else if (
            code[i] === '/' && code[i + 1] === '/' &&
            !(i > 0 && (code[i - 1] === ':' || code[i - 1] === '/'))
        ) {
            while (i < len && code[i] !== '\n') {
                i++;
            }
        }
        else if (
            code[i] === '/' &&
            /[=(,!&|?:;{}\[~^]/.test(lastSignificant) 
        ) {
            let j = i + 1;
            let inClass = false;
            while (j < len && (code[j] !== '/' || inClass)) {
                if (code[j] === '\\') { j++; }
                else if (code[j] === '[') { inClass = true; }
                else if (code[j] === ']') { inClass = false; }
                j++;
            }
            j++;
            while (j < len && /[gimsuy]/.test(code[j])) j++;
            result += code.slice(i, j);
            lastSignificant = 'regex';
            i = j;
        }
        else {
            const ch = code[i];
            result += ch;
            if (!/\s/.test(ch)) lastSignificant = ch;
            i++;
        }
    }
    return result;
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.removeComments', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const document = editor.document;
        const fullText = document.getText();
        const headerEndMarker = "// ==/" + "UserScript==";
        const headerRegex = new RegExp(`^${headerEndMarker}\\s*[\\r\\n]`, 'm');
        let headerText = "";
        let bodyText = fullText;
        const match = fullText.match(headerRegex);
        if (match) {
            const splitIndex = match.index + match[0].length;
            headerText = fullText.substring(0, splitIndex);
            bodyText = fullText.substring(splitIndex);
        }
        let cleanBody = removeComments(bodyText);
        cleanBody = cleanBody.replace(/^[ \t]*[\r\n]/gm, "");
        if (headerText && !headerText.endsWith('\n')) {
            headerText += '\n';
        }
        const newText = headerText + cleanBody;
        editor.edit(editBuilder => {
            const range = new vscode.Range(
                document.positionAt(0),
                document.positionAt(fullText.length)
            );
            editBuilder.replace(range, newText);
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() {}
module.exports = {
    activate,
    deactivate
};