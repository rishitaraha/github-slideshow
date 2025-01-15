import { SelectOption } from '@aus-platform/design-system';
import { GCPUploadAction } from '../enums';
import { EPSGCode, VerticalCRS } from 'src/shared/enums';

export type UploadGCPModalProps = {
  hideGcpUploadModal: VoidFunction;
};

export type SelectedGCPCrs = {
  horizontalCRS: SelectOption<EPSGCode>;
  verticalCRS: SelectOption<VerticalCRS>;
};

export type AppendReplaceGCPProps = {
  setUploadAction: (action: GCPUploadAction) => void;
  uploadAction: GCPUploadAction;
};
