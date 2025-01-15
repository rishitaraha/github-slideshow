import { createContext } from 'react';
import { Map3DSideBarContextType } from './types';

export const Map3DSideBarContext = createContext<Map3DSideBarContextType>({
  activeOptionHandler: () => {},
  hideSidecard: () => {},
});
