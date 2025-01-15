import {
  ColorClass,
  Icon,
  IconIdentifier,
  Placement,
  SideCard,
  SideCardLocation,
  Spinner,
  Tooltip,
} from '@aus-platform/design-system';
import { startCase } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Image } from '../../../assets/images';
import {
  handleResponseMessage,
  useMyOrg,
  useUploadLogo,
} from '../../../shared/api';
import { GlobalContext } from '../../../shared/context';
import { isOrgAdmin } from '../../../shared/helpers';
import { AccordionSideNavItems } from './components/accordion-sidenav-items';
import { NavItemData, NavItemGroup, SideCardType } from './types';

type SideNavProps = {
  showSideCard: SideCardType;
  onClose: () => void;
  onClickSideNavItem: (navItemData: NavItemData) => void;
  navItems: NavItemGroup[];
};

export const AccordionSideNav: React.FC<SideNavProps> = ({
  showSideCard,
  onClose,
  navItems,
  onClickSideNavItem,
}) => {
  // useContexts.
  const { loggedUser } = useContext(GlobalContext);

  // useRefs.
  const logoInputRef = useRef<HTMLInputElement>(null);

  // States.
  const [logo, setLogo] = useState(Image.LogoFill);

  // API Hooks.
  const { data: myOrgResponse, isSuccess: myOrgResponseIsSuccess } = useMyOrg();
  const {
    mutate: uploadLogo,
    data: uploadLogoResponse,
    isError: isErrorUploadLogo,
    isPending: isLoadingUploadLogo,
    isSuccess: isSuccessUploadLogo,
    error: uploadLogoError,
  } = useUploadLogo();

  // useEffects.
  useEffect(() => {
    if (myOrgResponse && myOrgResponseIsSuccess && myOrgResponse.data.logo) {
      setLogo(myOrgResponse.data.logo);
    }
  }, [myOrgResponse, myOrgResponseIsSuccess]);

  useEffect(() => {
    if (
      isSuccessUploadLogo &&
      uploadLogoResponse &&
      uploadLogoResponse.data.logo
    ) {
      setLogo(uploadLogoResponse.data.logo);
    }
    handleResponseMessage(
      isSuccessUploadLogo,
      isErrorUploadLogo,
      uploadLogoResponse,
      uploadLogoError,
    );
  }, [isSuccessUploadLogo, isErrorUploadLogo]);

  // Handlers.
  const onLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedLogo = event.target.files?.[0];
    if (uploadedLogo) {
      uploadLogo(uploadedLogo);
    }
  };

  return (
    <SideCard
      // TODO: Refactor sidenav to use header children instead of title.
      title={
        <div className="accordion-sidenav__title">
          <div className="accordion-sidenav__title__logo-container">
            <img
              className={
                'accordion-sidenav__title__logo ' +
                (isLoadingUploadLogo ? 'blur' : '')
              }
              src={logo}
            />
            {loggedUser && isOrgAdmin(loggedUser) && (
              <>
                {isLoadingUploadLogo ? (
                  <Spinner />
                ) : (
                  <div
                    className="accordion-sidenav__title__logo__upload-btn"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Icon
                      identifier={IconIdentifier.Upload}
                      size={15}
                      colorClass={ColorClass.White}
                    />
                    <input
                      type="file"
                      className="d-none"
                      accept=".jpg, .jpeg"
                      ref={logoInputRef}
                      onChange={onLogoSelect}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="accordion-sidenav__title__org-name-container">
            <Tooltip
              hoverText={myOrgResponse?.data.name}
              placement={Placement.Right}
            >
              <h6 className="accordion-sidenav__title__org-name">
                {myOrgResponse?.data.name}
              </h6>
            </Tooltip>
            <span>You have {startCase(loggedUser?.type)} Access</span>
          </div>
        </div>
      }
      show={showSideCard.primary}
      onClose={onClose}
      backdrop={true}
      placement={SideCardLocation.Start}
      showCloseButton={false}
      className="accordion-sidenav"
    >
      <AccordionSideNavItems
        navItems={navItems}
        onClickSideNavItem={onClickSideNavItem}
      />

      <footer className="accordion-sidenav__footer">
        <div className="accordion-sidenav__footer__copyright">
          © Copyright 2022, Aarav Unmanned Systems. All Rights Reserved.
        </div>
        <div className="accordion-sidenav__footer__org-name">
          <span>
            Powered by <img src={Image.AereoWhiteLogo} draggable={false} />
          </span>
        </div>
      </footer>
    </SideCard>
  );
};
