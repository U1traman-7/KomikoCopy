import { useRouter } from 'next/router';
import { memo, useState } from "react";
import { Button } from "@nextui-org/react";
import { Card, CardBody, Image } from "@nextui-org/react";
import dynamic from 'next/dynamic';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import useInfiniteScroll from "../../Components/Feed/useInfiniteScroll"; // adjust the path as necessary
import { Character } from '../../pages/leaderboard/index'

// Dynamically import Image component with no SSR
const DynamicImage = dynamic(() => import("@nextui-org/react").then(mod => mod.Image), { ssr: false });

const tags = ["All Time", "Monthly", "Weekly"];

function formatRelativeTime(timestamp: string) {
    const date = parseISO(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
}

function CharacterLeaderboard({ characters }: { characters: Character[] }) {
    const router = useRouter();
    const { t } = useTranslation('common');

    const [list, setList] = useState<Character[]>(characters ?? []);
    const [page, setPage] = useState(list.length ? 2 : 1);
    const [selectedTag, setSelectedTag] = useState<string>(tags[0]);

    const fetchMoreData = async (isInitial = false) => {
        const newPage = isInitial ? 1 : page;
        setPage((prev) => prev + 1);
        const newData = await fetch(`/api/fetchLeaderboard?page=${newPage}&sortby=${selectedTag}&board=character`).then((res) => res.json());
        // console.log(`/api/fetchLeaderboard?page=${newPage}&sortby=${selectedTag}&board=character`);
        // console.log(newData);
        if (Array.isArray(newData)) {
            setList((prev) => (isInitial ? newData : [...prev, ...newData]));
        } else {
            console.log("fetched invalid data");
        }
    };

    const [lastElementRef, isFetching] = useInfiniteScroll(() => fetchMoreData(false));


    return (
        <>
            {/*
            //! CHARACTER FEED
            */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                {list.map((item, index) => (
                    <div key={index} className="items-center">
                        <Card className="bg-card items-center w-full shadow-none">
                            <CardBody className="flex flex-row justify-between items-center p-0">
                                <div className="flex flex-row h-full">
                                  <a href={`/character/${item.character_uniqid}`}>
                                    <Image
                                        width="100%"
                                        alt={item.character_name}
                                        className="object-cover w-20 h-20 rounded-full cursor-pointer"
                                        src={item.character_pfp}
                                    />
                                  </a>
                                    <div className="flex flex-col justify-center pl-6 h-20 text-lg">
                                    <p className="cursor-pointer" onClick={() => {router.push(`/character/${item.character_uniqid}`);}}>{ item.character_name }</p>
                                        <p className="text-default-500 text-md">{t('popularity', { count: item.num_gen })}</p>
                                    </div>
                                </div>
                                <div>
                                  <a href={`/world?character_id=${item.character_uniqid}`}>

                                    <Button
                                        color="primary"
                                        variant="solid"
                                        radius="full"
                                        size="md"
                                        className="px-8 capitalize bg-primary-300"
                                    >
                                        {t('roleplay')}
                                    </Button>
                                  </a>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                ))}
                <div ref={lastElementRef} style={{ height: 20 }} className="mt-40 w-full"></div>
            </div>

        </>
    );
}

export default memo(CharacterLeaderboard);
