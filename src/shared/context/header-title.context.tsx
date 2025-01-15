import React from 'react';
import { SideCardType } from '../../home/components/accordion-sidenav/types';

type HeaderTitleContextType = {
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  showSideCard: SideCardType;
  setShowSideCard: ({ primary, secondary }) => void;
  openOrgSettingsModal: () => void;
  headerBackButtonRoute: string;
  setHeaderBackButtonRoute: (string) => void;
};

export const HeaderTitleContext = React.createContext<HeaderTitleContextType>({
  headerTitle: '',
  setHeaderTitle: () => {},
  showSideCard: { primary: false, secondary: false },
  setShowSideCard: () => {},
  openOrgSettingsModal: () => {},
  headerBackButtonRoute: '',
  setHeaderBackButtonRoute: () => {},
});
