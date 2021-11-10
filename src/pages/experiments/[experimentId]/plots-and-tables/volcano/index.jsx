import React, { useEffect, useState, useRef } from 'react';
import {
  Row,
  Col,
  Space,
  Collapse,
  Skeleton,
  Button, Empty, Typography,
} from 'antd';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import loadDifferentialExpression from 'redux/actions/differentialExpression/loadDifferentialExpression';
import PlotStyling from 'components/plots/styling/PlotStyling';
import Header from 'components/plots/Header';

import DiffExprCompute from 'components/data-exploration/differential-expression-tool/DiffExprCompute';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig';
import PlatformError from 'components/PlatformError';
import { setComparisonGroup } from 'redux/actions/differentialExpression';
import Loader from 'components/Loader';
import calculateVolcanoDataPoints from 'components/plots/helpers/calculateVolcanoDataPoints';

import VolcanoPlot from 'components/plots/VolcanoPlot';

const { Text } = Typography;
const { Panel } = Collapse;

const route = {
  path: 'volcano',
  breadcrumbName: 'Volcano plot',
};

const plotUuid = 'volcanoPlotMain';
const plotType = 'volcano';

const volcanoPlotPage = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();
  const comparisonCreated = useRef(false);
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const {
    loading: diffExprLoading,
    data: diffExprData,
    error: diffExprError,
    cellSets: plotCellSets,
    comparisonType: plotComparisonType,
  } = useSelector(
    (state) => state.differentialExpression.properties,
  );
  const comparison = useSelector((state) => state.differentialExpression.comparison);

  const [plotData, setPlotData] = useState([]);
  const [maxYAxis, setMaxYAxis] = useState(null);

  useEffect(() => {
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }
    setComparisonGroup({
      ...plotCellSets,
      type: plotComparisonType,
    });
  }, []);

  useEffect(() => {
    if (!config || !diffExprData.length) return;
    setPlotData(calculateVolcanoDataPoints(config, diffExprData));
  }, [config, diffExprData]);

  const getMaxNegativeLogPValue = (data) => data.reduce((maxNegativeLogPValue, dataEntry) => {
    if (!dataEntry?.p_val_adj === 0) return maxNegativeLogPValue;
    return Math.max(maxNegativeLogPValue, -Math.log10(dataEntry.p_val_adj));
  }, 0);

  useEffect(() => {
    if (plotData.length === 0) return;

    const maxNegativeLogpValue = getMaxNegativeLogPValue(plotData);
    setMaxYAxis(Math.round(maxNegativeLogpValue));
  }, [plotData]);

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main schema',
      controls: [{
        name: 'volcanoDimensions',
        props: {
          xMax: 20,
          yMax: maxYAxis * 2,
        },
      }],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Data Thresholding',
      controls: ['volcanoThresholds'],
    },
    {
      panelTitle: 'Axes and margins',
      controls: ['axes'],
    },
    {
      panelTitle: 'Colours',
      controls: ['volcanoMarkers', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
    },
    {
      panelTitle: 'Add Labels',
      controls: [{
        name: 'volcanoLabels',
        props: {
          min: 0,
          max: maxYAxis + 5,
        },
      },
      ],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  // obj is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onComputeDiffExp = () => {
    comparisonCreated.current = true;
    dispatch(
      loadDifferentialExpression(experimentId, comparison.group[comparison.type], comparison.type),
    );
    updatePlotWithChanges(comparison.group[comparison.type]);
  };

  const generateExportDropdown = () => {
    let {
      cellSet, compareWith,
    } = comparison.group[comparison.type];

    // Remove 'groups' from 'group/cluster' name for use in filename below
    if (cellSet && compareWith) {
      cellSet = cellSet.split('/')[1] || cellSet;
      compareWith = compareWith.split('/')[1] || compareWith;
    }

    const date = moment.utc().format('YYYY-MM-DD-HH-mm-ss');
    const fileName = `de_${experimentId}_${cellSet}_vs_${compareWith}_${date}.csv`;
    const disabled = plotData.length === 0 || diffExprLoading || diffExprError;

    return (
      <CSVLink data={diffExprData} filename={fileName}>
        <Button
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          size='small'
        >
          Export as CSV...
        </Button>
      </CSVLink>
    );
  };

  if (!config) {
    return <Skeleton />;
  }

  const renderPlot = () => {
    if (diffExprError) {
      return (
        <PlatformError
          description='Could not load differential expression data.'
          onClick={() => {
            dispatch(
              loadDifferentialExpression(
                experimentId,
                comparison.group[comparison.type],
                comparison.type,
              ),
            );
          }}
        />
      );
    }

    if (!comparisonCreated.current) {
      return (
        <Empty description={(
          <>
            <p>
              <Text>Create a comparison to get started.</Text>
            </p>
          </>
        )}
        />
      );
    }

    if (plotData.length === 0 || diffExprLoading) {
      return <Loader experimentId={experimentId} />;
    }

    return <VolcanoPlot plotData={plotData} config={config} />;
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Differential Expression' key='1'>
        <DiffExprCompute
          experimentId={experimentId}
          onCompute={onComputeDiffExp}
        />
      </Panel>
    </>
  );

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey='1'>
              <Panel header='Preview' key='1' extra={generateExportDropdown()}>
                <center>{renderPlot()}</center>
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey='1' accordion />
            <PlotStyling
              formConfig={plotStylingControlsConfig}
              config={config}
              onUpdate={updatePlotWithChanges}
              renderExtraPanels={renderExtraPanels}
              defaultActiveKey='1'
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

volcanoPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default volcanoPlotPage;
