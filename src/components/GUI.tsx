// q@ts-nocheck
/* qeslint-disable */
import React from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import logger from 'loglevel';
import { GUIProps } from './types';
import { SidebarWrapper } from './sidebar/sidebar-wrapper';
import { ShortcutUI } from './shortcut-ui/shortcut-ui';

const GUI = ({ viewer }: GUIProps) => {
  if (!viewer) {
    logger.error('failed to get viewer in GUI');
    return null;
  }

  return (
    <ReactFlowProvider>
      <SidebarWrapper enable viewer={viewer} />
      <ShortcutUI viewer={viewer} />
    </ReactFlowProvider>
  );
};

export default GUI;
