import styled from 'styled-components';
import { theme } from '../../shared/theme-style';

export const Sidebar = styled.nav`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${theme.sidebar.width}px;
  background-color: ${theme.sidebar.backgroundColor};
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  box-shadow: 0 0.25rem 0.25rem rgba(0, 0, 0, 0.3);
  transition: all 0.4s ease-in-out;
  z-index: 10;
`;

export const SidebarExpanded = styled.div`
  .expanded-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    overflow-y: scroll;
    width: ${theme.sidebar.expandedWidth}px;
    background-color: ${theme.sidebar.expandedBackgroundColor};
    z-index: 0;
    transition: all 0.4s ease-in-out;
    transform: translateX(-${theme.sidebar.expandedWidth}px);
    backface-visibility: hidden;

    &--active {
      width: ${theme.sidebar.expandedWidth}px;
      transform: translateX(${theme.sidebar.width}px);
      z-index: 1;
    }

    ::-webkit-scrollbar {
      width: 3px;
    }
    ::-webkit-scrollbar-button {
      background: ${theme.sidebar.expandedBackgroundColor};
    }
    ::-webkit-scrollbar-track-piece {
      background: ${theme.sidebar.expandedBackgroundColor};
    }
    ::-webkit-scrollbar-thumb {
      background: #777;
    }
  }
`;

export const SidebarMenuItem = styled.div`
  display: flex;
  width: ${theme.sidebar.menuItemWidth}px;
  height: ${theme.sidebar.menuItemHeight}px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: ${theme.sidebar.menuItemSpace}px;
  cursor: pointer;
`;

export const SidebarLogo = styled.div`
  display: flex;
  width: ${theme.sidebar.menuItemWidth}px;
  height: ${theme.sidebar.menuItemHeight}px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const SidebarMenuItemText = styled.p`
  padding: 2px 0 0 0;
  margin: 0;
  font-size: ${theme.text.small}px;
  color: ${theme.sidebar.menuItemColor};
`;

export const SidebarExpandedWrapper = styled.div``;

export const SidebarExpandedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
`;

export const SidebarExpandedDivider = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${theme.divider.backgroundColor};
`;

export const ToolTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

export const SidebarExpandedContainer = styled.div`
  /* padding: 15px; */
`;
