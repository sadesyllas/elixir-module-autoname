'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.elixirModuleAutoname', () => {
        const document = vscode.window.activeTextEditor.document;

        if (document.languageId !== 'elixir') {
            vscode.window.showErrorMessage(`This file (${document.fileName}) is not an Elixir file`);
            return;
        }

        let filePath = document.fileName.split(path.sep);

        if (filePath.length === 1) {
            vscode.window.showErrorMessage(`This file (${document.fileName}) is not a saved Elixir file.`);
            return;
        }

        const mappingsTmp = <{string: string}>vscode.workspace.getConfiguration('elixirModuleAutoname').get('mappings');
        let mappings = {};

        for (const key in mappingsTmp) {
            mappings[key.toLowerCase()] = mappingsTmp[key];
        }

        let x = 1;

        const moduleName =
            (<string[]>filePath
                .reduceRight((acc, val, _idx, _arr) => {
                    const done = <boolean>acc[0];
                    let pathParts = <string[]>acc[1];

                    if (done) {
                        return acc;
                    }

                    if (val === 'lib' || val === 'test') {
                        return [true, pathParts];
                    }

                    pathParts.push(val);

                    return [false, pathParts];
                }, [false, <string[]>[]])[1])
                .reverse()
                .map(pathPart => {
                    const pathPartFixed =
                        pathPart
                            .replace(/\.[^.]+/, '')
                            .split(/_/)
                            .map(pathSubPart => {
                                return mappings[pathSubPart.toLowerCase()] ||
                                    `${pathSubPart[0].toUpperCase()}${pathSubPart.substr(1)}`;
                            })
                            .join('');

                    return mappings[pathPartFixed.toLowerCase()] || pathPartFixed;
                })
                .join('.');

        vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.replace(vscode.window.activeTextEditor.selection, moduleName);
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
