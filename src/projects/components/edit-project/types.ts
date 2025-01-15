export type EditProjectProps = {
  show: boolean;
  projectId: string;
  onCloseSideCard: () => void;
  refetchProjects: () => void;
};

export type EditProjectInput = {
  name: string;
};
