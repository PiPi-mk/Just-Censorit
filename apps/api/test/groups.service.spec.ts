import { describe, expect, it, vi } from 'vitest';
import { GroupsService } from '../src/groups/groups.service';

describe('GroupsService', () => {
  it('creates a group and inserts owner membership', async () => {
    const prisma = {
      user: { upsert: vi.fn().mockResolvedValue({ id: 'u1' }) },
      group: { create: vi.fn().mockResolvedValue({ id: 'g1', name: '宿舍群' }) },
      groupMember: { create: vi.fn().mockResolvedValue({ id: 'm1' }) },
    } as any;

    const service = new GroupsService(prisma);
    const result = await service.createGroup({ userId: 'u1' }, { name: '宿舍群' });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
      }),
    );
    expect(result.id).toBe('g1');
    expect(prisma.groupMember.create).toHaveBeenCalled();
  });
});
