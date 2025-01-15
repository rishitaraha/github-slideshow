export type ComponentRoute = {
  route: string;
};

export type LocationState = {
  title: string;
};

export type HistogramDataType = Partial<{
  rescale: string | null;
  opacity: number;
  sourceFilePath: string | null;
  metadata: any;
}>;

export type ShowSideCardsState = { left: boolean; right: boolean };

export type StateActionType<T, P = any> = {
  type: T;
  payload?: P;
};
