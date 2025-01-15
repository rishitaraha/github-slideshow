import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Tooltip,
} from '@aus-platform/design-system';
import { FC } from 'react';
import { GCPActionItemsProps } from '../types';

export const GCPActionItems: FC<GCPActionItemsProps> = ({
  currentRow,
  setShowGCPEditModal,
  setCurrentRow,
  gotoGCPTagPage,
  areImagesAvailable,
}) => {
  const handleEditGcp = () => {
    setShowGCPEditModal(true);
    setCurrentRow(currentRow);
  };

  return (
    <div className="gcp-schema-modal__table-action-list">
      {areImagesAvailable && (
        <Tooltip hoverText={'Tag GCP'}>
          <div>
            <Button
              variant={ButtonVariant.Link}
              rightIconIdentifier={IconIdentifier.GCPAvailableTagged}
              onClick={() => gotoGCPTagPage(currentRow)}
              iconSize={16}
            />
          </div>
        </Tooltip>
      )}
      <Tooltip hoverText="Edit GCP">
        <div>
          <Button
            variant={ButtonVariant.Link}
            color={ColorClass.Gray200}
            onClick={handleEditGcp}
          >
            <Icon
              identifier={IconIdentifier.Pencil}
              colorClass={ColorClass.Primary500}
              size={16}
            />
          </Button>
        </div>
      </Tooltip>
    </div>
  );
};
