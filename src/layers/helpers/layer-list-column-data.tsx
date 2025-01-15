import {
  Button,
  ButtonVariant,
  Icon,
  IconIdentifier,
  MeatBallsMenuDirection,
  Pill,
  PillVariant,
  SpinnerVariant,
  StatusIndicator,
  StatusIndicatorLevel,
  Tooltip,
} from '@aus-platform/design-system';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { capitalize, isEmpty, startCase } from 'lodash';
import React from 'react';
import {
  CurrentLayer,
  LayerListItem,
  LayerType,
  LoggedUser,
} from '../../shared/api';
import { Formatter, getFileStatusText, isOrgAdmin } from '../../shared/helpers';
import { LayerMenu } from '../components';
import { getLayerStatus } from './layer-file-helper';
import { getClampedStateIndicatorProps } from '.';

const columnHelper = createColumnHelper<LayerListItem>();

type LayerListColumnsParams = {
  setCurrentLayer: React.Dispatch<React.SetStateAction<CurrentLayer>>;
  openEditLayer: () => void;
  onClickDeleteLayer: () => void;
  reloadLayerList: VoidFunction;
  canManageLayers?: boolean;
  hasDSM?: boolean;
  loggedUser?: LoggedUser;
};

export const layerListColumns = ({
  setCurrentLayer,
  onClickDeleteLayer,
  openEditLayer,
  canManageLayers,
  hasDSM,
  reloadLayerList,
  loggedUser,
}: LayerListColumnsParams): ColumnDef<LayerListItem, any>[] => {
  // Handlers.
  const deleteLayer = (currentLayer: CurrentLayer) => {
    setCurrentLayer(currentLayer);
    onClickDeleteLayer();
  };

  const editLayer = (currentLayer: CurrentLayer) => {
    setCurrentLayer(currentLayer);
    openEditLayer();
  };

  const layerTypeIconIdentifier = {
    [LayerType.Contour]: IconIdentifier.LayerTypeContour,
    [LayerType.SlopeMap]: IconIdentifier.LayerTypeSlopeMap,
    [LayerType.Orthomosaic]: IconIdentifier.LayerTypeOrtho,
  };

  // Renders.
  const renderFileStatusIndicator = (layer: LayerListItem) => {
    switch (layer.type) {
      case LayerType.SlopeMap:
      case LayerType.Contour:
      case LayerType.Orthomosaic:
        if (layer.files) {
          return (
            <Tooltip
              hoverText={getFileStatusText(
                `${startCase(layer.type)} File`,
                getLayerStatus(layer),
              )}
            >
              <StatusIndicator
                iconIdentifier={layerTypeIconIdentifier[layer.type]}
                status={getLayerStatus(layer)}
              />
            </Tooltip>
          );
        }
        break;

      case LayerType.MBTiles:
        if (layer.tiles) {
          return (
            <Tooltip
              hoverText={getFileStatusText('Vector Tile', layer.tiles.status)}
            >
              <StatusIndicator
                iconIdentifier={IconIdentifier.LayerTypeVector}
                status={layer.tiles.status}
              />
            </Tooltip>
          );
        }
        break;

      case LayerType.Vector:
        if (layer.files && !isEmpty(layer.files)) {
          const { status, errors } = layer?.files[0];
          if (status === StatusIndicatorLevel.Processing) {
            return (
              <Tooltip hoverText={'Shapefile is Processing...'}>
                <Pill
                  variant={PillVariant.Warning}
                  showSpinner={true}
                  spinnerVariant={SpinnerVariant.Warning}
                >
                  {capitalize(status)}
                </Pill>
              </Tooltip>
            );
          } else if (status === StatusIndicatorLevel.Failed && errors) {
            return (
              <Tooltip hoverText={errors[0]}>
                <Pill
                  variant={PillVariant.Error}
                  rightIconIdentifier={IconIdentifier.Warning}
                  iconSize={14}
                >
                  {capitalize(status)}
                </Pill>
              </Tooltip>
            );
          }
        }
        break;
      default:
        return null;
    }
  };

  return [
    columnHelper.accessor('name', {
      size: 500,
      header: 'LAYER NAME',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('type', {
      size: 500,
      header: 'LAYER TYPE',
      cell: (info) => {
        const { clampedStatus, type } = info.row.original;
        const iconProps = getClampedStateIndicatorProps(clampedStatus, hasDSM);

        return (
          <div className="layer-list__table-cell">
            <span>{Formatter.toTitleCase(info.getValue(), ' ')}</span>
            {type == LayerType.Vector && (
              <Tooltip
                hoverText={iconProps.hoverText}
                className="clamped-state-icon"
              >
                <Icon {...iconProps} size={16} />
              </Tooltip>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      size: 500,
      id: 'actions',
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info) => {
        const { type, files, name, id } = info.row.original;
        return (
          <div className="layer-list__actions">
            <div className="layer-list__indicators">
              {renderFileStatusIndicator(info.row.original)}
            </div>
            <div className="aus-table__action__buttons">
              {canManageLayers && (
                <Button
                  className="layer-list__action-item__edit-button"
                  variant={ButtonVariant.Secondary}
                  leftIconIdentifier={IconIdentifier.Pencil}
                  iconSize={18}
                  onClick={() =>
                    editLayer({
                      id,
                      name,
                    })
                  }
                  data-testid="edit-layer-button"
                />
              )}

              {isOrgAdmin(loggedUser) && (
                <Button
                  className="layer-list__action-item__delete-button"
                  variant={ButtonVariant.Secondary}
                  leftIconIdentifier={IconIdentifier.Bin}
                  iconSize={18}
                  onClick={() =>
                    deleteLayer({
                      id,
                      name,
                    })
                  }
                  data-testid="delete-layer-button"
                />
              )}
              <LayerMenu
                layer={info.row.original}
                drop={MeatBallsMenuDirection.Down}
                showMenu={
                  (!isEmpty(files) && type !== LayerType.Vector) ||
                  type === LayerType.Vector
                }
                reloadLayerList={reloadLayerList}
                hasDSM={hasDSM}
              />
            </div>
          </div>
        );
      },
    }),
  ];
};
