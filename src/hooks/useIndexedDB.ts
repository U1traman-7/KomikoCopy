import { useEffect, useState } from 'react';
import { openDB } from 'idb';

export function useIndexedDB() {
    const [db, setDb] = useState<any>(null);

    useEffect(() => {
        async function initDB() {
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
                const dbInstance = await openDB('app-db', 1, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains('state')) {
                            db.createObjectStore('state');
                        }
                    },
                });
                setDb(dbInstance);
            }
        }

        initDB();
    }, []);

    return db;
}