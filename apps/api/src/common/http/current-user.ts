import { CurrentUserDto } from '../dto/current-user.dto';

type HeaderCarrier = {
  headers: Record<string, string | string[] | undefined>;
};

export function readCurrentUser(request: HeaderCarrier): CurrentUserDto {
  const headerValue = request.headers['x-user-id'];
  const userId = (Array.isArray(headerValue) ? headerValue[0] : headerValue)?.trim();

  return { userId: userId || 'demo-user' };
}
