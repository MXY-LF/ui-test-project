import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
const prisma = new PrismaClient();

// 存储终端进程的映射
const terminalProcesses = new Map();

export async function POST(request) {
    const body = await request.json();
    // 检查是否有 id
    const hasId = !!body.id;

    // 将 fileDir 属性重新命名为 zipFile
    const modifiedBody = {
        ...body,
        zipFile: body.files,
    };

    delete modifiedBody.files; // 删除原始的 files 属性
    delete modifiedBody.id;

    try {
        let project;
        // 创建项目
        if (hasId) {
            project = await prisma.project.findUnique({
                where: { id: body.id }
            });

            if (!project) {
                return new Response(JSON.stringify({ error: 'Project not found' }), {
                    status: 404,
                });
            }
        } else {
            project = await prisma.project.create({
                data: modifiedBody
            });
        }

        // 获取项目的 name 和 id
        const { name, id, port } = project;

        // 构建新的文件夹名称
        const oldFolderPath = modifiedBody.zipFile;
        const newFolderPath = path.join(path.dirname(oldFolderPath), `${name}-${id}`);

        // 如果新文件夹已经存在，先删除它
        await deleteFolderRecursively(newFolderPath);

        // 更新文件夹名称
        await updateFolderName(oldFolderPath, newFolderPath);

        // 更新数据库中的路径
        await prisma.project.update({
            where: { id: project.id },
            data: { zipFile: newFolderPath }
        });

        // 关闭旧的终端进程和端口
        await closeTerminalAndPort(project.id, port);

        // 打开一个新的终端窗口来执行命令
        const newProcess = openTerminalWithCommand(`serve -s -p ${port} "${newFolderPath}/dist"`);
        terminalProcesses.set(project.id, newProcess);

        return new Response(JSON.stringify({ data: project }), {
            status: 200,
        });
    } catch (error) {
        console.error('Error creating or updating project:', error);
        return new Response(JSON.stringify({ error: 'Failed to create or update project' }), {
            status: 500,
        });
    }
}

// 更新文件夹名称的函数
async function updateFolderName(oldName, newName) {
    try {
        await fs.promises.rename(oldName, newName);
        console.log(`Folder renamed from ${oldName} to ${newName}`);
    } catch (error) {
        console.error(`Error renaming folder from ${oldName} to ${newName}:`, error);
        throw error;
    }
}

// 递归删除文件夹
async function deleteFolderRecursively(folderPath) {
    try {
        if (fs.existsSync(folderPath)) {
            await fs.promises.rm(folderPath, { recursive: true, force: true });
            console.log(`Deleted folder: ${folderPath}`);
        }
    } catch (error) {
        console.error(`Error deleting folder: ${folderPath}`, error);
        throw error;
    }
}

// 关闭终端进程和端口
async function closeTerminalAndPort(projectId, port) {
    await closeTerminal(projectId);
    await killPort(port);
}

// 关闭终端进程
function closeTerminal(projectId) {
    return new Promise((resolve) => {
        const process = terminalProcesses.get(projectId);
        if (process) {
            process.kill('SIGKILL'); // 使用 SIGKILL 强制终止进程
            terminalProcesses.delete(projectId);
            console.log(`Closed terminal for project with ID: ${projectId}`);
        } else {
            console.log(`No terminal process found for project with ID: ${projectId}`);
        }
        resolve();
    });
}

// 杀死端口
function killPort(port) {
    return new Promise((resolve) => {
        const command = process.platform === 'win32' ? `npx kill-port ${port}` : `fuser -k ${port}/tcp`;
        try {
            const child = spawn(command, { shell: true });
            child.on('error', (err) => {
                console.error(`Error killing port ${port}: ${err.message}`);
            });
            child.on('exit', (code, signal) => {
                if (code === 0) {
                    console.log(`Port ${port} killed with code ${code} and signal ${signal}`);
                } else {
                    console.log(`No process found on port ${port}`);
                }
                resolve();
            });
        } catch (error) {
            console.error(`Error killing port ${port}: ${error.message}`);
            resolve();
        }
    });
}

function openTerminalWithCommand(command) {
    console.log(`Opening terminal with command: ${command}`);

    let terminal;
    let args;

    if (process.platform === 'win32') {
        terminal = 'cmd.exe';
        args = ['/c', 'start', 'cmd', '/k', command];
    } else if (process.platform === 'linux') {
        terminal = 'gnome-terminal';
        args = ['--', 'bash', '-c', command + '; exec bash'];
    } else {
        console.error('Unsupported platform');
        return;
    }

    try {
        const child = spawn(terminal, args, { shell: true });
        child.on('error', (err) => {
            console.error(`Error opening terminal: ${err.message}`);
        });
        child.on('exit', (code, signal) => {
            console.log(`Terminal exited with code ${code} and signal ${signal}`);
        });
        return child;
    } catch (error) {
        console.error(`Error opening terminal: ${error.message}`);
    }
}