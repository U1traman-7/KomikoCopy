import { describe, expect, it } from 'bun:test';
import { verifyReplicateSignature, handler } from '../webhook';
/**
headers Headers {
  'webhook-signature': 'v1,tnQTw9ujWvEj9tw6AS3F3XJPszKm3I3PhW6hX7c5Kvk=',
  'x-vercel-proxy-signature': 'Bearer cf5a057c7c09b7e79d476d1d109c8fff3871e343d0ce09eca1ddcaa7e72a85a7',
  'x-vercel-ip-latitude': '45.8401',
  'access-control-allow-methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'x-vercel-ja4-digest': 't13d311100_e8f1e7e78f70_d41ae481755e',
  'access-control-allow-credentials': 'true',
  forwarded: 'for=44.228.126.217;host=komiko-app-git-feat-webhook-komiko.vercel.app;proto=https;sig=0QmVhcmVyIGNmNWEwNTdjN2MwOWI3ZTc5ZDQ3NmQxZDEwOWM4ZmZmMzg3MWUzNDNkMGNlMDllY2ExZGRjYWE3ZTcyYTg1YTc=;exp=1749453042',
  'x-vercel-forwarded-for': '44.228.126.217',
  'x-forwarded-host': 'komiko-app-git-feat-webhook-komiko.vercel.app',
  'accept-encoding': 'gzip',
  'content-length': '1500',
  'x-matched-path': '/api/generation/webhook',
  'x-vercel-internal-bot-check': 'pass',
  'x-vercel-ip-postal-code': '97818',
  'access-control-allow-origin': '*',
  'x-vercel-oidc-token': 'eyJraWQiOiJtcmstNDMwMmVjMWI2NzBmNDhhOThhZDYxZGFkZTRhMjNiZTciLCJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3NDk0NTA0NzYsIm93bmVyX2lkIjoidGVhbV80NWcwcWdETFFIWHhOSU9FRGtFVkhZU2kiLCJpYXQiOjE3NDk0NTA0NzYsInZlcmNlbF9pZCI6InBkeDE6Ojk2bWd2LTE3NDk0NTA0NzY0NjgtOGU5NGNmOGNmMDBjIiwiYXVkIjoiaHR0cHM6XC9cL3ZlcmNlbC5jb21cL2tvbWlrbyIsIm93bmVyIjoia29taWtvIiwiaXNzIjoiaHR0cHM6XC9cL29pZGMudmVyY2VsLmNvbVwva29taWtvIiwicHJvamVjdF9pZCI6InByal9vMTIzSGdnV3NPNXRmSGtybE5uS0g1YzVuV2lCIiwiZXhwIjoxNzQ5NDU0MDc2LCJlbnZpcm9ubWVudCI6InByZXZpZXciLCJzY29wZSI6Im93bmVyOmtvbWlrbzpwcm9qZWN0OmtvbWlrby1hcHA6ZW52aXJvbm1lbnQ6cHJldmlldyIsInN1YiI6Im93bmVyOmtvbWlrbzpwcm9qZWN0OmtvbWlrby1hcHA6ZW52aXJvbm1lbnQ6cHJldmlldyIsInByb2plY3QiOiJrb21pa28tYXBwIn0.OV9P6X4oZFeQ1RIRLvjPiK5g2JuwhVxAZsTfYADEbzPwEmfPYFTzr-iNsyOdqf4XRknC2WpZKdzmT1DDufNehpP2b-4MNG_jJfpOxtDNZWgFvk6MwJjuBNOziPL6qvB0Xrr2558iYzggHKaQ225hPvemUgxpdyQnP_mi28ELCM9xafFQYcNT_BV_nv6UWP7WXTZXITYaHf1ZP5tNYv4qAY-NPXvsiZUzww5hNYa_itAxYxxBgxJPArsEhzKcIcsfU1oMZvR_8iuyyaPkgjY_2rKGjuWk36ySTi8p0d9WiepEST2Sw7SWVYZzoDcWLIq0V_8fb6tw40tQE72cnV1YWg',
  'x-vercel-ip-country': 'US',
  'x-forwarded-for': '44.228.126.217',
  'access-control-allow-headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, next-router-state-tree, next-router-prefetch, next-url, rsc',
  'x-vercel-proxied-for': '44.228.126.217',
  'x-vercel-internal-ingress-bucket': 'bucket017',
  'x-vercel-ip-continent': 'NA',
  'x-vercel-deployment-url': 'komiko-9qz7ozmfo-komiko.vercel.app',
  'webhook-timestamp': '1749452742',
  'content-type': 'application/json',
  'x-vercel-ip-as-number': '16509',
  'webhook-id': 'msg_2yGEvjbj5JfrCSTduf2IL4TZgFz',
  host: 'komiko-app-git-feat-webhook-komiko.vercel.app',
  'x-vercel-id': 'pdx1::fs86k-1749452742088-49d780df321c',
  'x-vercel-ip-country-region': 'OR',
  'x-vercel-ip-longitude': '-119.705',
  'x-forwarded-proto': 'https',
  'x-vercel-ip-timezone': 'America/Los_Angeles',
  'user-agent': 'Webhooks/1.66.0 (sender-9YMgn)',
  'x-real-ip': '44.228.126.217',
  'x-vercel-ip-city': 'Boardman',
  'x-vercel-proxy-signature-ts': '1749453042',
  connection: 'close'
}

body {"completed_at":"2025-06-09T07:05:41.882143865Z","created_at":"2025-06-09T07:02:34.263Z","data_removed":false,"error":null,"id":"ype2b3w02xrme0cqadzrms82nm","input":{"first_frame_image":"https://replicate.delivery/pbxt/M9jlcXgeaypBr2yQYGf9JXgxUCJWRt8ODUDvt90UWPUsQBXC/back-to-the-future.png","prompt":"1 girl is dancing"},"logs":"Moderating content...\nModerating content...\nImage size: 10.8KB\nModeration complete in 0.15sec\nModeration complete in 0.85sec\nInitializing video generation with prompt: 1 girl is dancing\nUsing model: video-01-live2d\nImage size: 88.3KB\nGenerating video...\nStill generating...\nStill generating...\nStill generating...\nStill generating...\nStill generating...\nGenerated video in 184.2sec\nRetrieving video...\nDownloading 1176164 bytes\nDownloaded 1.12MB in 2.43sec\n","metrics":{"predict_time":187.61184026},"model":"minimax/video-01-live","output":"https://replicate.delivery/xezq/ufCdYu2z4JQUbabg6wwH5Dd3dTeQhdKJ0ydMGiPefPJWcOUTB/tmpuumvokey.mp4","started_at":"2025-06-09T07:02:34.270303608Z","status":"succeeded","urls":{"cancel":"https://api.replicate.com/v1/predictions/ype2b3w02xrme0cqadzrms82nm/cancel","get":"https://api.replicate.com/v1/predictions/ype2b3w02xrme0cqadzrms82nm","stream":"https://stream.replicate.com/v1/files/bcwr-qkzuwyy6ybbxpmv2cq5mcnbob5xagcck5kghionhjbdcl5pcldfq","web":"https://replicate.com/p/ype2b3w02xrme0cqadzrms82nm"},"version":"hidden","webhook":"https://komiko-app-git-feat-webhook-komiko.vercel.app/api/generation/webhook"}
 */

