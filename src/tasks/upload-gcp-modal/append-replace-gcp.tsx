import { FC } from 'react';
import {
  ColorClass,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import { GCPUploadAction } from '../enums';
import { AppendReplaceGCPProps } from './types';
import { uploadActionLabels } from './constants';

export const AppendReplaceGCP: FC<AppendReplaceGCPProps> = ({
  setUploadAction,
  uploadAction,
}) => {
  return (
    <div className="upload-gcp-modal__radio-container">
      <p>
        A GCP file is already present. Please select how you would like to
        proceed with the new GCP file:
      </p>
      <div className="upload-gcp-modal__radio-group-container">
        <InputGroup className="upload-gcp-modal__radio-group">
          <Input.CheckBox
            type="radio"
            checked={uploadAction === GCPUploadAction.REPLACE}
            onChange={() => {
              setUploadAction(GCPUploadAction.REPLACE);
            }}
            className="mx-0 upload-gcp-modal__radio"
          />
          <div className="d-flex gap-1 flex-row align-items-center">
            Replace
            <div className="px-1">
              <Tooltip
                hoverText="Use the new GCPs and discard the existing ones"
                placement={Placement.Top}
              >
                <Icon
                  size={14}
                  colorClass={ColorClass.AccentPrimary}
                  identifier={IconIdentifier.InfoCircle}
                ></Icon>
              </Tooltip>
            </div>
          </div>
        </InputGroup>
        <InputGroup className="upload-gcp-modal__radio-group">
          <Input.CheckBox
            type="radio"
            checked={uploadAction === GCPUploadAction.APPEND}
            onChange={() => {
              setUploadAction(GCPUploadAction.APPEND);
            }}
            className="mx-0 upload-gcp-modal__radio"
          />
          <div className="d-flex gap-1 flex-row align-items-center">
            Append
            <div className="px-1">
              <Tooltip
                hoverText="Combine the new GCPs with the existing ones"
                placement={Placement.Top}
              >
                <Icon
                  size={14}
                  colorClass={ColorClass.AccentPrimary}
                  identifier={IconIdentifier.InfoCircle}
                />
              </Tooltip>
            </div>
          </div>
        </InputGroup>
      </div>
      {uploadAction !== GCPUploadAction.NONE && (
        <div className="upload-gcp-modal__radio-info">
          {uploadAction === GCPUploadAction.REPLACE &&
            uploadActionLabels.replace}
          {uploadAction === GCPUploadAction.APPEND && uploadActionLabels.append}
        </div>
      )}
    </div>
  );
};
