import getApiEndpoint from '../../../utils/apiEndpoint';
import loadCellSets from './loadCellSets';

import {
  CELL_SETS_LOADING, CELL_SETS_ERROR,
} from '../../actionTypes/cellSets';

const resetCellSets = (experimentId) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  await dispatch({
    type: CELL_SETS_LOADING,
  });

  await fetch(`${getApiEndpoint()}/v1/experiments/generate`, requestOptions)
    .then(
      async () => dispatch(loadCellSets(experimentId)),
    )
    .catch(() => {
      dispatch({
        type: CELL_SETS_ERROR,
        payload: {
          experimentId,
          error: "Couldn't reset cell sets to default.",
        },
      });
    });
};

export default resetCellSets;
