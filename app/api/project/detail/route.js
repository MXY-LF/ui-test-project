import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function POST(request) {
    const body = await request.json();
     // 获取请求参数中的 id
    const project = await prisma.project.findUnique({
        where: { id: parseInt(body.id) }
    });
    return new Response(JSON.stringify({ data: project }), {
        status: 200,
    });
}