import { NextApiRequest, NextApiResponse } from 'next';

export default async function generateVideo(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { imageUrl, template } = req.body;

        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.aliyun_api_key}`,
                'X-DashScope-Async': 'enable',
            },
            body: JSON.stringify({
                model: 'animate-anyone',
                input: {
                    image_url: imageUrl,
                    pose_sequence_id: template,
                },
                parameters: {
                    video_ratio: '9:16',
                },
            }),
        });

        const data = await response.json();
        return res.status(200).json(data);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}