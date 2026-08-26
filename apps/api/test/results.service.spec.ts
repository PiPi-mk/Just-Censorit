import { describe, expect, it } from 'vitest';
import { ResultsService } from '../src/results/results.service';

describe('ResultsService', () => {
  it('approves majority result when agree count is greater than reject count', () => {
    const service = new ResultsService({} as any);

    const result = service.evaluate('majority', [
      { voteChoice: 'agree' },
      { voteChoice: 'agree' },
      { voteChoice: 'reject' },
    ] as any);

    expect(result).toEqual({ result: 'approved', agreeCount: 2, rejectCount: 1 });
  });
});
