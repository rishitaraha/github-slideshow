import React, { useState } from 'react';
import { FaDrawPolygon, FaChartLine, FaTools, FaBorderStyle } from 'react-icons/fa';
import { MdGrain, MdImportExport, MdOutlineClose } from 'react-icons/md';
import { GrSelect } from 'react-icons/gr';
import { RiText } from 'react-icons/ri';
import { BiLayer } from 'react-icons/bi';
import { replace, useNavigate } from 'react-router-dom';
import { CesiumViewer } from '@aus-platform/cesium';
import { theme } from '../../shared/theme-style';
import PolygonDrawingTool from '../toolbar/polygon-drawing-tool';
import {
  Sidebar,
  SidebarExpanded,
  SidebarExpandedContainer,
  SidebarExpandedDivider,
  SidebarExpandedHeader,
  SidebarExpandedWrapper,
  SidebarLogo,
  SidebarMenuItem,
  SidebarMenuItemText,
  ToolTitle
} from './sidebar-styles';
import LineDrawingTool from '../toolbar/line-drawing-tool';
import PointDrawingTool from '../toolbar/point-drawing-tool';
import SelectTool from '../toolbar/select-tool';
import { ImportWKTorGeoJSON } from '../common/import-wkt-geojson';
import { ExportToWKTorGeoJson } from '../common/export-to-wkt-json';
import StyleTool from '../toolbar/style-tool';
import TextTool from '../toolbar/text-tool';
import LayerTool from '../toolbar/layer-tool';
import { Common } from '../common';

interface SidebarWrapperProps {
  viewer: CesiumViewer;
  enable: boolean;
}

const Header = ({ title, onClickHideExpanded }) => (
  <SidebarExpandedHeader>
    <ToolTitle>{title}</ToolTitle>
    <MdOutlineClose onClick={onClickHideExpanded} />
  </SidebarExpandedHeader>
);

export const SidebarWrapper = ({ enable, viewer }: SidebarWrapperProps) => {
  const navigate = useNavigate();
  const [isOpenPolygon, setIsOpenPolygon] = useState(false);
  const [isOpenLine, setIsOpenLine] = useState(false);
  const [isOpenPoint, setIsOpenPoint] = useState(false);
  const [isOpenTools, setIsOpenTools] = useState(false);
  const [isOpenImport, setIsOpenImport] = useState(false);
  const [isOpenExport, setIsOpenExport] = useState(false);
  const [isOpenSelect, setIsOpenSelect] = useState(false);
  const [isOpenStyle, setIsOpenStyle] = useState(false);
  const [isOpenText, setIsOpenText] = useState(false);
  const [isOpenLayer, setIsOpenLayer] = useState(false);
  const [toolTitle, setToolTitle] = useState('');
  const isExpanded =
    isOpenPolygon ||
    isOpenLine ||
    isOpenPoint ||
    isOpenTools ||
    isOpenImport ||
    isOpenExport ||
    isOpenSelect ||
    isOpenText ||
    isOpenLayer ||
    isOpenStyle;

  const initialize = () => {
    setIsOpenPolygon(false);
    setIsOpenLine(false);
    setIsOpenPoint(false);
    setIsOpenTools(false);
    setIsOpenImport(false);
    setIsOpenExport(false);
    setIsOpenSelect(false);
    setIsOpenStyle(false);
    setIsOpenText(false);
    setIsOpenLayer(false);
    setToolTitle('');
  };

  const onClickHideExpanded = () => {
    initialize();
  };

  const onClickPolygonTool = () => {
    initialize();
    setIsOpenPolygon(!isOpenPolygon);
    setToolTitle('Polygon Tool');
  };

  const onClickLineTool = () => {
    initialize();
    setIsOpenLine(!isOpenLine);
    setToolTitle('Line Tool');
  };

  const onClickPointTool = () => {
    initialize();
    setIsOpenPoint(!isOpenPoint);
    setToolTitle('Point Tool');
  };

  const onClickTools = () => {
    initialize();
    setIsOpenTools(!isOpenTools);
    setToolTitle('Common Tool');
  };

  const onClickImportTools = () => {
    initialize();
    setIsOpenImport(!isOpenImport);
    setToolTitle('WKT/GeoJSON Import');
  };

  const onClickExportTools = () => {
    initialize();
    setIsOpenExport(!isOpenExport);
    setToolTitle('WKT/GeoJSON Output');
  };

  const onClickSelectTools = () => {
    initialize();
    setIsOpenSelect(!isOpenSelect);
    setToolTitle('Select Tool');
  };

  const onClickStyleTool = () => {
    initialize();
    setIsOpenStyle(!isOpenStyle);
    setToolTitle('Style Tool');
  };

  const onClickTextTool = () => {
    initialize();
    setIsOpenText(!isOpenText);
    setToolTitle('Text Tool');
  };

  const onClickLayerTools = () => {
    initialize();
    setIsOpenLayer(!isOpenLayer);
    setToolTitle('Layer Tool');
  };

  const onClickSwipeTools = () => {
    navigate('/split-viewer', { replace: true })
  }

  return (
    <>
      <Sidebar>
        <SidebarLogo />
        <SidebarMenuItem onClick={onClickPolygonTool}>
          <FaDrawPolygon size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Polygon</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickLineTool}>
          <FaChartLine size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Line</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickPointTool}>
          <MdGrain size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Point</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickTools}>
          <FaTools size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Tools</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickImportTools}>
          <MdImportExport size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Import</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickExportTools}>
          <MdImportExport size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Export</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickSelectTools}>
          <GrSelect size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Select</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickStyleTool}>
          <FaBorderStyle size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Style</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickTextTool}>
          <RiText size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Text</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickLayerTools}>
          <BiLayer size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Layer</SidebarMenuItemText>
        </SidebarMenuItem>
        <SidebarMenuItem onClick={onClickSwipeTools}>
          <BiLayer size={theme.sidebar.menuIconSize} color={theme.sidebar.menuItemColor} />
          <SidebarMenuItemText>Swiper</SidebarMenuItemText>
        </SidebarMenuItem>
      </Sidebar>
      <SidebarExpanded>
        <SidebarExpandedWrapper
          className={isExpanded ? 'expanded-sidebar expanded-sidebar--active' : 'expanded-sidebar'}
        >
          <Header title={toolTitle} onClickHideExpanded={onClickHideExpanded} />
          <SidebarExpandedDivider />
          <SidebarExpandedContainer>
            {isOpenPolygon && (
              <PolygonDrawingTool id="polygon-drawing-tool" enabled={enable} viewer={viewer} />
            )}
            {isOpenLine && (
              <LineDrawingTool id="line-drawing-tool" enabled={enable} viewer={viewer} />
            )}
            {isOpenPoint && (
              <PointDrawingTool id="point-drawing-tool" enabled={enable} viewer={viewer} />
            )}
            {isOpenTools && <Common viewer={viewer} />}
            {isOpenImport && <ImportWKTorGeoJSON viewer={viewer} />}
            {isOpenExport && <ExportToWKTorGeoJson viewer={viewer} />}
            {isOpenSelect && <SelectTool id="select-tool" enabled={enable} viewer={viewer} />}
            {isOpenStyle && <StyleTool id="style-tool" enabled={enable} viewer={viewer} />}
            {isOpenText && <TextTool id="text-tool" enabled={enable} viewer={viewer} />}
            {isOpenLayer && <LayerTool id="layer-tool" enabled={enable} viewer={viewer} />}
          </SidebarExpandedContainer>
        </SidebarExpandedWrapper>
      </SidebarExpanded>
    </>
  );
};
