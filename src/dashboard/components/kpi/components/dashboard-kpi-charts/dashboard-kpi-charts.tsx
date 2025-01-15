import {
  ColorClass,
  Divider,
  Icon,
  IconIdentifier,
  Input,
  SelectOption,
} from '@aus-platform/design-system';
import { every, isNil } from 'lodash';
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types'; // eslint-disable-line import/no-unresolved
import { useAppSelector } from '../../../../../app/hooks';
import {
  usePlanningKPI,
  useProductionKPI,
  useSafetyIndexKPI,
  useStockVolumeKPI,
} from '../../../../../shared/api';
import {
  BarChart,
  BarChartData,
  DoughnutChart,
  DoughnutChartData,
  LineChart,
  LineChartData,
} from '../../../../../shared/components';
import { ForwardRef } from '../../../../../shared/type-utils';
import { selectDashboardDataset } from '../../../../dashboard-slices';
import { DashboardChartCard } from '../../../dashboard-card';
import { currentMonthSelectOption, monthSelectOptions } from './constants';
import {
  getDashboardChartData,
  getSafetyIndexChart,
  getStockVolumeChart,
} from './helpers';

type DashboardKpiChartsProps = {
  financialYearEnding: number;
  setIsChartLoaded: Dispatch<SetStateAction<boolean>>;
};

export const DashboardKpiCharts: ForwardRef<
  HTMLDivElement,
  DashboardKpiChartsProps