const mockRequest = async () => {
  const request = new Request('http://localhost:3000/api/generation/webhook', {
    method: 'POST',
    headers: {
      'x-vercel-proxy-signature':
        'Bearer cf5a057c7c09b7e79d476d1d109c8fff3871e343d0ce09eca1ddcaa7e72a85a7',
      'x-vercel-ip-latitude': '45.8401',
      'access-control-allow-methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'x-vercel-ja4-digest': 't13d311100_e8f1e7e78f70_d41ae481755e',
      'access-control-allow-credentials': 'true',
      forwarded:
        'for=44.228.126.217;host=komiko-app-git-feat-webhook-komiko.vercel.app;proto=https;sig=0QmVhcmVyIGNmNWEwNTdjN2MwOWI3ZTc5ZDQ3NmQxZDEwOWM4ZmZmMzg3MWUzNDNkMGNlMDllY2ExZGRjYWE3ZTcyYTg1YTc=;exp=1749453042',
      'x-vercel-forwarded-for': '44.228.126.217',
      'x-forwarded-host': 'komiko-app-git-feat-webhook-komiko.vercel.app',
      'accept-encoding': 'gzip',
      'content-length': '1500',
      'x-matched-path': '/api/generation/webhook',
      'x-vercel-internal-bot-check': 'pass',
      'x-vercel-ip-postal-code': '97818',
      'access-control-allow-origin': '*',
      'x-vercel-oidc-token':
        'eyJraWQiOiJtcmstNDMwMmVjMWI2NzBmNDhhOThhZDYxZGFkZTRhMjNiZTciLCJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3NDk0NTA0NzYsIm93bmVyX2lkIjoidGVhbV80NWcwcWdETFFIWHhOSU9FRGtFVkhZU2kiLCJpYXQiOjE3NDk0NTA0NzYsInZlcmNlbF9pZCI6InBkeDE6Ojk2bWd2LTE3NDk0NTA0NzY0NjgtOGU5NGNmOGNmMDBjIiwiYXVkIjoiaHR0cHM6XC9cL3ZlcmNlbC5jb21cL2tvbWlrbyIsIm93bmVyIjoia29taWtvIiwiaXNzIjoiaHR0cHM6XC9cL29pZGMudmVyY2VsLmNvbVwva29taWtvIiwicHJvamVjdF9pZCI6InByal9vMTIzSGdnV3NPNXRmSGtybE5uS0g1YzVuV2lCIiwiZXhwIjoxNzQ5NDU0MDc2LCJlbnZpcm9ubWVudCI6InByZXZpZXciLCJzY29wZSI6Im93bmVyOmtvbWlrbzpwcm9qZWN0OmtvbWlrby1hcHA6ZW52aXJvbm1lbnQ6cHJldmlldyIsInN1YiI6Im93bmVyOmtvbWlrbzpwcm9qZWN0OmtvbWlrby1hcHA6ZW52aXJvbm1lbnQ6cHJldmlldyIsInByb2plY3QiOiJrb21pa28tYXBwIn0.OV9P6X4oZFeQ1RIRLvjPiK5g2JuwhVxAZsTfYADEbzPwEmfPYFTzr-iNsyOdqf4XRknC2WpZKdzmT1DDufNehpP2b-4MNG_jJfpOxtDNZWgFvk6MwJjuBNOziPL6qvB0Xrr2558iYzggHKaQ225hPvemUgxpdyQnP_mi28ELCM9xafFQYcNT_BV_nv6UWP7WXTZXITYaHf1ZP5tNYv4qAY-NPXvsiZUzww5hNYa_itAxYxxBgxJPArsEhzKcIcsfU1oMZvR_8iuyyaPkgjY_2rKGjuWk36ySTi8p0d9WiepEST2Sw7SWVYZzoDcWLIq0V_8fb6tw40tQE72cnV1YWg',
      'x-vercel-ip-country': 'US',
      'x-forwarded-for': '44.228.126.217',
      'access-control-allow-headers':
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, next-router-state-tree, next-router-prefetch, next-url, rsc',
      'x-vercel-proxied-for': '44.228.126.217',
      'x-vercel-internal-ingress-bucket': 'bucket017',
      'x-vercel-ip-continent': 'NA',
      'x-vercel-deployment-url': 'komiko-9qz7ozmfo-komiko.vercel.app',
      'webhook-timestamp': '1749452742',
      'content-type': 'application/json',
      'x-vercel-ip-as-number': '16509',
      'webhook-id': 'msg_2yGEvjbj5JfrCSTduf2IL4TZgFz',
      host: 'komiko-app-git-feat-webhook-komiko.vercel.app',
      'x-vercel-id': 'pdx1::fs86k-1749452742088-49d780df321c',
      'x-vercel-ip-country-region': 'OR',
      'x-vercel-ip-longitude': '-119.705',
      'x-forwarded-proto': 'https',
      'x-vercel-ip-timezone': 'America/Los_Angeles',
      'user-agent': 'Webhooks/1.66.0 (sender-9YMgn)',
      'x-real-ip': '44.228.126.217',
      'x-vercel-ip-city': 'Boardman',
      'x-vercel-proxy-signature-ts': '1749453042',
      connection: 'close',
    },
    body: JSON.stringify({
      id: 'cgt-20250917142952-jx2kr',
      model: 'doubao-seedance-1-0-pro-250528',
      status: 'succeeded',
      content: {
        video_url:
          'https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-1-0-pro/02175809059239200000000000000000000ffffac158dd8b93bfa.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20250917%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20250917T063100Z&X-Tos-Expires=86400&X-Tos-Signature=dfda00bc9fcb92123870153b65e140ca43fc0793581ae3e9a4602e63e54b35cd&X-Tos-SignedHeaders=host',
      },
      usage: {
        completion_tokens: 49005,
        total_tokens: 49005,
      },
      created_at: 1758090592,
      updated_at: 1758090676,
      seed: 86788,
      resolution: '480p',
      duration: 5,
      ratio: '16:9',
      framespersecond: 24,
    }),
  });

  // const mockWebhook = await fetch(request);
  const mockWebhook = await handler(request);

  console.log(await mockWebhook.text());
};

