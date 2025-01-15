import {
  Button,
  ButtonVariant,
  ColorClass,
  DropDownButton,
  Icon,
  IconIdentifier,
  Input,
  SelectOption,
} from '@aus-platform/design-system';
import html2canvas from 'html2canvas';
import { isNil, isString, startCase, toNumber } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { Image } from '../../../assets';
import {
  useMyOrg,
  useSiteFinancialYears,
  useUploadProductionTarget,
  useUploadSafteyIndex,
  useUploadStockVolume,
} from '../../../shared/api';
import { isAppOpenInIframe } from '../../../shared/helpers';
import { useBase64ImageString } from '../../../shared/hooks';
import { selectDashboardDataset } from '../../dashboard-slices';
import { DashboardKpi } from '../../enums';
import { UploadKpiModal } from '../upload-kpi-modal';
import { DashboardKpiCharts } from './components';
import { getContentToBePrinted } from './helpers';

const dashboardKpiList = [
  DashboardKpi.Production,
  DashboardKpi.SafetyIndex,
  DashboardKpi.StockVolume,
];

export const KeyPerformanceIndicator = () => {
  // Selectors.
  const dataset = useAppSelector(selectDashboardDataset);
  const siteId = dataset.site?.value.id;

  const printElementRef = useRef<HTMLDivElement>(null);

  const { base64String: aereoLogoBase64String } = useBase64ImageString(
    Image.AereoCloudLogoBlue,
  );

  // States.
  const [financialYearOptions, setFinancialYearOptions] =
    useState<SelectOption<number>[]>();
  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState<SelectOption<number> | null>();
  const [orgLogoBase64String, setOrgLogoBase64String] = useState<string | null>(
    null,
  );
  const [showUploadKpiModal, setShowUploadKpiModal] = useState(false);
  const [selectedKpiOption, setSelectedKpiOption] =
    useState<DashboardKpi | null>(null);
  const [isChartLoaded, setIsChartLoaded] = useState(false);

  // APIs.
  const {
    data: siteFinancialYearResponse,
    isLoading: isSiteFinancialYearsResponseLoading,
    isSuccess: isSiteFinancialYearsRequestSuccess,
  } = useSiteFinancialYears(siteId ?? '', !isNil(siteId));

  const {
    data: myOrgData,
    isSuccess: isSuccessMyOrg,
    isError: isErrorMyOrg,
  } = useMyOrg();

  // useEffect.
  useEffect(() => {
    setSelectedFinancialYear(null);
    if (siteFinancialYearResponse && isSiteFinancialYearsRequestSuccess) {
      setFinancialYearOptions(
        siteFinancialYearResponse.data.map((financialYear) => {
          const financialYearEnding = toNumber(financialYear.split('-')[1]);
          return {
            label: `FY ${financialYear}`,
            value: financialYearEnding,
          };
        }),
      );
    }
  }, [siteFinancialYearResponse, isSiteFinancialYearsRequestSuccess]);

  useEffect(() => {
    if (myOrgData?.data.logo && isSuccessMyOrg) {
      /**
       * Fetching org logo & converting it to base64 string.
       * To avoid rendering issues when the image src is a link
       * (and image has to load before window being printed).
       */
      fetch(myOrgData.data.logo)
        .then((resp) => {
          return resp.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          // Read the `Blob` as a data URL
          reader.readAsDataURL(blob);

          // When the `FileReader` has loaded the `Blob`, convert to base64
          reader.addEventListener('loadend', () => {
            if (isString(reader.result)) {
              const base64 = reader?.result?.split(',')[1];
              setOrgLogoBase64String('data:image/png;base64,' + base64);
            }
          });
        })
        .catch(() => {
          console.error('Failed to fetch org logo');
        });
    }
  }, [myOrgData, isErrorMyOrg, isSuccessMyOrg]);

  // Handlers.
  const dashboardKpiRequest = {
    [DashboardKpi.Production]: {
      kpiType: DashboardKpi.Production,
      uploadKpiRequest: useUploadProductionTarget(),
      templateName: 'production_kpi_template.csv',
    },
    [DashboardKpi.SafetyIndex]: {
      kpiType: DashboardKpi.SafetyIndex,
      uploadKpiRequest: useUploadSafteyIndex(),
      templateName: 'safety_index_kpi_template.csv',
    },
    [DashboardKpi.StockVolume]: {
      kpiType: DashboardKpi.StockVolume,
      uploadKpiRequest: useUploadStockVolume(),
      templateName: 'stock_volume_kpi_template.csv',
    },
  };

  const onFinancialYearSelect = (financialYearEnding: SelectOption<number>) => {
    setSelectedFinancialYear(financialYearEnding);
  };

  const onCloseUploadKpiModal = () => setShowUploadKpiModal(false);

  const onOpenUploadKpiModal = () => setShowUploadKpiModal(true);

  const onSelectKpiDropdownOption = (option: DashboardKpi) => {
    setSelectedKpiOption(option);
    onOpenUploadKpiModal();
  };

  /**
   * Printing canvas with html2canvas instead of iframe, because otherwise for each chart's canvas,
   * we would have to create a dom node.
   */
  const onClickPrintKpi = () => {
    if (isNil(selectedFinancialYear)) {
      return;
    }

    if (printElementRef.current && isChartLoaded) {
      let printWindow;

      html2canvas(printElementRef.current)
        .then((canvas) => {
          const printContentImgSrc = canvas.toDataURL('image/png');

          const { printHtml } = getContentToBePrinted({
            dataset,
            financialYear: selectedFinancialYear.label,
            orgLogoBase64String,
            aereoLogoBase64String,
            printContentImgSrc,
          });

          printWindow = window.open(
            '',
            `Dashboard-Report-${dataset.project?.label}-${dataset.site?.label}`,
            '',
          );
          printWindow?.document.write(printHtml);
        })
        .then(() => {
          // To print the window after everything has loaded properly.
          printWindow.print();
        });
    }
  };

  return (
    <div className="key-performance-indicators-container">
      {/* Action Toolbar */}
      {!isAppOpenInIframe() && (
        <div className="key-performance-indicators__actions">
          <Button
            variant={ButtonVariant.Link}
            onClick={onClickPrintKpi}
            leftIconIdentifier={IconIdentifier.Print}
            className="key-performance-indicators__actions__print-btn"
          >
            Print
          </Button>
          <DropDownButton
            btnText="Upload KPIs"
            className="key-performance-indicators__actions__upload-kpi-btn"
            btnProps={{ variant: ButtonVariant.Primary }}
            leftIconIdentifier={IconIdentifier.Upload}
            disabled={
              isNil(dataset.site) || !dataset.userHasManageSitePermission
            }
          >
            {dashboardKpiList.map((kpiType, index) => (
              <DropDownButton.Item
                key={index}
                onClick={() => onSelectKpiDropdownOption(kpiType)}
              >
                {startCase(kpiType)}
              </DropDownButton.Item>
            ))}
          </DropDownButton>
        </div>
      )}

      {/* Upload Kpi modal */}
      {selectedKpiOption && (
        <UploadKpiModal
          uploadKpiRequest={
            dashboardKpiRequest[selectedKpiOption].uploadKpiRequest
          }
          onClose={onCloseUploadKpiModal}
          show={showUploadKpiModal}
          kpiType={dashboardKpiRequest[selectedKpiOption].kpiType}
          templateName={dashboardKpiRequest[selectedKpiOption].templateName}
        />
      )}

      <div className="key-performance-indicators">
        {/* Timeline Strip */}
        <div className="key-performance-indicators__timeline-strip">
          <span className="key-performance-indicators__timeline-strip__title">
            Timeline
          </span>

          <div className="key-performance-indicators__timeline-strip__actions">
            <Input.Select
              className="key-performance-indicators__timeline-strip__financial_year_selector"
              placeholder={'Select FY'}
              options={financialYearOptions}
              value={selectedFinancialYear}
              isLoading={isSiteFinancialYearsResponseLoading}
              isDisabled={isNil(siteId)}
              onChange={onFinancialYearSelect}
            />
          </div>
        </div>

        {/* Message - Show select dataset message */}
        {(isNil(dataset.site) || !selectedFinancialYear) && (
          <div className="key-performance-indicators__message">
            <Icon
              identifier={IconIdentifier.CalendarLocation}
              size={70}
              colorClass={ColorClass.Neutral200}
            />
            <span>Select a dataset & financial year to get started</span>
          </div>
        )}

        {/* Dashboard KPI Charts */}
        {selectedFinancialYear && (
          <>
            <DashboardKpiCharts
              ref={printElementRef}
              financialYearEnding={selectedFinancialYear.value}
              setIsChartLoaded={setIsChartLoaded}
            />
          </>
        )}
      </div>
    </div>
  );
};