> = React.forwardRef(({ financialYearEnding, setIsChartLoaded }, ref) => {
  // Selectors.
  const dataset = useAppSelector(selectDashboardDataset);

  const chartRefs = useRef({
    overburden: React.createRef<ChartJSOrUndefined<'bar'>>(),
    ore: React.createRef<ChartJSOrUndefined<'bar'>>(),
    stockVolume: React.createRef<ChartJSOrUndefined<'bar'>>(),
    compositeVolume: React.createRef<ChartJSOrUndefined<'bar'>>(),
    strippingRatio: React.createRef<ChartJSOrUndefined<'line'>>(),
    safetyIndex: React.createRef<ChartJSOrUndefined<'line'>>(),
    planningKpi: React.createRef<ChartJSOrUndefined<'doughnut'>>(),
  });

  // States.
  const [selectedMonth, setSelectedMonth] =
    useState<SelectOption<number> | null>(currentMonthSelectOption ?? null);

  const [overburdenProductionChartData, setOverburdenProductionChartData] =
    useState<BarChartData | null>(null);
  const [oreProductionChartData, setOreProductionChartData] =
    useState<BarChartData | null>(null);
  const [compositeVolumeChartData, setCompositeVolumeChartData] =
    useState<BarChartData | null>(null);
  const [strippingRatioChartData, setStrippingRatioChartData] =
    useState<LineChartData | null>(null);
  const [planningKpiCharData, setPlanningKpiChartData] =
    useState<DoughnutChartData | null>(null);
  const [safetyIndexChartData, setSafetyIndexChartData] =
    useState<LineChartData | null>(null);
  const [stockVolumeChartData, setStockVolumeChartData] =
    useState<BarChartData | null>(null);

  // APIs.
  const {
    data: productionKpiResponse,
    isLoading: isProductionKpiLoading,
    isSuccess: isProductionKpiSuccess,
  } = useProductionKPI(dataset.site?.value.id ?? '', financialYearEnding);

  const {
    data: planningKpiResponse,
    isLoading: isPlanningKpiLoading,
    isSuccess: isPlanningKpiSuccess,
  } = usePlanningKPI(
    dataset.site?.value.id ?? '',
    financialYearEnding,
    selectedMonth?.value ?? 0,
  );

  const {
    data: safetyIndexKpiResponse,
    isLoading: isSafetyIndexKpiLoading,
    isSuccess: isSafetyIndexKpiSuccess,
  } = useSafetyIndexKPI(dataset.site?.value.id ?? '', financialYearEnding);

  const {
    data: stockVolumeKpiResponse,
    isLoading: isStockVolumeKpiLoading,
    isSuccess: isStockVolumeKpiSuccess,
  } = useStockVolumeKPI(dataset.site?.value.id ?? '', financialYearEnding);

  // useEffects.
  useEffect(() => {
    if (productionKpiResponse && isProductionKpiSuccess) {
      if (productionKpiResponse.data.monthlyProduction) {
        const dashboardChartData = getDashboardChartData(
          productionKpiResponse.data.monthlyProduction,
        );

        setOreProductionChartData(dashboardChartData.oreProductionChartData);
        setOverburdenProductionChartData(
          dashboardChartData.overburdenProductionChartData,
        );
        setCompositeVolumeChartData(
          dashboardChartData.compositeVolumeChartData,
        );
        setStrippingRatioChartData(dashboardChartData.strippingRatioChartData);
      } else {
        setOreProductionChartData(null);
        setOverburdenProductionChartData(null);
        setCompositeVolumeChartData(null);
        setStrippingRatioChartData(null);
      }
    }
  }, [productionKpiResponse, isProductionKpiSuccess]);

  useEffect(() => {
    if (planningKpiResponse && isPlanningKpiSuccess) {
      const totalPlanningArea = planningKpiResponse.data.totalArea;
      if (totalPlanningArea) {
        setPlanningKpiChartData({
          labels: [
            'Planned & Active',
            'Unplanned & Active',
            'Planned & Inactive',
            'Unplanned & Active - Beyond Critical Boundary',
          ],
          datasets: [
            {
              label: 'Area',
              data: [
                totalPlanningArea.plannedAndActive,
                totalPlanningArea.unplannedAndActive,
                totalPlanningArea.plannedAndInactive,
                totalPlanningArea.unplannedAndActiveBeyondCriticalBoundary,
              ],

              // We don't need to add new colors to our color class since they will only be used once.
              backgroundColor: ['#FF6484', '#36A2EB', '#4BC0C0', '#5E1AE5'],
              hoverOffset: 5,
            },
          ],
        });
      } else {
        setPlanningKpiChartData(null);
      }
    }
  }, [planningKpiResponse, isPlanningKpiSuccess]);

  useEffect(() => {
    if (safetyIndexKpiResponse && isSafetyIndexKpiSuccess) {
      let newSafetyIndexChart: LineChartData | null = null;
      if (safetyIndexKpiResponse.data.monthlySafetyIndex) {
        newSafetyIndexChart = getSafetyIndexChart(
          safetyIndexKpiResponse.data.monthlySafetyIndex,
        );
      }
      setSafetyIndexChartData(newSafetyIndexChart);
    }
  }, [isSafetyIndexKpiSuccess, safetyIndexKpiResponse]);

  useEffect(() => {
    if (stockVolumeKpiResponse && isStockVolumeKpiSuccess) {
      let newStockVolumeChart: BarChartData | null = null;
      if (stockVolumeKpiResponse.data.monthlyStockVolume) {
        newStockVolumeChart = getStockVolumeChart(
          stockVolumeKpiResponse.data.monthlyStockVolume,
        );
      }
      setStockVolumeChartData(newStockVolumeChart);
    }
  }, [isStockVolumeKpiSuccess, stockVolumeKpiResponse]);

  useEffect(() => {
    const checkChartLoading = [
      isNil(overburdenProductionChartData) ||
        !isNil(chartRefs.current.overburden),
      isNil(oreProductionChartData) || !isNil(chartRefs.current.ore),
      isNil(compositeVolumeChartData) ||
        !isNil(chartRefs.current.compositeVolume),
      isNil(strippingRatioChartData) ||
        !isNil(chartRefs.current.strippingRatio),
      isNil(stockVolumeChartData) || !isNil(chartRefs.current.stockVolume),
      isNil(safetyIndexChartData) || !isNil(chartRefs.current.safetyIndex),
      isNil(planningKpiCharData) || !isNil(chartRefs.current.planningKpi),
    ];

    setIsChartLoaded(every(checkChartLoading));
  }, [chartRefs]);

  // Renders.
  const renderNoDataPresentMessage = (
    message = 'No data present for selected FY',
  ) => {
    return (
      <div className="dashboard-kpi-charts__no-data-message">
        <Icon
          identifier={IconIdentifier.GraphOff}
          size={70}
          colorClass={ColorClass.Neutral200}
        />
        <span>{message}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-kpi-charts-container" ref={ref}>
      {/* OB Production Bar Chart */}
      <Divider text="PRODUCTION KPIs" />
      <div className="dashboard-kpi-charts-container__production">
        <DashboardChartCard
          title="OB PRODUCTION - TARGET VS ACTUAL"
          unit="tonnes"
          isLoading={isProductionKpiLoading}
        >
          {!isNil(overburdenProductionChartData) ? (
            <BarChart
              data={overburdenProductionChartData}
              stacked={true}
              ref={chartRefs.current.overburden}
            />
          ) : (
            renderNoDataPresentMessage()
          )}
        </DashboardChartCard>

        {/* ORE Production Bar Chart */}
        <DashboardChartCard
          title="ORE PRODUCTION - TARGET VS ACTUAL"
          unit="tonnes"
          isLoading={isProductionKpiLoading}
        >
          {!isNil(oreProductionChartData) ? (
            <BarChart
              data={oreProductionChartData}
              stacked={true}
              ref={chartRefs.current.ore}
            />
          ) : (
            renderNoDataPresentMessage()
          )}
        </DashboardChartCard>

        {/* Composite Volume Bar Chart */}
        <DashboardChartCard
          title="COMPOSITE VOLUME - TARGET VS ACTUAL"
          unit="m&#xb3;"
          isLoading={isProductionKpiLoading}
        >
          {!isNil(compositeVolumeChartData) ? (
            <BarChart
              data={compositeVolumeChartData}
              stacked={true}
              ref={chartRefs.current.compositeVolume}
            />
          ) : (
            renderNoDataPresentMessage()
          )}
        </DashboardChartCard>

        {/* Stripping Ratio Line Chart */}
        <DashboardChartCard
          title="STRIPPING RATIO - TARGET VS ACTUAL"
          isLoading={isProductionKpiLoading}
          unit="m&#xb3; of OB Removed to extract one tonne of Ore"
        >
          {!isNil(strippingRatioChartData) ? (
            <LineChart
              data={strippingRatioChartData}
              ref={chartRefs.current.strippingRatio}
            />
          ) : (
            renderNoDataPresentMessage()
          )}
        </DashboardChartCard>
      </div>

      {/* Stock Volume Bar Chart */}
      <Divider text="STOCK VOLUME KPIs" />
      <DashboardChartCard
        title="STOCK VOLUME"
        unit="m&#xb3;"
        isLoading={isStockVolumeKpiLoading}
      >
        {!isNil(stockVolumeChartData) ? (
          <BarChart
            data={stockVolumeChartData}
            ref={chartRefs.current.stockVolume}
          />
        ) : (
          renderNoDataPresentMessage()
        )}
      </DashboardChartCard>

      {/* Safety Index Line Chart */}
      <Divider text="SAFETY INDEX KPIs" />
      <DashboardChartCard
        title="SAFETY INDEX"
        unit="kms"
        isLoading={isSafetyIndexKpiLoading}
      >
        {!isNil(safetyIndexChartData) ? (
          <LineChart
            data={safetyIndexChartData}
            ref={chartRefs.current.safetyIndex}
          />
        ) : (
          renderNoDataPresentMessage()
        )}
      </DashboardChartCard>

      {/* Planning KPI Doughnut Chart */}
      <Divider text="PLANNING KPIs" />
      <DashboardChartCard
        title="PLANNING KPI"
        unit={
          <>
            km<sup>2</sup>
          </>
        }
        headerChildren={
          <Input.Select
            className="dashboard-kpi-charts__month-selector"
            placeholder={'Select Month'}
            options={monthSelectOptions}
            value={selectedMonth}
            isDisabled={isNil(financialYearEnding)}
            onChange={(month) => setSelectedMonth(month)}
          />
        }
        isLoading={isPlanningKpiLoading}
      >
        {!isNil(planningKpiCharData) ? (
          <DoughnutChart
            data={planningKpiCharData}
            ref={chartRefs.current.planningKpi}
          />
        ) : (
          renderNoDataPresentMessage('No data present for selected month')
        )}
      </DashboardChartCard>
    </div>
  );
});
