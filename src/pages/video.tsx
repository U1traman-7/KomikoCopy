import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, Select, Spacer, Card, NextUIProvider, SelectItem } from '@nextui-org/react';
import { Analytics } from '@vercel/analytics/react';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import { v4 as uuidv4 } from 'uuid';
import { SimpleImageUploader } from '../Components/ImageUploader';
import Head from 'next/head';
import { uploadImage as uploadImageApi } from '@/api/upload';

const Home: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!image || !imageFile) {
            setError('Please upload a character image');
            return;
        }
        if (!selectedTemplate) {
            setError('Please select a dance');
            return;
        }

        setLoading(true);
        setVideoUrl(null);
        setError(null);

        try {
            // 1. 上传图片并获取 URL
            const imageUrl = await uploadImageToSupabase(imageFile);

            // 2. 检测图片是否符合要求
            const checkObj = await checkImage(imageUrl);
            if (!checkObj.check_pass) {
                setError(`Sorry, this image isn’t supported. Please ensure the character is standing, facing the camera directly, with both shoulders visible.`);
                setLoading(false);
                return;
            }
            // 3. 提交生成视频任务
            const taskId = await generateVideo(imageUrl, selectedTemplate);
            console.log("taskId", taskId);
            // const taskId = "3af9f57c-e8c8-4f51-9020-0a70c0702f5c"

            // 4. 查询任务状态，直到任务完成
            const videoUrl = await checkStatus(taskId);
            console.log("videoUrl", videoUrl);

            setVideoUrl(videoUrl);
        } catch (err) {
            setError(`Error generating dance video: ${err}`);
        } finally {
            setLoading(false);
        }
    };
    function getContentTypeFromBase64(base64String: string): string | undefined {
        const match = base64String.match(/^data:(.*?);base64,/);
        return match ? match[1] : undefined;
    }
    const uploadImageToSupabase = async (imageFile: File): Promise<string> => {
        const fileName = `dance_character/${Date.now()}${uuidv4()}.${imageFile.name.split('.').pop()}`;
        const form = new FormData();
        form.append('file', imageFile);
        form.append('imagePath', fileName);

        const result = await uploadImageApi(form).catch();

        if (!result || result.error) {
            throw new Error(`Error uploading image: ${error}`);
        }

        return result.data;
    };

    const checkImage = async (imageUrl: string): Promise<any> => {
        const response = await fetch('/api/animateanyone/checkImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl }),
        });

        const data = await response.json();
        console.log("data", data)
        return data.output;
    };


    const generateVideo = async (imageUrl: string, template: string): Promise<string> => {
        const response = await fetch('/api/animateanyone/generateVideo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageUrl,
                template,
            }),
        });

        const data = await response.json();
        return data.output.task_id;
    };

    const checkStatus = async (taskId: string): Promise<string> => {
        let status = 'PENDING';
        let videoUrl = '';

        while (status === 'PENDING' || status === 'RUNNING') {
            const response = await fetch('/api/animateanyone/checkStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ taskId }),
            });

            const data = await response.json();
            status = data.output.task_status;

            if (status === 'SUCCEEDED') {
                console.log(data)
                videoUrl = data.output.video_url;
            } else {
                if (status === 'FAILED') {
                    console.log(data)
                    throw new Error(data.output.message);
                }
                console.log("Generating")
                await new Promise((resolve) => setTimeout(resolve, 5000)); // 5秒后再次查询
            }
        }


        return videoUrl;
    };

    const templates = [
        { key: 'm_28_xingganyao_8s', label: '', videoUrl: '/images/dances/12.mp4' },
        { key: 'm_27_huajiangbu_v2_8s', label: '', videoUrl: '/images/dances/11.mp4' },
        { key: 'm_13_liuliangmima_8s', label: '', videoUrl: '/images/dances/6.mp4' },
        { key: 'm_25_tianmeiwu_8s', label: '', videoUrl: '/images/dances/10.mp4' },
        { key: 'm_02_jilejingtu_9s', label: '', videoUrl: '/images/dances/2.mp4' },
        { key: 'm_04_aini_v2_8s', label: '', videoUrl: '/images/dances/3.mp4' },
        { key: 'm_11_niuyangge_6s', label: '', videoUrl: '/images/dances/5.mp4' },
        { key: 'm_16_mengguwu_5s', label: '', videoUrl: '/images/dances/7.mp4' },
        { key: 'm_18_shexiangfuren_9s', label: '', videoUrl: '/images/dances/8.mp4' },
        { key: 'm_09_tuziwu_12s', label: '', videoUrl: '/images/dances/4.mp4' },
        { key: 'm_19_yebuwu_6s', label: '', videoUrl: '/images/dances/9.mp4' },
        { key: 'm_01_kemusan_v2_9s', label: '', videoUrl: '/images/dances/1.mp4' },
    ];


    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (pageRef.current) {
            pageRef.current.scrollTop = pageRef.current.scrollHeight;
        }
    }, [videoUrl]);

    return (
        <NextUIProvider>
            <Head>
                <title>Animation | Komiko</title>
            </Head>
            <Analytics />
            <main className="flex flex-col h-full caffelabs text-foreground bg-background">
                <Header />
                <div className="flex" >
                    <Sidebar />
                    <div className="p-4 pt-24 pb-20 w-full h-full md:pl-48 lg:pl-60 2xl:pl-80" ref={pageRef}>

                        <h1 className="mb-2 text-2xl font-bold">Let's Dance!</h1>
                        <div className="flex flex-col gap-2 justify-around md:flex-row md:gap-5">
                            <div className='min-w-[250px]'>
                                <div className="mb-1 text-lg">Upload Character Image</div>
                                <div className="mb-3 text-muted-foreground">Ensure the character faces forward with the upper body clearly visible.</div>
                                <Card className="p-3 bg-muted">
                                    <div className="flex justify-center items-center">
                                        <div className="bg-card">
                                            <SimpleImageUploader referenceImage={image} setReferenceImage={setImage} crop={true} height={200} width={113} setImageFile={setImageFile} />
                                        </div>
                                    </div>
                                </Card>
                            </div>


                            <div>
                                <div className="mb-1 text-lg">Pick A Dance</div>
                                <Card className="bg-muted">
                                    <div className="flex flex-wrap overflow-y-auto max-h-[240px] md:max-h-full gap-2 p-3 ">
                                        {templates.map(template => (
                                            <button
                                                key={template.key}
                                                className={`border-2 rounded ${selectedTemplate === template.key ? 'border-blue-500' : 'border-border'}`}
                                                onClick={() => setSelectedTemplate(template.key)}
                                            >
                                                <video
                                                    src={template.videoUrl}
                                                    className="max-h-[200px] max-w-[113px] object-cover"
                                                    onMouseEnter={e => e.currentTarget.play()}
                                                    onMouseLeave={e => e.currentTarget.pause()}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <div className=" min-w-[300px]">
                                <div className="flex items-center justify-center mt-2 md:mt-[2em] mb-4">
                                    <Button color="primary" onClick={handleGenerate} disabled={loading} isLoading={loading} className="w-[250px]" isDisabled={!image || !selectedTemplate}>
                                        {loading ? 'Animating...' : "Animate!"}
                                    </Button>
                                </div>

                                {error && <div color="error">{error}</div>}

                                {videoUrl && (
                                    <div className="flex justify-center items-center">
                                        <Card className='bg-card w-lg max-w-[300px]'>
                                            <video controls src={videoUrl} className="object-cover" />
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </NextUIProvider>
    );
};

export default Home;
