import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { createSupabase } from "./_utils/index.js";
import { parse } from "cookie";
import { decode } from "next-auth/jwt";

type Ranking = "F" | "B" | "A" | "S" | "SS" | "SSS";
const rankingZaps: { [key in Ranking]: number } = {
  "F": 0,
  "B": 10,
  "A": 20,
  "S": 30,
  "SS": 40,
  "SSS": 50
};

const credential = JSON.parse(
  process.env.GOOGLE_SERVICE_KEY!
);

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
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const model = "gemini-1.5-flash-001";

const generativeModel = vertex_ai.getGenerativeModel({ model, safetySettings: safetySettings, generationConfig: { responseMimeType: "application/json" } });
export async function POST(request: Request) {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Log in to generate images' }), { status: 401 });
  }
  const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! })
  if (!token) {
    return new Response(JSON.stringify({ error: 'Invalid login status' }), { status: 401 });
  }
  const userId = token.id
  const { contents } = await request.json();

  const gemini_request = {
    contents: contents,
  };
  const result = await generativeModel.generateContent(gemini_request);
  const text = result.response.candidates?.[0]?.content.parts[0]?.text?.trim();
  try {
    const outputJSON = JSON.parse(text!);
    const supabase = createSupabase();
    if (outputJSON.story_ends) { // Update credit and world num players
      const { data: creditData, error: error } = await supabase.from('User').select('credit').eq("id", userId).single();
      if (error) {
        console.error('Error fetching credit:', error.message);
      }
      const ranking = outputJSON.ranking as Ranking;
      await supabase.from('User').update({ credit: creditData?.credit + rankingZaps[ranking] }).eq("id", userId);
    }
  } catch (e) { }
  return new Response(JSON.stringify({ text: text }));
}
