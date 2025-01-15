import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import { useContext } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../../app/hooks';
import { Map3DSideBarContext } from '../../../../../contexts';
import {
  WorkspaceRightSideCard,
  selectMap3dDataset,
  setActiveWorkspaceIteration,
  setActiveWorkspaceSite,
  setRightSideCard,
} from '../../../../../shared/map-3d-slices';
import { map3dSidebarItems } from '../../../constants';

type GeneratingOutput = {
  currentAnalyticsOption: string;
  setShowCurrentForm: (state: boolean) => void;
  text?: string;
  subtext?: string;
  linkText?: string;
  showWorkspaceBtn?: boolean;
  dataset?: {
    siteId: string;
    iterationId: string;
  };
};

export const GeneratingOutput: React.FC<GeneratingOutput> = ({
  currentAnalyticsOption,
  setShowCurrentForm,
  text = `Request for Generating ${currentAnalyticsOption} Submitted`,
  subtext = `Generate New ${currentAnalyticsOption}`,
  linkText = 'Once generated, you can view it in workspace',
  showWorkspaceBtn = true,
}) => {
  // Contexts.
  const { activeOptionHandler } = useContext(Map3DSideBarContext);

  // Hooks.
  const dispatch = useAppDispatch();

  // Selectors.
  const { selectedTerrainIteration, selectedTerrainSite } =
    useAppSelector(selectMap3dDataset);

  // Handlers.
  const viewInWorkSpace = () => {
    dispatch(setActiveWorkspaceSite(selectedTerrainSite));
    dispatch(setActiveWorkspaceIteration(selectedTerrainIteration));
    dispatch(setRightSideCard(WorkspaceRightSideCard.Dataset));

    activeOptionHandler(
      map3dSidebarItems[0],
      map3dSidebarItems[0].icon.identifier,
    );
  };

  const onClickGenerateNew = () => {
    setShowCurrentForm(true);
  };

  return (
    <div className="generating-output">
      <Icon
        className="generating-output__loading-icon"
        identifier={IconIdentifier.Loading}
        size={78}
        colorClass={ColorClass.AccentWarning}
      />
      <div className="generating-output__text">
        <strong>{text}</strong>
        <p> {linkText} </p>
      </div>
      {showWorkspaceBtn && (
        <Button onClick={viewInWorkSpace}>View in Workspace</Button>
      )}
      <Button variant={ButtonVariant.Link} onClick={onClickGenerateNew}>
        {subtext}
      </Button>
    </div>
  );
};
