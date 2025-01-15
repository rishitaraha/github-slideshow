import { ColorCodes } from '@aus-platform/design-system';
import { startCase } from 'lodash';
import {
  MonthlyKpi,
  ProductionData,
  SafetyIndexData,
  StockVolumeData,
  financialYearMonths,
} from '../../../../../shared/api';
import { BarChartData, LineChartData } from '../../../../../shared/components';

const labelsOfChart = financialYearMonths.map((month) => startCase(month));

export const prepareBarChartDataForDashboard = (
  targetData: (number | null)[],
  actualData: (number | null)[],
): BarChartData => {
  return {
    labels: labelsOfChart,
    datasets: [
      {
        label: 'Target',
        data: targetData,
        backgroundColor: ColorCodes.PurpleAccent100,
        borderRadius: 4,
        order: 1,
      },
      {
        label: 'Actual',
        data: actualData,
        backgroundColor: ColorCodes.PurpleAccent500,
        borderRadius: 4,
        categoryPercentage: 0.5,
        order: 0,
      },
    ],
  };
};

export const prepareLineChartDataForDashboard = (
  targetData: (number | null)[],
  actualData: (number | null)[],
): LineChartData => {
  return {
    labels: labelsOfChart,
    datasets: [
      {
        label: 'Actual',
        data: actualData,
        backgroundColor: ColorCodes.PurpleAccent500,
        borderColor: ColorCodes.PurpleAccent500,
      },
      {
        label: 'Target',
        data: targetData,
        backgroundColor: ColorCodes.PurpleAccent100,
        borderColor: ColorCodes.PurpleAccent100,
      },
    ],
  };
};

export const getDashboardChartData = (
  monthlyProduction: MonthlyKpi<ProductionData>,
) => {
  // Ore production data.
  const oreProductionTargetData: (number | null)[] = [];
  const oreProductionActualData: (number | null)[] = [];

  // Overburden production data.
  const overburdenProductionTargetData: (number | null)[] = [];
  const overburdenProductionActualData: (number | null)[] = [];

  // Overburden Composite Volume.
  const compositeVolumeTargetData: (number | null)[] = [];
  const compositeVolumeActualData: (number | null)[] = [];

  // Stripping Ratio.
  const strippingRatioTargetData: (number | null)[] = [];
  const strippingRatioActualData: (number | null)[] = [];

  financialYearMonths.forEach((month) => {
    // Ore Production.
    oreProductionTargetData.push(monthlyProduction[month].targetOreProduction);
    oreProductionActualData.push(monthlyProduction[month].actualOreProduction);

    // Overburden Production.
    overburdenProductionTargetData.push(
      monthlyProduction[month].targetOverburdenProduction,
    );
    overburdenProductionActualData.push(
      monthlyProduction[month].actualOverburdenProduction,
    );

    // Composite volume.
    compositeVolumeTargetData.push(
      monthlyProduction[month].targetCompositeVolume,
    );
    compositeVolumeActualData.push(
      monthlyProduction[month].actualCompositeVolume,
    );

    // Stripping ratio.
    strippingRatioTargetData.push(
      monthlyProduction[month].targetStrippingRatio,
    );
    strippingRatioActualData.push(
      monthlyProduction[month].actualStrippingRatio,
    );
  });

  return {
    oreProductionChartData: prepareBarChartDataForDashboard(
      oreProductionTargetData,
      oreProductionActualData,
    ),
    overburdenProductionChartData: prepareBarChartDataForDashboard(
      overburdenProductionTargetData,
      overburdenProductionActualData,
    ),
    compositeVolumeChartData: prepareBarChartDataForDashboard(
      compositeVolumeTargetData,
      compositeVolumeActualData,
    ),
    strippingRatioChartData: prepareLineChartDataForDashboard(
      strippingRatioTargetData,
      strippingRatioActualData,
    ),
  };
};

// Safety Index Chart.
export const getSafetyIndexChart = (
  monthlySafetyIndex: MonthlyKpi<SafetyIndexData>,
): LineChartData => {
  const haulRoadDistanceUnderGradientIssue: (number | null)[] = [];
  const haulRoadDistanceUnderWidthIssue: (number | null)[] = [];
  financialYearMonths.forEach((month) => {
    haulRoadDistanceUnderGradientIssue.push(
      monthlySafetyIndex[month].haulRoadDistanceUnderGradientIssue,
    );
    haulRoadDistanceUnderWidthIssue.push(
      monthlySafetyIndex[month].haulRoadDistanceUnderWidthIssue,
    );
  });

  return {
    labels: labelsOfChart,
    datasets: [
      {
        label: 'Distance of Haul Road under Gradient Issue (km)',
        data: haulRoadDistanceUnderGradientIssue,
        backgroundColor: ColorCodes.RedAccent200,
        borderColor: ColorCodes.RedAccent100,
      },
      {
        label: 'Distance of Haul Road under Width Issue(km)',
        data: haulRoadDistanceUnderWidthIssue,
        backgroundColor: ColorCodes.BlueAccent200,
        borderColor: ColorCodes.BlueAccent100,
      },
    ],
  };
};

// Stock Volume Chart.
export const getStockVolumeChart = (
  monthlyStockVolume: MonthlyKpi<StockVolumeData>,
): BarChartData => {
  const stockVolume: (number | null)[] = [];

  financialYearMonths.forEach((month) => {
    stockVolume.push(monthlyStockVolume[month].stockVolume);
  });

  return {
    labels: labelsOfChart,
    datasets: [
      {
        label: 'Stock Volume',
        data: stockVolume,
        backgroundColor: ColorCodes.PurpleAccent500,
        borderColor: ColorCodes.PurpleAccent500,
      },
    ],
  };
};
