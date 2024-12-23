import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { fork } from 'child_process';
import { compareBase64Images } from '@/utils/compareImg';
const prisma = new PrismaClient();

// 定义任务队列和锁变量
export const taskQueue = [];
export let isProcessing = false;

export async function POST(request) {
    const { projectId, script, name } = await request.json(); // 解析请求体
    console.log('projectId:', projectId, name);
    try {
        // 创建新的 testCase 并关联到项目
        const newTestCase = await prisma.testCase.create({
            data: {
                projectId: parseInt(projectId), // 确保 projectId 是整数
                name: name,
                script: script
            },
        });
        const curProject = await prisma.project.findUnique({
            where: { id: parseInt(projectId) }
        });

        const versions = curProject.version;
        const newVersion = await prisma.version.create({
            data: {
                testCaseId: newTestCase.id,
                version: versions.pop(),
                status: 'DOING',
                video: '',
                images: [],
                diffImgs: [],
                // timestamp: formatDate(new Date()) // 添加时间戳
            }
        });
        // 将任务添加到队列中
        taskQueue.push({ testCaseId: newTestCase.id, script, name, versionId: newVersion.id, versions });
        console.log('Task added to queue:', taskQueue.length, isProcessing);
        // 如果没有正在处理的任务，则开始处理队列
        if (!isProcessing) {
            processQueue();
        }

        return new Response(JSON.stringify({ status: 'S', id: projectId, testCaseId: newTestCase.id }), {
            status: 200,
        });
    } catch (error) {
        console.log('Error creating test case:', error);
        return new Response(JSON.stringify({ status: 'F', message: error.message }), {
            status: 500,
        });
    } finally {
        await prisma.$disconnect();
    }
}

// 格式化日期为年月日时分秒的形式
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 处理任务队列
export async function processQueue() {
    isProcessing = true;

    if (taskQueue.length > 0) {
        const { versionId, script, name, versions, testCaseId } = taskQueue.shift();
        const lastVersionNum = versions.pop()
        console.log('Processing queue...', isProcessing, name, versions, formatDate(new Date()));
        try {
            const projectRoot = process.cwd(); // 获取当前工作目录
            // 启动子进程
            const child = fork(path.join(projectRoot, 'app', 'api', 'detail', 'create', 'worker.mjs'));

            // 向子进程发送任务
            child.send({ testCaseId, script, name, lastVersionNum, testCaseId, versionId });

            // 监听子进程的消息
            child.on('message', async (result) => {



            });

            // 监听子进程的退出事件
            child.on('exit', (code) => {
                console.log('Child process exited with code:', code, formatDate(new Date()));
                if (code !== 0) {
                    console.error('Child process exited with code:', code);
                }
                // 子进程退出后，继续处理下一个任务
                if (taskQueue.length > 0) {
                    console.log('Next task in queue:', taskQueue[0].name, formatDate(new Date()), isProcessing);
                    processQueue();
                } else {
                    console.log('All tasks completed', isProcessing);
                    isProcessing = false;
                }
            });
        } catch (error) {
            console.error('Error executing task:', error);
            // 可以在这里记录错误或采取其他措施
        }
    }
}