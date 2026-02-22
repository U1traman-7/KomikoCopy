export const uploadVideo = (form: FormData) =>
  fetch('/api/uploadVideo', {
    method: 'POST',
    body: form,
  })
    .then(res => res.json()) as Promise<{ data: string, code: number } & { error?: string }>

export const uploadImage = (form: FormData) =>
  fetch('/api/uploadImage', {
    method: 'POST',
    body: form,
  })
    .then(res => res.json()) as Promise<{ data: string, code: number } & { error?: string }>

