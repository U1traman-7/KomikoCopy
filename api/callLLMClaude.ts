import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';
import { GoogleAuth } from 'google-auth-library';

const credential = JSON.parse(process.env.GOOGLE_SERVICE_KEY!);

const model = 'claude-3-5-sonnet@20240620';

// Reads from the `CLOUD_ML_REGION` & `ANTHROPIC_VERTEX_PROJECT_ID` environment variables.
// Additionally goes through the standard `google-auth-library` flow.
const googleAuth = new GoogleAuth({
  credentials: {
    client_email: credential.client_email,
    private_key: credential.private_key.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

async function getClient() {
  return new AnthropicVertex({
    projectId: credential.project_id,
    region: 'us-east5',
    googleAuth,
  });
}

export async function POST(request: Request) {
  const { contents } = await request.json();
  const client = await getClient();

  const result = await client.messages.create({
    messages: contents,
    model,
    max_tokens: 8192,
  });
  const text = (result.content[0] as { text: string }).text.trim();
  return new Response(JSON.stringify({ text }));
}
