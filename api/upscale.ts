import { client, Client } from "@gradio/client";
export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function dataURLToBlob(dataURL: string) {
    const [header, data] = dataURL.split(',');
    const contentType = header!.match(/:(.*?);/)![1];
    const byteCharacters = Buffer.from(data, 'base64');

    const blob = new Blob([byteCharacters], { type: contentType });
    return blob;
}


export async function POST(request: Request) {
    try {
        const { image } = await request.json();

        const app = await client("UpScendAI/R-Esrgan");
        const result: any = await app.predict("/predict", [
            await dataURLToBlob(image), 	// blob in 'parameter_0' Image component		
            "2x", // string  in 'Resolution model' Radio component
        ]);

        const imageUrl = result.data[0]["url"];

        return new Response(JSON.stringify(imageUrl), { status: 200 });
    } catch (error) {
        console.error('Error generating image:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate image' }), { status: 500 });
    }
}
