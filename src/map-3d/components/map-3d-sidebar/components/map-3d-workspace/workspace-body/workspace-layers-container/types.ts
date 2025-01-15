export type DeleteToolOptions = {
  onBulkDeleteHandler: VoidFunction;
  isAnyLayerEditable: boolean;
};

export type GenerateToolBarItemsOptions = {
  selectedActiveLayers: Record<string, boolean | null>;
  selectedLayersCount: number;
  setSelectedActiveLayers: React.Dispatch<
    React.SetStateAction<Record<string, boolean | null>>
  >;
  deleteToolOptions: DeleteToolOptions;
};