// describe('webhook', () => {
//   it('verifyReplicateSignature', async () => {
//     const webhookId = 'msg_2yGEvjbj5JfrCSTduf2IL4TZgFz'
//     const webhookTimestamp = '1749452742'
//     const webhookSignatures = 'v1,tnQTw9ujWvEj9tw6AS3F3XJPszKm3I3PhW6hX7c5Kvk='
//     const body = '{"completed_at":"2025-06-09T07:05:41.882143865Z","created_at":"2025-06-09T07:02:34.263Z","data_removed":false,"error":null,"id":"ype2b3w02xrme0cqadzrms82nm","input":{"first_frame_image":"https://replicate.delivery/pbxt/M9jlcXgeaypBr2yQYGf9JXgxUCJWRt8ODUDvt90UWPUsQBXC/back-to-the-future.png","prompt":"1 girl is dancing"},"logs":"Moderating content...\nModerating content...\nImage size: 10.8KB\nModeration complete in 0.15sec\nModeration complete in 0.85sec\nInitializing video generation with prompt: 1 girl is dancing\nUsing model: video-01-live2d\nImage size: 88.3KB\nGenerating video...\nStill generating...\nStill generating...\nStill generating...\nStill generating...\nStill generating...\nGenerated video in 184.2sec\nRetrieving video...\nDownloading 1176164 bytes\nDownloaded 1.12MB in 2.43sec\n","metrics":{"predict_time":187.61184026},"model":"minimax/video-01-live","output":"https://replicate.delivery/xezq/ufCdYu2z4JQUbabg6wwH5Dd3dTeQhdKJ0ydMGiPefPJWcOUTB/tmpuumvokey.mp4","started_at":"2025-06-09T07:02:34.270303608Z","status":"succeeded","urls":{"cancel":"https://api.replicate.com/v1/predictions/ype2b3w02xrme0cqadzrms82nm/cancel","get":"https://api.replicate.com/v1/predictions/ype2b3w02xrme0cqadzrms82nm","stream":"https://stream.replicate.com/v1/files/bcwr-qkzuwyy6ybbxpmv2cq5mcnbob5xagcck5kghionhjbdcl5pcldfq","web":"https://replicate.com/p/ype2b3w02xrme0cqadzrms82nm"},"version":"hidden","webhook":"https://komiko-app-git-feat-webhook-komiko.vercel.app/api/generation/webhook"}'
//     const result = await verifyReplicateSignature(
//       webhookId,
//       webhookTimestamp,
//       webhookSignatures,
//       body
//     )
//     // console.log(result)
//     expect(result).toBe(true)
//   });
// })

mockRequest();
