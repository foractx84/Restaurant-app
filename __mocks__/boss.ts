const mockBoss = {
  send: jest.fn().mockResolvedValue('mock-job-id'),
  work: jest.fn().mockResolvedValue('mock-worker-id'),
  createQueue: jest.fn().mockResolvedValue(undefined),
  schedule: jest.fn().mockResolvedValue(undefined),
  unschedule: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

export const startBoss = jest.fn().mockResolvedValue(mockBoss);
export const getBoss = jest.fn().mockReturnValue(mockBoss);
