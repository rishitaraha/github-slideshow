import { Icon } from '@aus-platform/design-system';
import { isNull } from 'lodash';
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../../app/hooks';
import { selectMap3dWorkspace } from '../../../../map-3d/shared/map-3d-slices';
import { orgAdminRoutes } from '../../../../shared/components/protected-route';
import { GlobalContext } from '../../../../shared/context';
import { isOrgAdmin } from '../../../../shared/helpers';
import { NavItemData, NavItemGroup } from '../types';

type AccordionSideNavTypes = {
  navItems: NavItemGroup[];
  onClickSideNavItem: (navItemData: NavItemData) => void;
};

export const AccordionSideNavItems: React.FC<AccordionSideNavTypes> = ({
  navItems,
  onClickSideNavItem,
}) => {
  // Selectors.
  const { drawingTools } = useAppSelector(selectMap3dWorkspace);

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // States.
  const location = useLocation();
  let prevSelectedItem = 'Dashboard';

  // Function for rendering horizontal rule
  const renderHR = (itemName: string) => {
    if (prevSelectedItem !== itemName) {
      prevSelectedItem = itemName;
      return <hr className="accordion-sidenav-item__divider" />;
    }
    return null;
  };

  // Handlers.
  const onClickNavigateTo = (event, item) => {
    const hasUnsavedFeatures =
      drawingTools?.checkUnsavedFeatures() && item.itemName !== '3D Map';

    if (hasUnsavedFeatures) {
      event.preventDefault();
    }

    onClickSideNavItem(item);
  };

  return (
    <div className="accordion-sidenav-item-container">
      {navItems.map((navItem) => {
        return navItem.items.map((item, innerIdx) => {
          // To hide navItem if the user is not org admin.
          if (
            !isOrgAdmin(loggedUser) &&
            !isNull(item.route) &&
            orgAdminRoutes.includes(item.route)
          ) {
            return null;
          }

          // Hide nav item if feature is not enabled for user.
          else if (
            item.enableForFeature &&
            loggedUser &&
            !loggedUser.featureFlags[item.enableForFeature]
          ) {
            return null;
          } else if (
            item.includeUserRole &&
            loggedUser &&
            !item.includeUserRole.includes(loggedUser.type)
          ) {
            return null;
          }

          return (
            <Link
              to={isNull(item.route) ? {} : item.route}
              key={innerIdx}
              className="text-decoration-none"
              onClick={(event) => {
                onClickNavigateTo(event, item);
              }}
            >
              {renderHR(navItem.itemType)}
              <li
                className={
                  location.pathname === item.route
                    ? 'accordion-sidenav-item active'
                    : 'accordion-sidenav-item'
                }
              >
                <Icon
                  className="accordion-sidenav-item__item-icon"
                  identifier={item.iconIdentifier}
                />
                <span className="accordion-sidenav-item__text">
                  {item.itemName}
                </span>
              </li>
            </Link>
          );
        });
      })}
      <hr className="accordion-sidenav-item__divider" />
    </div>
  );
};
