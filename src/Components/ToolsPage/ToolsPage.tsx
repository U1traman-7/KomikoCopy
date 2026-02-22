/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-11-29 20:41:59
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-11 20:44:00
 * @FilePath: /ComicEditor/src/Components/ToolsPage/ToolsPage.tsx
 * @Description: 
 */

import { Card, CardBody, CardHeader, CardFooter, Button, Image } from "@nextui-org/react";
import Link from "next/link";


// 在组件外部定义接口
interface ToolItem {
    id: number;
    path: string;
    video_url: string;
    title: string;
    content: string;
}

// AI工具列表数据
const aiTools: ToolItem[] = [
    {
        id: 1,
        path: "/tools/inbetween",
        video_url: "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm",
        title: "Inbetween",
        content: "Generate inbetween frames for your animations, simply input your start and end frames."
    },
    {
        id: 2,
        path: "/tools/line_art_colorize",
        video_url: "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/bb4a3a5b-761f-461b-b96f-7754a6cbf269.webm",
        title: "Line Art Colorize",
        content: "Colorize your line art with AI, simply upload your line art."
    },
    {
        id: 3,
        path: "/tools/video_upscaler",
        video_url: "https://replicate.delivery/yhqm/KZ3P0kNaCvY2MB2uhfzdprCVF7d1Je4VA6qeJvyy8Ze0IBnPB/tmp93pagw6_8dbc81c0-a907-45b3-a81d-e90a6bcbea39_out.mp4",
        title: "Anime Video Upscaler",
        content: "Use the most advanced upscaling model to enhance the resolution of your comics or anime illustrations."
    },
    {
        id: 4,
        path: "/tools/frame_interpolation",
        video_url: "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/c1171fab-76b3-4c73-9e0d-8e03eed98651.webm",
        title: "Frame Interpolation",
        content: "Interpolation frames for your animations, simply input your start and end frames."
    },
    {
        id: 5,
        path: "/tools/video_interpolation",
        video_url: "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/679983bc-952d-4509-bf03-d8b5bc1f91bc.webm",
        title: "Frame Interpolation",
        content: "Frame Interpolation for Large Motion."
    },
    // {
    //     id: 6,
    //     path: "/tools/redraw",
    //     video_url: "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm",
    //     title: "Anime Redraw",
    //     content: "Use the most advanced upscaling model to enhance the quality of your comics or anime illustrations."
    // },
    // ... 可以继续添加更多工具
];

export default function ToolsPage() {


    return (
        <div className="max-w-full mx-auto px-4">
            {/* AI 工具分类 */}
            <div className="my-8">
                <h2 className="text-2xl font-bold text-muted-foreground mb-4">AI Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {aiTools.map((tool: ToolItem) => (
                        <div key={`ai-tool-${tool.id}`}>
                            <Card as={Link} href={`${tool.path}`} isPressable className="w-full">
                                <CardBody>
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-40 object-cover rounded-lg"
                                    >
                                        <source
                                            src={tool.video_url}
                                            type="video/mp4"
                                        />
                                    </video>

                                    <div className="mt-3">
                                        <h3 className="text-xl font-semibold text-muted-foreground">{tool.title}</h3>
                                        <p className="text-muted-foreground mt-1 line-clamp-2">{tool.content}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* 图像处理分类 */}
            {/* <div className="my-8">
                <h2 className="text-2xl font-bold mb-4">图像处理</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                </div>
            </div> */}
        </div>
    );
}