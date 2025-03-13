const vscode = require("vscode");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");

function getGtotoPath() {
    // Check if user has defined a path in settings.json
    let userPath = vscode.workspace.getConfiguration().get("totoscript.compilerPath");
    if (userPath) return userPath; // Use user's path if available

    try {
        // Check if "gtoto" is in the system PATH
        child_process.execSync("gtoto --version", { stdio: "ignore" });
        return "gtoto"; // If found, use it
    } catch (error) {
        // Otherwise, use the version inside the extension bin/
        return path.join(__dirname, "bin", "gtoto.exe"); // ⬅️ Met `gtoto.exe`
    }
}

function runGtoto() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active file found!");
        return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    const gtotoCompiler = getGtotoPath();

    let terminal = vscode.window.terminals.find(t => t.name === "Gtoto");
    if (!terminal) {
        terminal = vscode.window.createTerminal("Gtoto");
    }

    terminal.show();
    
    terminal.sendText(`"& '${gtotoCompiler}' '${filePath}'"`);
}


function addToPathUnix() {
    const homeDir = os.homedir();
    const shellConfig = path.join(homeDir, ".bashrc"); // or ".zshrc" for macOS users
    const gtotoPath = path.join(__dirname, "bin");

    try {
        fs.appendFileSync(shellConfig, `\nexport PATH="$PATH:${gtotoPath}"\n`);
        vscode.window.showInformationMessage("Gtoto has been added to PATH! Restart your terminal.");
    } catch (err) {
        vscode.window.showErrorMessage("Error adding Gtoto to PATH: " + err.message);
    }
}

function addToPath() {
    if (process.platform === "win32") {
        addToPathWindows();
    } else {
        addToPathUnix();
    }
}

function activate(context) {
    let runCommand = vscode.commands.registerCommand("totoscript.run", runGtoto);
    let addPathCommand = vscode.commands.registerCommand("totoscript.addToPath", addToPath);

    context.subscriptions.push(runCommand);
    context.subscriptions.push(addPathCommand);
}

module.exports = { activate };
