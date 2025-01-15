import { GCPTableRowData } from '../types';
import { ImageInfoObj, GCPImageTagData } from 'src/shared/api';

export type GCPImageTaggingModalProps = {
  gcpRowData: GCPTableRowData;
  onDoneCallback: VoidFunction;
  showGCPExitConfirmationModal: boolean;
  setHasUnsavedGcpTagChanges: (value) => void;
  hideExitConfirmationModal: VoidFunction;
  displayExitConfirmationModal: VoidFunction;
};

export type GCPImageTagsListProps = {
  gcpRowData: GCPTableRowData;
  imagesList: ImageInfoObj[];
  isRequestLoading: boolean;
  isLoadingMoreImages: boolean;
  selectedImage: ImageInfoObj;
  onSelectImage: (image: ImageInfoObj) => void;
  onSubmit: VoidFunction;
  loadMore: VoidFunction;
  onCancelGCPTagging: VoidFunction;
  displayUntagGcpModal: VoidFunction;
  taggedImageIds: Immutable.Set<string>;
  isLoadingUntag: boolean;
};

export type GCPImageTagPreviewProps = {
  selectedImage: ImageInfoObj;
  onTagImage: (markedImage: GCPImageTagData) => void;
  onRemoveTag: (imageData: ImageInfoObj) => void;
  taggedImageIds: Immutable.Set<string>;
  taggedData?: GCPImageTagData;
};

export type GCPTagExitConfirmationModalProps = {
  show: boolean;
  onHide: VoidFunction;
  handleExitWithoutSaving: VoidFunction;
  handleExitAndSave: VoidFunction;
};

export type UntagGcpModalProps = {
  show: boolean;
  isLoadingUntagGcp: boolean;
  onClose: () => void;
  onUntagGcp: () => void;
  gcpName: string;
  gcpType: string;
};
