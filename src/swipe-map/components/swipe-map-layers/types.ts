import { Map } from 'ol';
import { ShowSideCardsState } from 'src/shared/types';

export type SwipeMapLayersProps = {
  siteId: string;
  map: Map;
  swipeRef: React.MutableRefObject<HTMLInputElement>;
  setIsLeftSideCardExpanded: (isExpanded: boolean) => void;
  setIsRightSideCardExpanded: (isExpanded: boolean) => void;
  onCloseSideCard: (showSideCards: ShowSideCardsState) => void;
  showSideCard: ShowSideCardsState;
  setShowSideCard: (showSideCards: ShowSideCardsState) => void;
};
