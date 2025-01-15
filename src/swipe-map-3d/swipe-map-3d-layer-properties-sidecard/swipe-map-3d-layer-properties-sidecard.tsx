import {
  Accordion,
  AccordionVariant,
  SideCard,
  SideCardLocation,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import {
  selectSwipeMap3D,
  setLeftLayerList,
  setRightLayerList,
} from '../swipe-map-3d-slice';
import { AccordionEventKey } from '../enums';
import { canLayerShowHistogram } from '../helpers';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  Histogram,
  OpacitySlider,
  viridis2ColorMap,
} from 'src/shared/components';
import { DateTimeFormatLength } from 'src/shared/utils/enums';

export const SwipeMap3dLayerPropertiesSidecard = ({
  isLeftLayerPropertySidecard,
  show,
  onClose,
  project,
  site,
}) => {
  // Dispatches.
  const dispatch = useAppDispatch();

  // Selectors.
  const {
    splitViewer,
    rightPropertyLayerId,
    leftPropertyLayerId,
    rightIteration,
    leftIteration,
    leftLayerList,
    rightLayerList,
  } = useAppSelector(selectSwipeMap3D);

  // Constants.
  const layerPropertyId = isLeftLayerPropertySidecard
    ? leftPropertyLayerId
    : rightPropertyLayerId;
  const iteration = isLeftLayerPropertySidecard
    ? leftIteration
    : rightIteration;

  const setLayerList = isLeftLayerPropertySidecard
    ? setLeftLayerList
    : setRightLayerList;

  const layerList = isLeftLayerPropertySidecard
    ? leftLayerList
    : rightLayerList;

  const [layer] = Object.values(layerList).filter(
    (layer) => layer.id === layerPropertyId,
  );

  // Handlers
  const onChangeHistogramOpacity = (newOpacity: number) => {
    if (isNil(layer)) {
      return;
    }

    const { mapLayer } = layer;

    // Update the existing map layer if only opacity is changed.
    if (
      newOpacity !== layer.histogramData?.opacity &&
      mapLayer?.show &&
      'alpha' in mapLayer
    ) {
      mapLayer.alpha = parseFloat(newOpacity.toString()) / 100.0;
    }

    dispatch(
      setLayerList({
        ...layerList,
        [layer.id]: {
          ...layer,
          mapLayer,
          histogramData: {
            ...layer.histogramData,
            opacity: newOpacity,
          },
        },
      }),
    );
  };

  const onChangeHistogramRescale = (newRescale: string) => {
    if (isNil(layer) || !layer.histogramData) {
      return;
    }

    let { mapLayer } = layer;

    const layerManager = isLeftLayerPropertySidecard
      ? splitViewer?.leftLayerManager
      : splitViewer?.rightLayerManager;

    const zIndex = layerManager?.getZIndex(mapLayer);

    // Create new map layer if rescale value is changed.
    if (newRescale !== layer.histogramData.rescale && splitViewer) {
      // Remove previous map layer if it exists.
      if (layer.mapLayer) {
        splitViewer?.removeMapLayer(isLeftLayerPropertySidecard, [
          layer.mapLayer,
        ]);
      }

      // Add new map layer.
      if (layer.show) {
        mapLayer = layerManager?.addHistogramLayerToCesium(
          {
            ...layer.histogramData,
            rescale: newRescale,
          },
          {
            show: true,
            zIndex,
          },
        );
      }

      dispatch(
        setLayerList({
          ...layerList,
          [layer.id]: {
            ...layer,
            mapLayer,
            histogramData: {
              ...layer.histogramData,
              rescale: newRescale,
            },
          },
        }),
      );
    }
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
      placement={
        isLeftLayerPropertySidecard
          ? SideCardLocation.Start
          : SideCardLocation.End
      }
    >
      {layer && canLayerShowHistogram(layer) && (
        <>
          <Accordion
            className="layer-properties-sidecard__accordion"
            variant={AccordionVariant.ChevronRight}
            defaultActiveKey={Object.values(AccordionEventKey)}
          >
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
          </Accordion>

          <Accordion
            className="layer-properties-sidecard__accordion"
            variant={AccordionVariant.ChevronRight}
            defaultActiveKey={Object.values(AccordionEventKey)}
          >
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
          </Accordion>
        </>
      )}

      <Accordion
        className="layer-properties-sidecard__accordion"
        variant={AccordionVariant.ChevronRight}
        defaultActiveKey={Object.values(AccordionEventKey)}
      >
        <Accordion.Item
          title="Layer Details"
          eventKey={AccordionEventKey.LayerDetails}
        >
          <div className="accordion__group">
            <div className="accordion__group__header">{layer?.name}</div>
          </div>
          <div className="accordion__group accordion__group--separated">
            <div className="accordion__group__header">Project</div>
            <div className="accordion__group__content">{project}</div>
          </div>
          <div className="accordion__group">
            <div className="accordion__group__header">Site</div>
            <div className="accordion__group__content">{site}</div>
          </div>
          <div className="accordion__group">
            <div className="accordion__group__header">Iteration</div>
            <div className="accordion__group__content">{iteration?.name}</div>
          </div>
          <div className="accordion__group accordion__group--separated">
            <div className="accordion__group__content">Created On</div>
            <div className="accordion__group__content">
              {layer?.createdAt.formatDateTime?.(
                DateTimeFormatLength.Full,
                DateTimeFormatLength.Medium,
              )}
            </div>
          </div>
        </Accordion.Item>
      </Accordion>
    </SideCard>
  );
};
