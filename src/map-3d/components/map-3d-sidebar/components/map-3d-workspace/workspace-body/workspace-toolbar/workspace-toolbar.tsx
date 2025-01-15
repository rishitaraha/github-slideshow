import {
  IconButton,
  IconButtonVariant,
  Tooltip,
} from '@aus-platform/design-system';
import React from 'react';
import { SpacerPlacement, WorkspaceToolbarItem } from './types';

type WorkspaceToolbarProps = {
  toolbarItems: WorkspaceToolbarItem[];
  selectedItemsCount: number;
};

// TODO: Shift this component to aereo-design-system
export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  toolbarItems,
  selectedItemsCount,
}) => {
  // Render function.
  const Tools = () =>
    toolbarItems.map((toolbarItem, index) => (
      <React.Fragment key={`workspace-toolbar-tool-${index}`}>
        {toolbarItem.spacer === SpacerPlacement.Left && (
          <div className="workspace-toolbar__spacer"></div>
        )}
        <Tooltip hoverText={toolbarItem.toolTipText}>
          <IconButton
            key={`workspace-toolbar-tool-${index}`}
            className={'workspace-toolbar__tool'}
            variant={IconButtonVariant.Secondary}
            iconIdentifier={toolbarItem.icon}
            onClick={toolbarItem.onClickHandler}
            disabled={toolbarItem.disabled}
            iconSize={16}
          />
        </Tooltip>
        {toolbarItem.spacer === SpacerPlacement.Right && (
          <div className="workspace-toolbar__spacer"></div>
        )}
      </React.Fragment>
    ));

  return (
    <div className="workspace-toolbar">
      <div className="workspace-toolbar__icon-box">
        <Tools />
      </div>
      {selectedItemsCount > 0 && (
        <div className="workspace-toolbar__selected-items">
          {selectedItemsCount} Selected
        </div>
      )}
    </div>
  );
};
