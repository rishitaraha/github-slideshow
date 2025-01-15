import * as Sentry from '@sentry/react';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectMap3dWorkspace,
  setShowUnsavedFeaturesModal,
} from '../map-3d/shared/map-3d-slices';
import { OrgSettingsModal } from '../org-settings';
import { Profile } from '../profile';
import { useLoggedUser } from '../shared/api';
import { GlobalContext, HeaderTitleContext } from '../shared/context';
import { UserLocalDataManager, isAppOpenInIframe } from '../shared/helpers';
import { AccordionSideNav, Header, HeaderTitle } from './components';
import {
  NavItemData,
  SideCardType,
} from './components/accordion-sidenav/types';
import { noHeaderPaths } from './constants';
import { navItems } from './helpers';
import { ModuleRoute } from 'shared/enums';

const initialSideCardState: SideCardType = {
  primary: false,
  secondary: false,
};

export const Home: React.FC = () => {
  // Contexts.
  const { setLoggedUser } = useContext(GlobalContext);

  // States.
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerBackButtonRoute, setHeaderBackButtonRoute] = useState('');
  const [showSideCard, setShowSideCard] =
    useState<SideCardType>(initialSideCardState);
  const [showUpdateDetailsModal, setShowUpdateDetailsModal] = useState(false);
  const [showOrgSettingsModal, setShowOrgSettingsModal] = useState(false);
  const location = useLocation();

  // Dispatchers.
  const dispatch = useAppDispatch();

  // Selectors.
  const { drawingTools } = useAppSelector(selectMap3dWorkspace);

  // Conditional variables.
  const enableFullFrame =
    !headerTitle && location.pathname !== ModuleRoute.Dashboard;

  // Hooks.
  // Enabled only when org access token is not present.
  const { data: loggedUserResponse, isSuccess: loggedUserIsSuccess } =
    useLoggedUser(!isAppOpenInIframe());

  // useEffects.
  useEffect(() => {
    if (loggedUserIsSuccess && loggedUserResponse) {
      setLoggedUser(loggedUserResponse.data);
      const userName =
        loggedUserResponse.data.firstName +
        ' ' +
        loggedUserResponse.data.lastName;
      Sentry.setUser({
        email: loggedUserResponse.data.email,
        username: userName,
        ip_address: '{{auto}}',
      });
      UserLocalDataManager.saveUserName(userName);
    }
  }, [loggedUserResponse]);

  useEffect(() => {
    if (!isEmpty(headerTitle)) {
      if (
        noHeaderPaths.includes(location.pathname) ||
        location.pathname.startsWith('/processing')
      ) {
        setHeaderTitle('');
      }
    }
  }, [location]);

  // Handlers.
  const openSideNavFunc = () => {
    setShowSideCard({ primary: true, secondary: false });
  };

  const closeSideNav = () => {
    setShowSideCard({ primary: false, secondary: false });
  };

  const onClickSideNavItem = (navItemData: NavItemData) => {
    if (
      navItemData.itemName !== '3D Map' &&
      drawingTools?.checkUnsavedFeatures()
    ) {
      dispatch(setShowUnsavedFeaturesModal(true));
      return;
    }

    if (navItemData.itemName === 'Org Settings') {
      openOrgSettingsModal();
    }

    closeSideNav();
  };

  // Modal Handlers.
  const closeUpdateDetailsModal = () => setShowUpdateDetailsModal(false);
  const openUpdateDetailsModal = () => setShowUpdateDetailsModal(true);

  const closeOrgSettingsModal = () => setShowOrgSettingsModal(false);
  const openOrgSettingsModal = () => setShowOrgSettingsModal(true);

  return (
    <>
      <div className="home">
        <HeaderTitleContext.Provider
          value={{
            headerTitle,
            setHeaderTitle,
            showSideCard,
            setShowSideCard,
            openOrgSettingsModal,
            headerBackButtonRoute: headerBackButtonRoute,
            setHeaderBackButtonRoute: setHeaderBackButtonRoute,
          }}
        >
          {!isAppOpenInIframe() && (
            <>
              <Header
                onClick={openSideNavFunc}
                showSideCard={showSideCard}
                onClose={closeSideNav}
                openUpdateDetailsModal={openUpdateDetailsModal}
              />

              <AccordionSideNav
                showSideCard={showSideCard}
                onClose={closeSideNav}
                onClickSideNavItem={onClickSideNavItem}
                navItems={navItems}
              />
            </>
          )}
          <div
            className={classNames([
              'screens-container',
              enableFullFrame && 'full-frame',
            ])}
          >
            {!isAppOpenInIframe() && (
              <>
                <Profile
                  show={showUpdateDetailsModal}
                  closeProfile={closeUpdateDetailsModal}
                />

                <OrgSettingsModal
                  show={showOrgSettingsModal}
                  onClose={closeOrgSettingsModal}
                />
              </>
            )}

            {headerTitle && <HeaderTitle text={headerTitle} />}
            <Outlet />
          </div>
        </HeaderTitleContext.Provider>
      </div>
    </>
  );
};
