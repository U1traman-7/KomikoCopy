import { useEffect, useState } from 'react';

const useIsMobileSafari = () => {
    const [isMobileSafari, setIsMobileSafari] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const userAgent = navigator.userAgent || navigator.vendor;
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        const isMobile = /iPhone|iPod|iPad/.test(userAgent);
        setIsMobileSafari(isSafari && isMobile);
        console.log(userAgent, isSafari, isMobile, isMobileSafari);
    }, []);

    return isMobileSafari;
};

export default useIsMobileSafari;