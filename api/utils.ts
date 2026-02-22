import { dataURLToBlob } from "./_utils";
export { dataURLToBlob }
// export async function dataURLToBlob(dataURL: string) {
//     const [header, data] = dataURL.split(',');
//     const contentType = header!.match(/:(.*?);/)![1];
//     const byteCharacters = Buffer.from(data, 'base64');

//     const blob = new Blob([byteCharacters], { type: contentType });
//     return blob;
// }

