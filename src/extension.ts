import * as vscode from 'vscode';
import { documentationCodeHandler } from './documentationCodeHandler';
import * as path from 'path';
import * as fs from "fs";
import {getDynamicContent, getErrorContent, getRealContent, } from "./Utils";

const commandsSelectionNames = ["codeExplainer", "findProblems", "optimize", "explain", "addComments"];

const commandsNewFileNames = ["GenOneGTest", "GenOneDocumentation", "GenSQL"];

const commandsPaletteNames = ["GenAllTest", "GenAllDocumentation"];

interface CommandSelectionFunctions {
    [key: string]: (selection: string) => Promise<string>;
}

const commandsSelection: CommandSelectionFunctions = {
    async codeExplainer(selection: string) {
        return await documentationCodeHandler("", selection)!;
    },
    async findProblems(selection: string) {
        return await documentationCodeHandler("", selection);
    },
    async optimize(selection: string) {
        return await documentationCodeHandler("", selection);
    },
    async addComments(selection: string) {
        return await documentationCodeHandler("", selection);
    },
};

interface CommandNewFileFunctions {
    [key: string]: (uri: vscode.Uri) => Promise<string>;
}

const commandsNewFile: CommandNewFileFunctions = {
    async safeguardSQL(uri: vscode.Uri) {
        const fileName = uri.fsPath;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        let rootPath = "";

        if (workspaceFolders && workspaceFolders.length > 0) {
            rootPath = workspaceFolders[0].uri.fsPath;
        }

        return await documentationCodeHandler(rootPath, fileName);
    },
    async documentationGenerator(uri: vscode.Uri) {
        const fileName = uri.fsPath;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        let rootPath = "";

        if (workspaceFolders && workspaceFolders.length > 0) {
            rootPath = workspaceFolders[0].uri.fsPath;
        }

        return await documentationCodeHandler(rootPath, fileName);
    },
    async testGenerator(uri: vscode.Uri) {
        const fileName = uri.fsPath;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        let rootPath = "";

        if (workspaceFolders && workspaceFolders.length > 0) {
            rootPath = workspaceFolders[0].uri.fsPath;
        }

        return await documentationCodeHandler(rootPath, fileName);
    },
};

export function activate(context: vscode.ExtensionContext) {

    const registeredNewFileCommands = commandsNewFileNames.map((command) => vscode.commands.registerCommand(`garurumon.${command}`, async (resource) => {
        if (resource instanceof vscode.Uri) {
            vscode.window.showInformationMessage(`Aguardando o ${command}...`);
            try {
                if (typeof commandsNewFile[command] === 'function') {

                    const workspaceFolders = vscode.workspace.workspaceFolders;

                    let rootPath = "";

                    if (workspaceFolders && workspaceFolders.length > 0) {
                        rootPath = workspaceFolders[0].uri.fsPath;
                    }

                    let filePath = path.join(rootPath, 'readme.md');

                    const panel = vscode.window.createWebviewPanel(
                        'loadingContentPanel', // Identificador único
                        'Conteúdo com Carregamento', // Título do painel
                        vscode.ViewColumn.Beside, // Exibir na aba ao lado do terminal
                        {
                            enableScripts: true // Permitir a execução de scripts na página da web
                        }
                    );

                    let response;

                    // Mostra o carregamento inicial
                    panel.webview.html = getDynamicContent();

                    try {
                        // Obtém a resposta do método assíncrono
                        response = await commandsNewFile[command](resource);

                        fs.writeFileSync(filePath, response, 'utf8');

                        let openPath = vscode.Uri.parse("file:///" + filePath); //A request file path
                        vscode.workspace.openTextDocument(openPath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });

                        panel.webview.html = getRealContent("Documentação Gerada com sucesso, verifique o arquivo readme.md");
                    } catch (error) {
                        panel.webview.html = getErrorContent(error);
                    }

                } else {
                    console.error('Método não encontrado');
                }

            } catch (error) {
                vscode.window.showErrorMessage('Ocorreu um erro durante a operação.');
            }
        }
    }));

    context.subscriptions.push(...registeredNewFileCommands);

    const registeredSelectionCommands = commandsSelectionNames.map((command) => vscode.commands.registerCommand(`garurumon.${command}`, async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return;
        }

        const selection = editor.document.getText(editor.selection);
        if (selection) {
            if (typeof commandsSelection[command] === 'function') {
                const replacementText = await commandsSelection[command](selection);

                if (replacementText) {
                    editor.edit((editBuilder) => {
                        editBuilder.replace(editor.selection, replacementText);
                    });
                    vscode.commands.executeCommand("editor.action.formatDocument");
                }
            } else {
                console.error('Método não encontrado');
            }
        }
    }));

    context.subscriptions.push(...registeredSelectionCommands);


    let disposable = vscode.commands.registerCommand('garurumon.helloWorld', async () => {

    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
