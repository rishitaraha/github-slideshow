export type ProjectCardProps = {
  name: string;
  onEdit: () => void;
  onClick: () => void;
  index: number;
  date?: string;
  sites?: number;
};
