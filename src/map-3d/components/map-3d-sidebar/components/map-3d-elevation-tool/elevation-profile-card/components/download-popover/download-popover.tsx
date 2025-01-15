import {
  Button,
  ButtonVariant,
  IconButton,
  IconButtonVariant,
  IconIdentifier,
  OverlayPopover,
  Placement,
  toast,
} from '@aus-platform/design-system';
import { Chart, Point } from 'chart.js';
import FileSaver from 'file-saver';
import { isNil } from 'lodash';
import { RefObject, useEffect, useRef, useState } from 'react';
import { LineRepresentation } from '../../../types';
import { generateWithDXFWriter } from '../../helpers';
import { ElevationProfileChartData } from '../../types';
import {
  handleResponseErrorMessage,
  useDownloadElevationReport,
} from 'shared/api';

type DownloadPopoverProps = {
  chartData: ElevationProfileChartData | null;
  handlePrint: () => void;
  iterationIds: string[];
  elevationChartRef: RefObject<
    Chart<'line', (number | Point | null)[], unknown>
  >;
  lineCoordinates?: LineRepresentation;
};

export const DownloadPopover: React.FC<DownloadPopoverProps> = ({
  chartData,
  handlePrint,
  lineCoordinates,
  iterationIds,
  elevationChartRef,
}) => {
  // States.
  const [showDownloadPopover, setShowDownloadPopover] = useState(false);

  // Refs.
  const overlayTarget = useRef(null);

  // Hooks.
  const {
    mutate: sendDownloadElevationPathRequest,
    data: downloadElevationPathResponse,
    isSuccess: isSuccessDownloadElevationPath,
    isPending: isLoadingElevationPath,
    isError: isErrorDownloadElevationPath,
    error: downloadElevationPathError,
  } = useDownloadElevationReport();

  // Handlers.
  const exportElevationPath = () => {
    if (!isNil(lineCoordinates?.wkt)) {
      sendDownloadElevationPathRequest({
        iterations: iterationIds,
        lineWkt: lineCoordinates.wkt,
      });
    } else if (!isNil(lineCoordinates?.featureId)) {
      sendDownloadElevationPathRequest({
        iterations: iterationIds,
        feature: lineCoordinates.featureId,
      });
    }
  };

  const exportElevationProfileToDXF = () => {
    if (isNil(chartData)) {
      return;
    }

    const output = generateWithDXFWriter(
      chartData?.elevationsList,
      elevationChartRef,
    );

    if (!output) {
      toast.error('There was an error in generating the dxf file');
      return;
    }

    const blob = new Blob([output], { type: 'application/dxf' });
    FileSaver.saveAs(blob, `elevation-profile-${new Date().toString()}.dxf`);
  };

  // useEffects.
  useEffect(() => {
    if (downloadElevationPathResponse && isSuccessDownloadElevationPath) {
      FileSaver.saveAs(downloadElevationPathResponse, 'elevation_path.zip');
    }
    handleResponseErrorMessage(
      isErrorDownloadElevationPath,
      downloadElevationPathError,
    );
  }, [isSuccessDownloadElevationPath, downloadElevationPathResponse]);

  // Renders.
  const renderPopoverBody = () => {
    return (
      <div className="download-popover">
        <Button
          variant={ButtonVariant.Link}
          className="download-popover__item"
          onClick={handlePrint}
          disabled={isNil(chartData)}
        >
          Download .pdf
        </Button>
        <Button
          variant={ButtonVariant.Link}
          className="download-popover__item"
          onClick={exportElevationPath}
          disabled={isNil(chartData)}
          isLoading={isLoadingElevationPath}
        >
          Download .shp
        </Button>
        <Button
          variant={ButtonVariant.Link}
          className="download-popover__item"
          onClick={exportElevationProfileToDXF}
          disabled={isNil(chartData)}
        >
          Download .dxf
        </Button>
      </div>
    );
  };

  return (
    <>
      <IconButton
        iconIdentifier={IconIdentifier.Download}
        variant={IconButtonVariant.Outline}
        ref={overlayTarget}
        className="download-popover__button"
        onClick={() => {
          setShowDownloadPopover(!showDownloadPopover);
        }}
        disabled={isNil(chartData)}
      />
      <OverlayPopover
        target={overlayTarget.current}
        show={showDownloadPopover}
        body={renderPopoverBody()}
        placement={Placement.BottomEnd}
        onHide={() => {
          setShowDownloadPopover(false);
        }}
      />
    </>
  );
};
