import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
    const url = new URL(request.url);
    const testId = url.searchParams.get('testId'); // 获取请求参数中的 id
   

    if (!testId) {
        return NextResponse.error({ status: 400, message: 'ID is required' });
    }
    try {
        // 查询 project 表中 id 为 2 的 project 及其所有的 testcase
        const testCases = await prisma.testCase.findUnique({
            where: { id: parseInt(testId) },
        });
        if (!testCases) {
            return NextResponse.json({data: {
                detail: []
            }});
        }
        

        // 构建响应数据
        const response = {
            data: {
                detail: testCases.detail
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.error({ status: 500, message: 'Internal Server Error' });
    } finally {
        await prisma.$disconnect();
    }


}