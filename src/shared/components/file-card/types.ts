export type FileCardProps = {
  fileName: string;
  fileSize: string;
  showDeleteBtn?: boolean;
  onDownloadClick: () => void;
  onDeleteBtnClick: () => void;
  deleteBtnDataTestId?: string;
  fileCardDataTestId?: string;
};
