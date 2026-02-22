export const post = async <T = any>(url: string, data: any) => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json() as Promise<T>;
};

export const get = async <T = any>(
  url: string,
  params?: Record<string, string | undefined>,
) => {
  // Filter out undefined values to avoid "undefined" string in URL
  const filteredParams = params
    ? (Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      ) as Record<string, string>)
    : undefined;
  const queryParams = new URLSearchParams(filteredParams);
  const queryString = queryParams.toString();
  const finalUrl = queryString ? `${url}?${queryString}` : url;
  const response = await fetch(finalUrl);
  return response.json() as Promise<T>;
};
