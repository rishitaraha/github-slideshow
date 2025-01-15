export type AddProjectSideCard = {
  show: boolean;
  onCloseSideCard: () => void;
  refetchProjects: () => void;
};

export type AddProjectInput = {
  name: string;
};
