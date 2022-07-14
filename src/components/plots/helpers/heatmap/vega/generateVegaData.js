import generateVegaGeneExpressionsData from 'components/plots/helpers/heatmap/vega/utils/generateVegaGeneExpressionsData';
import generateVegaHeatmapTracksData from 'components/plots/helpers/heatmap/vega/utils/generateVegaHeatmapTracksData';
import { reversed } from 'utils/arrayUtils';

const generateVegaData = (
  cellOrder, geneOrder, expression, heatmapSettings, cellSets,
) => {
  const { selectedTracks, guardlines } = heatmapSettings;
  const trackOrder = reversed(selectedTracks);

  const data = {
    cellOrder,
    geneOrder,
    trackOrder,
    geneExpressionsData: [],
    trackPositionData: [],
    trackGroupData: [],
  };

  data.geneExpressionsData = generateVegaGeneExpressionsData(
    cellOrder, geneOrder, expression, heatmapSettings,
  );

  const trackData = trackOrder.map(
    (rootNode) => generateVegaHeatmapTracksData(
      cellOrder,
      rootNode,
      cellSets,
      guardlines,
    ),
  );

  data.trackColorData = trackData.map((datum) => datum.trackColorData).flat();
  data.trackGroupData = trackData.map((datum) => datum.groupData).flat();
  data.clusterSeparationLines = trackData.length > 0 ? trackData[0].clusterSeparationLines : [];

  return data;
};

export default generateVegaData;
