import { updateSelectedGenes, loadGeneExpression, updateCellInfo } from '../../../redux/actions';
import * as types from '../../../redux/actions/actionType';
import connectionPromise from '../../../utils/socketConnection';

jest.mock('../../../utils/socketConnection');

const finished = new Promise(() => { });
const mockOn = jest.fn(async (x, f) => {
  const res = {
    results: [
      {
        body: JSON.stringify({
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
        }),
      },
    ],
  };
  f(res).then((result) => {
    finished.resolve(result);
  }).catch((e) => { console.log('****** ', e); finished.reject(e); });
});
const mockEmit = jest.fn();
const io = { emit: mockEmit, on: mockOn };
connectionPromise.mockImplementation(() => new Promise((resolve) => {
  resolve(io);
}));

let dispatch;

describe('updateSelectedGenes action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fires correctly with select gene', () => {
    const getState = () => ({
      selectedGenes: {},
      geneExperessionData: {},
    });
    updateSelectedGenes(['G1'], true)(dispatch, getState);
    expect(dispatch).toBeCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: true },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        genes: undefined,
        rendering: true,
      },
      type: types.UPDATE_HEATMAP_SPEC,
    });
  });
  it('Fires correctly with unselect gene', () => {
    const getState = () => ({
      selectedGenes: {
        geneList: {
          G1: true,
        },
      },
      geneExperessionData: {
        cells: ['C1', 'C2'],
        data: [
          {
            geneName: 'G1',
            expression: [1, 2],
          },
          {
            geneName: 'G2',
            expression: [1, 2],
          },
        ],
      },
    });
    updateSelectedGenes(['G1'], false)(dispatch, getState);
    expect(dispatch).toBeCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: false },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        genes: [{
          geneName: 'G2',
          expression: [1, 2],
        }],
        rendering: true,
      },
      type: types.UPDATE_HEATMAP_SPEC,
    });
  });
});

describe('loadGeneExpression action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fetch selected gene from API', async () => {
    const getState = () => ({
      selectedGenes: {
        geneList: {
          G1: false,
        },
        newGenesAdded: true,
      },
      geneExperessionData: { isLoading: false },
    });
    await loadGeneExpression('expId')(dispatch, getState);

    expect(dispatch).toBeCalledTimes(4);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: false },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        isLoading: true,
      },
      type: types.UPDATE_GENE_EXPRESSION,
    });
    expect(dispatch).toBeCalledWith({
      type: types.UPDATE_GENE_EXPRESSION,
      data: {
        heatMapData: {
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
        },
        isLoading: false,
      },
    });
    expect(dispatch).toBeCalledWith({
      type: types.BUILD_HEATMAP_SPEC,
      data: {
        geneExperessionData: {
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
        },
      },
    });
  });
});

describe('updateCellInfo action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fetch selected gene from API', () => {
    updateCellInfo({
      cellName: 'C1',
      geneName: 'G1',
      expression: 1,
    })(dispatch);

    expect(dispatch).toBeCalledTimes(1);
    expect(dispatch).toBeCalledWith({
      data: {
        cellName: 'C1',
        geneName: 'G1',
        expression: 1,
      },
      type: types.UPDATE_CELL_INFO,
    });
  });
});
