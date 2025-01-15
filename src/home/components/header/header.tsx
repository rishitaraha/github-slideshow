import {
  DropDownButton,
  DropDownButtonDirection,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Image } from '../../../assets';
import {
  selectMap3dWorkspace,
  setShowUnsavedFeaturesModal,
} from '../../../map-3d/shared/map-3d-slices';
import { history } from '../../../shared/constants';
import { UserLocalDataManager } from '../../../shared/helpers/local-storage-managers/user-manager';
import { SideCardType } from '../accordion-sidenav/types';

type HeaderType = {
  onClick: () => void;
  onClose: () => void;
  showSideCard: SideCardType;
  openUpdateDetailsModal: () => void;
};

export const Header: React.FC<HeaderType> = ({
  onClick,
  onClose,
  showSideCard,
  openUpdateDetailsModal,
}) => {
  // Dispatchers.
  const dispatch = useAppDispatch();

  // Selectors.
  const { drawingTools } = useAppSelector(selectMap3dWorkspace);

  // Handlers.
  // Prevent logout and redirection to / when there are unsaved features.
  const onLogoutBtnClick = () => {
    if (drawingTools?.checkUnsavedFeatures()) {
      dispatch(setShowUnsavedFeaturesModal(true));
      return;
    }
    history.push('/logout');
  };

  const onLogoClick = () => {
    if (drawingTools?.checkUnsavedFeatures()) {
      dispatch(setShowUnsavedFeaturesModal(true));
      return;
    }
    history.push('/');
  };

  // Render.
  return (
    <div className="header">
      {showSideCard.primary ? (
        <Icon
          identifier={IconIdentifier.Cross}
          size={32}
          cursor={true}
          className="header__navbar"
          onClick={() => onClose()}
        />
      ) : (
        <Icon
          identifier={IconIdentifier.HamburgerMenu}
          size={32}
          cursor={true}
          className="header__navbar"
          onClick={() => onClick()}
        />
      )}

      <div onClick={onLogoClick} className="header__title">
        <img
          className="header__title__logo"
          alt="Aereo Logo"
          src={Image.AereoCloudLogoWhite}
          draggable={false}
        />
      </div>
      <div className="header__dropdown">
        <DropDownButton
          btnText={UserLocalDataManager.getUserName()?.toString()}
          separator={true}
          rightIconIdentifier={IconIdentifier.ChevronSmallDown}
          btnProps={{ className: 'header__dropdown-btn' }}
          onClick={() => onClose()}
          drop={DropDownButtonDirection.Down}
          data-testid="test-dropdown-id"
        >
          <DropDownButton.Item
            className="header__dropdown__item"
            onClick={openUpdateDetailsModal}
          >
            Update Details
          </DropDownButton.Item>
          <DropDownButton.Item
            className="header__dropdown__item logout"
            onClick={onLogoutBtnClick}
          >
            Log Out
          </DropDownButton.Item>
        </DropDownButton>
      </div>
    </div>
  );
};
