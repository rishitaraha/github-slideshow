import { IconIdentifier } from '@aus-platform/design-system';
import { ReactNode } from 'react';

export type WorkspaceToolbarItem = {
  tool: WorkspaceToolbarTool;
  icon: IconIdentifier;
  onClickHandler: VoidFunction;
  toolTipText: ReactNode | string;
  spacer?: SpacerPlacement;
  disabled?: boolean;
};

export enum WorkspaceToolbarTool {
  SelectAll = 'selectAll',
  DeselectAll = 'deselectAll',
  SelectInvert = 'selectInvert',
  Delete = 'delete',
}

export enum SpacerPlacement {
  Left = 'left',
  Right = 'right',
}
