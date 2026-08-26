export async function submitApproval(
  request: (url: string, method?: 'GET' | 'POST', data?: unknown) => Promise<any>,
  payload: Record<string, unknown>,
) {
  const created = await request('/approvals', 'POST', payload);
  return request(`/approvals/${created.id}/publish`, 'POST', {});
}
