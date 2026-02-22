import { NextApiRequest, NextApiResponse } from 'next';

export default async function checkImage(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { imageUrl } = req.body;

        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/aa-detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.aliyun_api_key}`,
            },
            body: JSON.stringify({
                model: 'animate-anyone-detect',
                input: { image_url: imageUrl },
            }),
        });

        const data = await response.json();
        return res.status(200).json(data);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}