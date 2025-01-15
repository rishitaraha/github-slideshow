export type RenameValues = {
  name: string;
};

export type RenameModalProps = {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: RenameValues) => void;
  title: string;
  value: string;
};
