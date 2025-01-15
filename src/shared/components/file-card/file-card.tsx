import {
  Button,
  ButtonVariant,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import React from 'react';
import { FileCardProps } from './types';

export const FileCard: React.FC<FileCardProps> = ({
  fileName,
  fileSize,
  showDeleteBtn = true,
  onDownloadClick,
  onDeleteBtnClick,
  deleteBtnDataTestId,
  fileCardDataTestId,
}) => {
  return (
    <div className="file-card" data-testid={fileCardDataTestId}>
      <div className="file-card__name-container">
        <div className="file-card__name-container__file-name">{fileName}</div>
        <a
          className="file-card__name-container__download-btn"
          onClick={onDownloadClick}
        >
          <Icon identifier={IconIdentifier.CloudDownload} size={20}></Icon>
        </a>
        {showDeleteBtn && (
          <Button
            leftIconIdentifier={IconIdentifier.CloseCircle}
            variant={ButtonVariant.Link}
            className="file-card__name-container__delete-btn"
            onClick={onDeleteBtnClick}
            iconSize={18}
            data-testid={deleteBtnDataTestId}
          />
        )}
      </div>
      <div className="file-card__file_size">{fileSize}</div>
    </div>
  );
};
