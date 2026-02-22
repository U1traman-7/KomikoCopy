import { NextApiRequest, NextApiResponse } from 'next';

export default async function checkStatus(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { taskId } = req.body;

        const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.aliyun_api_key}`,
            },
        });

        const data = await response.json();
        return res.status(200).json(data);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}