import { Chip, NextUIProvider } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/react";
import { Button, Input, Image, Card, Radio, RadioGroup, Switch, Tabs, Tab, Textarea, Checkbox } from "@nextui-org/react";
import { useState } from "react";
import { useEffect, useRef } from 'react';
import { selectedImageAtom, characterGenderAtom, profileAtom } from '../../state';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { Header } from '../../Components/Header'
import { SimpleImageUploader } from '../../Components/ImageUploader';
import { Sidebar } from '../../Components/Sidebar';
import { BiSolidZap } from "react-icons/bi";
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from "uuid";
import { uploadImage } from '@/api/upload';
import { create as createWorld } from '@/api/world'

// 动态加载Canvas相关工具函数
const loadCanvasUtils = async () => {
  const { generateImageGetUrls, generateText } = await import('../../Components/InfCanva/utils');
  return { generateImageGetUrls, generateText };
};

export default function CreateWorld() {
    const { t } = useTranslation('world_create');
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [Intro, setIntro] = useState("");
    const [storyline, setStoryline] = useState("");
    const [criteria, setCriteria] = useState("");
    const [rule, setRule] = useState("");
    const [AiOptimize, setAiOptimize] = useState<boolean>(true);
    const [referenceImage, setReferenceImage] = useState<any>(null);
    const [imageFile, setImageFile] = useState<any>(null);
    // const [files, setFiles] = useState<any[]>([]);
    const [generatedCharacters, setGeneratedCharacters] = useState<string[]>([]);
    const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number>(-1);
    const [profile, setProfile] = useAtom(profileAtom);

    const cardRef = useRef<HTMLDivElement>(null);
    const [isCreating, setCreating] = useState<boolean>(false);

    //! FETCH PROFILE
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/fetchProfile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ method: 'profile' }),
                });
                console.log("calling fetch profile");

                const data = await response.json();
                setProfile({ ...data, authUserId: data.id });

            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    return (
        <NextUIProvider>
            <Head>
                <title>{t('pageTitle')}</title>
            </Head>
            <Analytics />
            <div><Toaster position="top-right" /></div>
            <main className="flex flex-col h-full caffelabs text-foreground bg-background">
                <Header />
                <div className="flex">
                    <Sidebar />
                    <div className="pt-24 w-full h-full md:pl-56 lg:pl-[240px] ml-5">


                        <div className="flex flex-col justify-center items-center w-full h-full bg-top bg-cover"
                            style={{ height: 'calc(100vh - 10rem)' }}
                        >
                            <div className="p-4 h-full w-lg w-[400px] sm:w-[500px] md:w-[600px] overflow-y-auto flex flex-col justify-center items-center bg-transparent">

                                {/* // Create CARD */}
                                <Card className="overflow-y-auto p-4 w-full bg-card bg-opacity-90 rounded-lg">
                                    <h1 className="mb-2 text-2xl font-bold">{t('createWorld')}</h1>
                                    <div className="flex flex-col items-center">

                                        <div className="flex gap-5 w-full space-between">
                                            <div className="flex-1">
                                                <p className="mb-2 text-sm text-left">{t('coverImage')}</p>
                                                <p className="text-sm text-muted-foreground">{t('uploadCoverImage')}</p>
                                            </div>
                                            <SimpleImageUploader referenceImage={referenceImage} setReferenceImage={setReferenceImage} setImageFile={setImageFile} />
                                        </div>
                                        <Input
                                            size="lg"
                                            label={<span><span className="text-lg text-red-500">*</span>{` ${t('worldName')}`}</span>} labelPlacement="outside" placeholder={t('worldName')} value={title} onChange={(e) => { setTitle(e.target.value) }} />
                                        <Textarea
                                            label={<span><span className="text-lg text-red-500">*</span>{` ${t('introduction', { length: Intro.length })}`}</span>}
                                            placeholder={t('introductionPlaceholder')}
                                            labelPlacement="outside"
                                            className="mt-2 w-full"
                                            size="lg"
                                            maxLength={250}
                                            minRows={3}
                                            value={Intro}
                                            onChange={(e) => { setIntro(e.target.value) }}
                                        />
                                        <Textarea
                                            label={<span><span className="text-lg text-red-500">*</span>{` ${t('storyline', { length: storyline.length })}`}</span>}
                                            placeholder={t('storylinePlaceholder')}
                                            labelPlacement="outside"
                                            className="mt-2 w-full"
                                            size="lg"
                                            maxLength={5000}
                                            minRows={3}
                                            value={storyline}
                                            onChange={(e) => { setStoryline(e.target.value) }}
                                        />
                                        <Textarea
                                            label={t('winningCondition', { length: criteria.length })}
                                            placeholder={t('winningConditionPlaceholder')}
                                            labelPlacement="outside"
                                            className="mt-2 w-full"
                                            size="lg"
                                            maxLength={250}
                                            minRows={1}
                                            value={criteria}
                                            onChange={(e) => { setCriteria(e.target.value) }}
                                        />
                                        <Textarea
                                            label={t('rules', { length: rule.length })}
                                            placeholder={t('rulesPlaceholder')}
                                            labelPlacement="outside"
                                            className="mt-2 w-full"
                                            size="lg"
                                            maxLength={5000}
                                            minRows={3}
                                            value={rule}
                                            onChange={(e) => { setRule(e.target.value) }}
                                        />


                                    </div>
                                </Card>
                                <div className="flex gap-2 w-full">
                                    <Button className="mt-3 w-full" color={generatedCharacters.length > 0 ? "secondary" : "primary"} size="lg"
                                        isLoading={isCreating}
                                        onClick={async () => {
                                            try {
                                                mixpanel.track('create.world', {
                                                    title: title, description: Intro, story: storyline, criteria: criteria, rule: rule
                                                });
                                            } catch (error) { }
                                            if (!title) {
                                                toast.error(t('errorWorldName'))
                                                return
                                            }
                                            if (!Intro) {
                                                toast.error(t('errorIntroduction'))
                                                return
                                            }
                                            if (!storyline) {
                                                toast.error(t('errorStoryline'))
                                                return
                                            }
                                            if (!imageFile) {
                                                toast.error(t('errorCoverImage'));
                                                return
                                            }
                                            setCreating(true);
                                            const prompt = `Determine whether the following roleplay scenario is NSFW.
Roleplay scenario:
Title: ${title}
Introduction: ${Intro}
Storyline: ${storyline}

Return "true" if the roleplay scenario is NSFW, and "false" if it is not. Just return "true" or "false", no other text or explanation.`;
                                            const { generateText } = await loadCanvasUtils();
                                            const NSFW = await generateText(prompt, undefined, t);
                                            if (!NSFW || NSFW.includes("true")) {
                                                toast.error(t('errorNSFW'));
                                                setCreating(false);
                                                return;
                                            }
                                            const imagePath = `/worlds/cover/${uuidv4()}${imageFile.name}`
                                            const form = new FormData();
                                            form.append('imagePath', imagePath);
                                            form.append('file', imageFile);
                                            // const result = await supabase.storage.from("husbando-land").upload(imagePath, imageFile);
                                            const result = await uploadImage(form).catch();
                                            let imageUrl = ""
                                            if (result && !result.error) {
                                                imageUrl = result.data;
                                            }
                                            const worldResult = await createWorld({
                                                title,
                                                description: Intro,
                                                story: storyline,
                                                criteria: criteria,
                                                rule: rule,
                                                cover: imageUrl,
                                            }).catch();
                                            if (worldResult.error) {
                                                toast.error('Error creating world')
                                                setCreating(false);
                                                return
                                            } else {
                                                router.push(`/world?character_id=`)
                                            }
                                        }}
                                    >
                                        {t('createWorldButton')}
                                    </Button>

                                </div>
                                <div className="mt-3 text-sm text-muted-foreground">
                                    {t('pleaseNote')} <b>{t('nsfwWarning')}</b>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </main >
        </NextUIProvider >
    );
}

