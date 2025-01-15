import React, { Dispatch, SetStateAction } from 'react';
import { LoggedUser } from '../api';

type GlobalContextType = {
  loggedUser: LoggedUser | undefined;
  setLoggedUser: Dispatch<SetStateAction<LoggedUser | undefined>>;
};

export const GlobalContext = React.createContext<GlobalContextType>({
  loggedUser: undefined,
  setLoggedUser: () => {},
});
