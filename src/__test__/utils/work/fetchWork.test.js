/* eslint-disable global-require */
import { fetchWork } from '../../../utils/work/fetchWork';
import '__test__/test-utils/setupTests';

const {
  mockData, mockCacheKeyMappings, mockCacheGet, mockCacheSet, mockSeekFromAPI, mockReduxState,
} = require('./fetchWork.mock');

jest.mock('../../../utils/cache', () => require('./fetchWork.mock').mockCacheModule);
jest.mock('../../../utils/work/seekWorkResponse', () => require('./fetchWork.mock').mockSeekWorkResponseModule);

describe('fetchWork', () => {
  const experimentId = '1234';
  const GENE_EXPRESSION_ETAG = '34c05c9d07fd24ce0c22d2bec7fd7437'; // pragma: allowlist secret

  const workRequest = {
    name: 'GeneExpression',
    genes: ['A', 'B', 'C', 'D'],
  };

  beforeEach(() => {
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('runs correctly', async () => {
    const res = await fetchWork(
      experimentId,
      workRequest,
      mockReduxState(experimentId),
      { timeout: 10 },
    );

    expect(mockSeekFromAPI).toHaveBeenCalledWith(experimentId, { name: 'GeneExpression', genes: ['D'] }, 10, expect.anything());
    expect(mockCacheGet).toHaveBeenCalledTimes(4);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledWith(mockCacheKeyMappings.D, mockData.D);
    expect(res).toEqual({ D: mockData.D });
  });

  it('does not change ETag if caching is enabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? false : null));

    await fetchWork(
      experimentId,
      workRequest,
      mockReduxState(experimentId),
      { timeout: 10 },
    );

    expect(mockSeekFromAPI).toHaveBeenCalledWith(
      expect.anything(), expect.anything(), expect.anything(), GENE_EXPRESSION_ETAG,
    );
  });

  it('changes ETag if caching is disabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'true' : null));

    await fetchWork(
      experimentId,
      {
        name: 'GeneExpression',
        genes: ['A', 'B', 'C', 'D'],
      },
      mockReduxState(experimentId),
      { timeout: 10 },
    );

    expect(mockSeekFromAPI).not.toHaveBeenCalledWith(
      expect.anything(), expect.anything(), expect.anything(), GENE_EXPRESSION_ETAG,
    );
  });

  it('Generates random ETag if environment is not Production and cache is disabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'true' : null));

    const mockRandom = jest.fn();
    global.Math.random = mockRandom;

    await fetchWork(
      experimentId,
      workRequest,
      mockReduxState(experimentId),
      { timeout: 10 },
    );

    expect(mockRandom).toHaveBeenCalledTimes(1);
    expect(mockSeekFromAPI).not.toHaveBeenCalledWith(
      expect.anything(), expect.anything(), expect.anything(), GENE_EXPRESSION_ETAG,
    );
  });
});
