import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";


const credential = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
);
console.log(credential)
console.log(credential.project_id)

const authOptions = {
    credentials: {
        client_email: credential.client_email,
        private_key: credential.private_key.replace(/\\n/g, '\n'),
    },
}
const vertex_ai = new VertexAI({
    project: credential.project_id,
    location: 'us-central1',
    googleAuthOptions: authOptions,
});

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const model = "gemini-1.5-flash-001";

const generativeModel = vertex_ai.getGenerativeModel({ model, safetySettings: safetySettings });

export async function GET(request: Request) {

    const gemini_request = {
        contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
      };
      const result = await generativeModel.generateContent(gemini_request);
      const response = result.response;
      console.log('Response: ', JSON.stringify(response));

    return new Response(JSON.stringify(response));
}
