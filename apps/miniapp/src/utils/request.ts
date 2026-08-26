import Taro from '@tarojs/taro';
import { useSessionStore } from '../store/session';

const BASE_URL = 'http://localhost:3000/api';

function normalizeMessage(payload) {
  if (!payload) {
    return 'Request failed';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }

  return payload.message || 'Request failed';
}

export async function request(url, method = 'GET', data) {
  const userId = useSessionStore.getState().userId;
  const response = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
  });

  if (response.statusCode >= 400) {
    throw new Error(normalizeMessage(response.data));
  }

  return response.data;
}
