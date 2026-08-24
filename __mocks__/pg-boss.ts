const PgBoss = jest.fn().mockImplementation(() => ({
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue('mock-job-id'),
  work: jest.fn().mockResolvedValue('mock-worker-id'),
  createQueue: jest.fn().mockResolvedValue(undefined),
  schedule: jest.fn().mockResolvedValue(undefined),
  unschedule: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
}));

export default PgBoss;
