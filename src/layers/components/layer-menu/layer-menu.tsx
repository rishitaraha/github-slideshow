import {
  MeatBallsMenu,
  MeatBallsMenuProps,
  MeatBallsSize,
  StatusIndicatorLevel,
  toast,
  Tooltip,
  Icon,
  IconIdentifier,
  ColorClass,
} from '@aus-platform/design-system';
import FileSaver from 'file-saver';
import { some, toUpper } from 'lodash';
import React, { useEffect, useState } from 'react';
import { downloadableFormatsForVectorLayer } from './constants';
import {
  AddLayerResponse,
  LayerType,
  VectorFileFormat,
  useClampToTerrain,
  useDownloadVectorLayer,
  useFileDownload,
} from 'shared/api';
import { FileFormatByExtension } from 'shared/constants';
import { FileType } from 'shared/hooks';

type LayerMenuProps = Omit<MeatBallsMenuProps, 'children'> & {
  layer: AddLayerResponse;
  reloadLayerList: VoidFunction;
  hasDSM?: boolean;
};

export const LayerMenu: React.FC<LayerMenuProps> = ({
  layer,
  reloadLayerList,
  hasDSM,
  ...rest
}) => {
  // States.
  const [currentFileExportFormat, setCurrentFileExportFormat] =
    useState<VectorFileFormat | null>(null);

  // API Hooks.
  const {
    mutate: sendDownloadVectorLayerRequest,
    data: downloadVectorLayerResponse,
    isSuccess: isSuccessDownloadVectorLayer,
    isPending: isLoadingDownloadVectorLayer,
    isError: isErrorDownloadVectorLayer,
  } = useDownloadVectorLayer();

  const {
    mutate: sendDownloadUrlRequest,
    data: downloadFileResponse,
    isSuccess: isSuccessFileDownloadResponse,
  } = useFileDownload();

  const {
    mutate: sendClampToTerrainRequest,
    isSuccess: isSuccessClampToTerrain,
    isError: isErrorClampToTerrain,
    error: clampToTerrainErrorResponse,
  } = useClampToTerrain();

  // useEffects.
  useEffect(() => {
    if (isSuccessDownloadVectorLayer && downloadVectorLayerResponse) {
      switch (currentFileExportFormat) {
        case VectorFileFormat.DXF:
          FileSaver.saveAs(
            downloadVectorLayerResponse,
            `${layer?.name}_dxf.dxf`,
          );
          break;
        case VectorFileFormat.KML:
          FileSaver.saveAs(
            downloadVectorLayerResponse,
            `${layer?.name}_kml.kml`,
          );
          break;
        case VectorFileFormat.ShapeFile:
          FileSaver.saveAs(
            downloadVectorLayerResponse,
            `${layer?.name}_shp.zip`,
          );
          break;
      }
    }
  }, [isSuccessDownloadVectorLayer, downloadVectorLayerResponse]);

  useEffect(() => {
    if (isSuccessFileDownloadResponse && downloadFileResponse?.downloadUrl) {
      window.location.href = downloadFileResponse.downloadUrl;
    }
  }, [isSuccessFileDownloadResponse, downloadFileResponse]);

  useEffect(() => {
    if (isErrorDownloadVectorLayer) {
      toast.error('Layer has no features to download.');
    }
  }, [isErrorDownloadVectorLayer]);

  useEffect(() => {
    if (isSuccessClampToTerrain) {
      toast.success('Layer clamping started');
      reloadLayerList();
    }
  }, [isSuccessClampToTerrain]);

  useEffect(() => {
    if (isErrorClampToTerrain) {
      if (
        clampToTerrainErrorResponse.meta.slug ===
        'no_feature_present_for_clamping'
      ) {
        toast.error('Layer has no features for clamping');
      }
    }
  }, [isErrorClampToTerrain]);

  // Handlers.
  const onDownloadBtnClick = (
    event: React.MouseEvent<HTMLElement>,
    fileFormat: VectorFileFormat,
    layer: AddLayerResponse,
  ) => {
    event.stopPropagation();
    setCurrentFileExportFormat(fileFormat);
    sendDownloadVectorLayerRequest({
      layerId: layer.id,
      responseFormat: fileFormat,
    });
  };

  const isOrthoCogGenerated = (layer: AddLayerResponse) => {
    return (
      layer.type === LayerType.Orthomosaic &&
      some(
        layer.files,
        (file) =>
          file.type === FileType.OrthomosaicCog &&
          file.status === StatusIndicatorLevel.Done,
      )
    );
  };

  return (
    <MeatBallsMenu {...rest} className="layer-menu" size={MeatBallsSize.Large}>
      {/* Clamp to Terrain */}
      {layer.type === LayerType.Vector && hasDSM && (
        <MeatBallsMenu.Item
          className="layer-menu__clamp-to-terrain-option"
          onClick={() => sendClampToTerrainRequest({ id: layer.id })}
        >
          Clamp to Terrain{' '}
          <Tooltip hoverText="Assign z-elevation value to the layer based on the current iteration’s DSM">
            <Icon
              identifier={IconIdentifier.InfoCircle}
              size={16}
              colorClass={ColorClass.Neutral200}
            />
          </Tooltip>
        </MeatBallsMenu.Item>
      )}
      {/* Downloading vector files from Api Engine*/}
      {layer.type === LayerType.Vector &&
        downloadableFormatsForVectorLayer.map((vectorFileFormat) => (
          <MeatBallsMenu.Item
            key={vectorFileFormat}
            onClick={(event) => {
              onDownloadBtnClick(event, vectorFileFormat, layer);
            }}
            isLoading={
              isLoadingDownloadVectorLayer &&
              currentFileExportFormat === vectorFileFormat
            }
          >
            Download {toUpper(vectorFileFormat)}
          </MeatBallsMenu.Item>
        ))}

      {/* Downloading vectors from s3 & hide cog files from download list.*/}
      {layer.type !== LayerType.Vector &&
        layer.files &&
        layer.files
          .filter((file) => {
            // If ortho cog is generated then show the cog file, else show the uploaded ortho.
            switch (file.type) {
              case FileType.Orthomosaic:
                return !isOrthoCogGenerated(layer);
              case FileType.OrthomosaicCog:
                return isOrthoCogGenerated(layer);
              default:
                return true;
            }
          })
          .map((file) => {
            return (
              <MeatBallsMenu.Item
                key={file.id}
                onClick={(event) => {
                  event.stopPropagation();
                  if (file.id) {
                    sendDownloadUrlRequest(file.id);
                  }
                }}
                disabled={file.status !== StatusIndicatorLevel.Done}
              >
                Download {toUpper(FileFormatByExtension[file.extension])}
              </MeatBallsMenu.Item>
            );
          })}
    </MeatBallsMenu>
  );
};
