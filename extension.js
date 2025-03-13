const vscode = require("vscode");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");

function getGtotoPath() {
    let userPath = vscode.workspace.getConfiguration().get("totoscript.compilerPath");
    if (userPath) return userPath;

    try {
        child_process.execSync("gtoto --version", { stdio: "ignore" });
        return "gtoto";
    } catch (error) {
        return path.join(__dirname, "bin", "gtoto.exe");
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

    // ✅ Gestion des espaces dans les chemins sous Windows
    if (process.platform === "win32") {
        terminal.sendText(`& "${gtotoCompiler}" "${filePath}"`);
    } else {
        terminal.sendText(`"${gtotoCompiler}" "${filePath}"`);
    }
}

function addToPathWindows() {
    const gtotoPath = path.join(__dirname, "bin");

    try {
        // 📌 Vérifie si `gtoto` est déjà dans le PATH
        let currentPath = child_process.execSync("reg query HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment /v Path")
            .toString();

        if (currentPath.includes(gtotoPath)) {
            vscode.window.showInformationMessage("Gtoto is already in the PATH.");
            return;
        }

        // 📌 Ajoute `gtoto` au PATH global (Admin requis)
        child_process.execSync(`setx PATH "%PATH%;${gtotoPath}" /M`, { stdio: "ignore" });

        vscode.window.showInformationMessage("Gtoto has been added to PATH! Restart your computer to apply changes.");
    } catch (err) {
        vscode.window.showErrorMessage("Error adding Gtoto to PATH: Please run VS Code as Administrator.");
    }
}

function addToPathUnix() {
    const homeDir = os.homedir();
    const shellConfig = path.join(homeDir, ".bashrc"); // ou ".zshrc" pour macOS
    const gtotoPath = path.join(__dirname, "bin");

    try {
        // 📌 Vérifier si le chemin est déjà dans le PATH
        let content = fs.readFileSync(shellConfig, "utf8");
        if (content.includes(gtotoPath)) {
            vscode.window.showInformationMessage("Gtoto is already in the PATH.");
            return;
        }

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
