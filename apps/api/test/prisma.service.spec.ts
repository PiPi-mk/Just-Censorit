import { describe, expect, it, vi, afterEach } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service';

describe('PrismaService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers shutdown hook on process instead of prisma beforeExit hook', async () => {
    const service = Object.create(PrismaService.prototype) as PrismaService & {
      $on: ReturnType<typeof vi.fn>;
    };
    service.$on = vi.fn();

    const app = {
      close: vi.fn().mockResolvedValue(undefined),
    } as any;

    const processOnceSpy = vi.spyOn(process, 'once');

    await service.enableShutdownHooks(app);

    expect(service.$on).not.toHaveBeenCalled();
    expect(processOnceSpy).toHaveBeenCalledWith('beforeExit', expect.any(Function));

    const handler = processOnceSpy.mock.calls[0]?.[1];
    expect(handler).toBeTypeOf('function');

    await handler?.();
    expect(app.close).toHaveBeenCalledTimes(1);
  });
});
