import { openDB } from 'idb';

const DB_NAME = 'imageCacheDB';
// const STORE_NAME = 'images';
const STORE_NAME = 'state';

// const initDB = async () => {
//   const db = await openDB(DB_NAME, 1, {
//     upgrade(db) {
//       db.createObjectStore(STORE_NAME);
//       // db.createObjectStore(STORE_NAME, { keyPath: 'id' });
//     },
//   });
//   return db;
// };

const dbPromise = openDB('app-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('state')) {
      db.createObjectStore('state'); // 创建对象存储 'state'
    }
  },
});

// const storeImage = async (id: string, image: HTMLImageElement) => {
//   const db = await initDB();
//   const imageData = await imageToBlob(image);
//   await db.put(STORE_NAME, { id, imageData });
// };

// const getImage = async (id: string): Promise<HTMLImageElement | null> => {
//   // console.log('getImage', id);
//   const db = await initDB();
//   const record = await db.get(STORE_NAME, id);
//   if (record) {
//     return blobToImage(record.imageData);
//   }
//   return null;
// };

export async function saveState(stateName: string, state: any) {
  const db = await dbPromise;
  await db.put('state', state, stateName);
}

export async function loadState(stateName: string) {
  const db = await dbPromise;
  return await db.get('state', stateName);
}

const imageToBlob = (image: HTMLImageElement): Promise<Blob> => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, 0, 0);
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
    });
  });
};

const blobToImage = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
  });
};

// export { storeImage, getImage };
