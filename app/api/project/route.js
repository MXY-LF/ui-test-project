import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        // 查询所有 project
        const projects = await prisma.project.findMany();

        // 构建响应数据
        const response = {
            data: projects
        };
        console.log('-----',response)
        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.error({ status: 500, message: 'Internal Server Error' });
    } finally {
        await prisma.$disconnect();
    }
}