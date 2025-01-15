import { ColorClass, Icon, IconIdentifier } from '@aus-platform/design-system';
import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HeaderTitleContext } from 'shared/context';
import { ModuleRoute } from 'shared/enums';

type HeaderTitleProps = {
  text: string;
};

const routesWithNoBackButton = [
  ModuleRoute.Dashboard.toString(),
  ModuleRoute.Users.toString(),
  ModuleRoute.UserGroups.toString(),
  ModuleRoute.Projects.toString(),
  ModuleRoute.AccessTags.toString(),
];

export const HeaderTitle: React.FC<HeaderTitleProps> = ({ text }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { headerBackButtonRoute } = useContext(HeaderTitleContext);
  const showBackButton = !routesWithNoBackButton.includes(location.pathname);

  const onBackButtonClick = () => {
    navigate(headerBackButtonRoute);
  };

  return (
    <div className="header-title header-txt-1 bold-txt">
      {showBackButton && (
        <Icon
          identifier={IconIdentifier.ArrowLeft}
          colorClass={ColorClass.Neutral300}
          onClick={onBackButtonClick}
          className="me-3 cursor-pointer"
        />
      )}
      <span>{text}</span>
    </div>
  );
};
