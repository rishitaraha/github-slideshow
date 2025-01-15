import {
  Button,
  ButtonVariant,
  Icon,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { DatasetDetailsTooltip } from '../../../components/map-3d-workspace/shared/components';
import { useAppSelector } from 'src/app/hooks';
import {
  selectMap3dDataset,
  selectMap3dSidebar,
} from 'map-3d/shared/map-3d-slices';
import { useOnFirstMount } from 'shared/hooks';

type DSMSelectorProps = {
  onButtonClick: () => void;
};

export const SelectTerrainFooter: React.FC<DSMSelectorProps> = ({
  onButtonClick,
}) => {
  // Selectors.
  const { selectedTerrainIteration, selectedTerrainSite, selectedProject } =
    useAppSelector(selectMap3dDataset);

  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);

  // Constants.
  const dsmSelectorText = !isNil(selectedTerrainIteration)
    ? selectedTerrainIteration.name
    : 'No terrain selected';

  const isButtonDisabled = isEmpty(selectedProject?.id);

  // States.
  const [showTooltip, setShowTooltip] = useState(false);

  // Hooks.
  const isFirstRender = useOnFirstMount();

  // useEffects.
  useEffect(() => {
    if (isNil(selectedTerrainIteration) || isFirstRender) {
      return;
    }

    if (!activeSidebarOption?.isHidden) {
      setShowTooltip(false);
      return;
    }

    setShowTooltip(true);
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [selectedTerrainIteration, activeSidebarOption?.isHidden]);

  return (
    <div className="select-terrain-footer">
      <div className="select-terrain-footer__text">{dsmSelectorText}</div>
      {!isNil(selectedTerrainIteration) && !isNil(selectedTerrainSite) && (
        <DatasetDetailsTooltip
          siteName={selectedTerrainSite?.name}
          iterationName={selectedTerrainIteration?.name}
          placement={Placement.Top}
          show={showTooltip}
        >
          <span
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Icon
              className="select-terrain-footer__tooltip-icon--info-circle"
              size={16}
              identifier={IconIdentifier.InfoCircle}
            />
          </span>
        </DatasetDetailsTooltip>
      )}
      <Tooltip
        hoverText="Select a project before 
        selecting terrain"
        className="select-terrain-footer__btn"
        activeState={!isButtonDisabled}
        placement={Placement.Top}
      >
        <Button
          variant={ButtonVariant.Link}
          rightIconIdentifier={IconIdentifier.Elevation}
          iconSize={16}
          onClick={onButtonClick}
          disabled={isButtonDisabled}
        >
          {!isNil(selectedTerrainIteration)
            ? 'Change Terrain'
            : 'Select Terrain'}
        </Button>
      </Tooltip>
    </div>
  );
};
