import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import DiffExprManager from '../../../../components/data-exploration/differential-expression-tool/DiffExprManager';
import DiffExprCompute from '../../../../components/data-exploration/differential-expression-tool/DiffExprCompute';
import DiffExprResults from '../../../../components/data-exploration/differential-expression-tool/DiffExprResults';
import initialState from '../../../../redux/reducers/differentialExpression/initialState';
import genesInitialState from '../../../../redux/reducers/genes/initialState';
import cellSetsInitialState from '../../../../redux/reducers/cellSets/initialState';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);

const emptyState = {
  differentialExpression: { ...initialState },
  cellSets: {
    ...cellSetsInitialState,
    hierarchy: [],
    properties: {},
  },
  genes: {
    ...genesInitialState,
    focused: undefined,
  },
};

const filledState = {
  ...emptyState,
  differentialExpression: {
    ...emptyState.differentialExpression,
    comparison: {
      ...emptyState.differentialExpression.comparison,
      type: 'between',
      group: {
        ...emptyState.differentialExpression.comparison.group,
        between: {
          ...emptyState.differentialExpression.comparison.group.between,
          cellSet: 'condition/condition-treated',
          compareWith: 'condition/condition-control',
          basis: 'louvain/cluster-a;',
        },
      },
    },
  },
};

const emptyStore = mockStore(emptyState);
const filledStore = mockStore(filledState);

describe('DiffExprManager', () => {
  it('renders correctly a compute view', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <DiffExprManager experimentId='1234' view='compute' width={100} height={200} />
      </Provider>,
    );
    expect(component.find(DiffExprCompute).length).toEqual(1);
  });

  it('on click of compute with changed parameters, DiffExprManager calls the results view', () => {
    const component = mount(
      <Provider store={filledStore}>
        <DiffExprManager experimentId='1234' view='compute' width={100} height={200} />
      </Provider>,
    );

    expect(component.find(DiffExprResults).length).toEqual(0);
    expect(component.find(DiffExprCompute).length).toEqual(1);

    act(() => {
      component.find(DiffExprCompute).props().onCompute();
    });
    component.update();

    const results = component.find(DiffExprResults);
    expect(results.length).toEqual(1);

    expect(component.find(DiffExprCompute).length).toEqual(0);
  });

  it('on click of go back, DiffExprManager calls the compute view', () => {
    const component = mount(
      <Provider store={filledStore}>
        <DiffExprManager experimentId='1234' view='compute' width={100} height={200} />
      </Provider>,
    );

    act(() => {
      component.find(DiffExprCompute).props().onCompute();
    });
    component.update();

    act(() => {
      component.find(DiffExprResults).props().onGoBack();
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(0);
    expect(component.find(DiffExprCompute).length).toEqual(1);
  });
});
