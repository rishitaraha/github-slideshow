import {
  Accordion,
  SideCard,
  AccordionVariant,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { WorkspaceLayerListObj } from '../../../../shared';
import { removeMapLayer } from '../../shared';
import { WorkspaceSidecardProps } from '../types';
import { canLayerShowHistogram } from './helpers';
import { AccordionEventKey } from './enums';
import { OpacitySlider } from 'shared/components/opacity-slider';
import { DateTimeFormatLength } from 'src/shared/utils/enums';
import {
  Histogram,
  viridis2ColorMap,
} from 'shared/components/map-tools/histogram';
import {
  selectMap3DState,
  selectWorkspaceActionableLayers,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const LayerPropertiesSidecard: React.FC<WorkspaceSidecardProps> = ({
  show,
  onClose,
}) => {
  // Dispatchers.
  const dispatch = useAppDispatch();

  // Selectors.
  const { currentPropertyLayer: layer } = useAppSelector(
    selectWorkspaceActionableLayers,
  );
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // Handlers.
  const updateLayer = (layers: WorkspaceLayerListObj) => {
    dispatch(updateWorkspaceLayer(layers));
  };

  const onChangeHistogramRescale = (newRescale: string) => {
    if (isNil(layer) || !layer.histogramData) {
      return;
    }

    let { mapLayer } = layer;

    // Create new map layer if rescale value is changed.
    if (newRescale !== layer.histogramData.rescale && cesiumProxy) {
      // Remove previous map layer if it exists.
      if (layer.mapLayer) {
        removeMapLayer(cesiumProxy, layer.mapLayer);
      }

      // Add new map layer.
      mapLayer = cesiumProxy.layerManager.addHistogramLayerToCesium(
        {
          ...layer.histogramData,
          rescale: newRescale,
        },
        {
          show: true,
          zIndex: layer.zIndex,
        },
      );
    }

    updateLayer({
      [layer.id]: {
        ...layer,
        mapLayer,
        histogramData: {
          ...layer.histogramData,
          rescale: newRescale,
        },
      },
    });
  };

  const onChangeHistogramOpacity = (newOpacity: number) => {
    if (isNil(layer)) {
      return;
    }

    const { mapLayer, histogramData } = layer;

    // Update the existing map layer if only opacity is changed.
    if (
      newOpacity !== layer.histogramData?.opacity &&
      mapLayer?.show &&
      'alpha' in mapLayer
    ) {
      mapLayer.alpha = parseFloat(newOpacity.toString()) / 100.0;
    }

    updateLayer({
      [layer.id]: {
        ...layer,
        histogramData: {
          ...histogramData,
          opacity: newOpacity,
        },
      },
    });
  };

  // Renders.
  return (
    <SideCard
      className="layer-properties-sidecard"
      title="Layer Properties"
      show={show}
      onClose={onClose}
      showCloseButton={true}
      backdrop={false}
    >
      <Accordion
        className="layer-properties-sidecard__accordion"
        alwaysOpen
        variant={AccordionVariant.ChevronRight}
        defaultActiveKey={Object.values(AccordionEventKey)}
      >
        {layer && canLayerShowHistogram(layer) && (
          <>
            <Accordion.Item
              title="Opacity"
              eventKey={AccordionEventKey.Opacity}
            >
              <div className="accordion__group">
                <OpacitySlider
                  opacity={layer.histogramData?.opacity ?? 0}
                  onChangeOpacity={onChangeHistogramOpacity}
                />
              </div>
            </Accordion.Item>
            <Accordion.Item
              title="Elevation Profile Histogram"
              eventKey={AccordionEventKey.Histogram}
            >
              <div className="accordion__group">
                <Histogram
                  colorMap={viridis2ColorMap}
                  statistics={layer?.histogramData?.metadata?.statistics}
                  onChangeHistogramRescale={onChangeHistogramRescale}
                  rescale={layer.histogramData?.rescale}
                />
              </div>
            </Accordion.Item>
          </>
        )}
        <Accordion.Item
          title="Layer Details"
          eventKey={AccordionEventKey.LayerDetails}
        >
          <div className="accordion__group">
            <div className="accordion__group__header">{layer?.name}</div>
          </div>
          <div className="accordion__group accordion__group--separated">
            <div className="accordion__group__header">Project</div>
            <div className="accordion__group__content">
              {layer?.project.name}
            </div>
          </div>
          <div className="accordion__group">
            <div className="accordion__group__header">Site</div>
            <div className="accordion__group__content">{layer?.site.name}</div>
          </div>
          <div className="accordion__group">
            <div className="accordion__group__header">Iteration</div>
            <div className="accordion__group__content">
              {layer?.iteration.name}
            </div>
          </div>
          <div className="accordion__group accordion__group--separated">
            <div className="accordion__group__content">Created On</div>
            <div className="accordion__group__content">
              {layer?.createdAt.formatDateTime?.(
                DateTimeFormatLength.Long,
                DateTimeFormatLength.Medium,
              )}
            </div>
          </div>
        </Accordion.Item>
      </Accordion>
    </SideCard>
  );
};
