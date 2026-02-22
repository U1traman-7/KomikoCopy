// components/NavigateButtons.js
import { Button } from "@nextui-org/react";
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { FaTheaterMasks } from "react-icons/fa";
import { TbUniverse } from "react-icons/tb";
import { IoPlanetSharp } from "react-icons/io5";
const NavigateButtons = ({ children }: {
    children: ReactNode;
}) => {
    const router = useRouter();
    const currentPath = router.pathname;
    // console.log(currentPath);
    const explorePath = '/'
    const characterPath = '/character'

    return (
        <div className="flex flex-col md:flex-row flex-grow items-center h-screen">
            <div className="hidden md:block md:min-w-[200px] md:flex md:flex-col gap-2 md:ml-4 md:justify-start md:items-start">
                <Button variant="light" size="lg" className={`justify-start text-left text-semibold text-lg rounded-full w-full ${currentPath === explorePath ? 'bg-muted' : ''}`}
                    onClick={() => {
                        router.push(explorePath);
                    }}
                >
                    Explore
                </Button>
                <Button variant="light" size="lg" className={`justify-start text-left text-semibold text-lg rounded-full w-full ${currentPath.includes(characterPath) ? 'bg-muted' : ''}`}
                    onClick={() => {
                        router.push(characterPath+'/1');
                    }}>
                    Characters
                </Button>
            </div>
            {children}
            <div className="block md:hidden mt-auto p-4">
                <div className="flex flex-row gap-12 justify-center">
                    <div className={`flex flex-col items-center ${currentPath != explorePath ? 'text-muted-foreground' : ''}`}
                        onClick={() => {
                            router.push(explorePath);
                        }}>
                        <IoPlanetSharp className="w-6 h-6" />
                        <span className="text-xs">Explore</span>
                    </div>
                    <div className={`flex flex-col items-center ${!currentPath.includes(characterPath) ? 'text-muted-foreground' : ''}`}
                        onClick={() => {
                            router.push(characterPath + '/1');
                        }}>
                        <FaTheaterMasks className="w-6 h-6" />
                        <span className="text-xs">Characters</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigateButtons;
