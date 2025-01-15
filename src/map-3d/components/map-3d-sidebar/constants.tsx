import {
  IconIdentifier,
  SideBarOption,
  SideCardType,
} from '@aus-platform/design-system';
import { FeatureFlag } from '../../../shared/enums';
import {
  Map3DBaseLayer,
  Map3DContour,
  Map3DElevationTool,
  Map3DHeapManagement,
  Map3DLegend,
  Map3DWorkspace,
} from './components';
import { AdditionalInformation } from './components/additional-information';
import { HRASidecard } from './components/haul-road-analytics';
import { Map3DRoadAnalytics } from './components/map-3d-generate-analytics';
import { Map3DSlopeMap } from './components/map-3d-slope-map';
import { Map3DSidebarOption } from './shared/enums';
import { Map3DSmartDetect } from './components/map-3d-smart-detect';

// Contains different components for map-3d side-card
// which renders when iterated through sidebar.
export const map3dSidebarItems: SideBarOption[] = [
  {
    icon: { identifier: IconIdentifier.LayerFilled, toolTipText: 'Workspace' },
    cardProps: {
      title: Map3DSidebarOption.Workspace,
      component: <Map3DWorkspace />,
    },
    isHidden: true,
    sidecardType: SideCardType.Custom,
  },
  {
    icon: {
      identifier: IconIdentifier.Elevation,
      toolTipText: 'Elevation Profile',
    },
    cardProps: {
      title: Map3DSidebarOption.ElevationTool,
      component: <Map3DElevationTool />,
    },
    isHidden: true,
    sidecardType: SideCardType.Custom,
  },
  {
    icon: {
      identifier: IconIdentifier.Heap,
      toolTipText: 'Volume Calculation',
    },
    cardProps: {
      title: Map3DSidebarOption.VolumeCalculation,
      component: <Map3DHeapManagement />,
    },
    isHidden: true,
  },
  {
    icon: { identifier: IconIdentifier.Contour, toolTipText: 'Contour' },
    cardProps: {
      title: Map3DSidebarOption.Contour,
      component: <Map3DContour />,
    },
    isHidden: true,
  },
  {
    icon: { identifier: IconIdentifier.SlopeMap, toolTipText: 'Slope Map' },
    cardProps: {
      title: Map3DSidebarOption.SlopeMap,
      component: <Map3DSlopeMap />,
    },
    isHidden: true,
  },
  {
    icon: {
      identifier: IconIdentifier.RoadEdit,
      toolTipText: 'Generate Analytics',
    },
    cardProps: {
      title: Map3DSidebarOption.GenerateAnalytics,
      component: <Map3DRoadAnalytics />,
    },
    isHidden: true,
  },
  {
    icon: {
      identifier: IconIdentifier.AnalyticsAi,
      toolTipText: 'Smart Detect',
    },
    cardProps: {
      title: Map3DSidebarOption.SmartDetect,
      component: <Map3DSmartDetect />,
    },
    isHidden: true,
  },
  {
    icon: {
      identifier: IconIdentifier.RoadAnalytics,
      toolTipText: 'Haul Road Analytics',
    },
    cardProps: {
      title: Map3DSidebarOption.HaulRoadAnalytics,
      component: <HRASidecard />,
    },
    isHidden: true,
    sidecardType: SideCardType.Custom,
  },
  {
    icon: {
      identifier: IconIdentifier.QuestionCircleFill,
      toolTipText: 'Legend',
    },
    cardProps: {
      title: Map3DSidebarOption.Legend,
      component: <Map3DLegend />,
    },
    isHidden: true,
  },
  {
    icon: {
      identifier: IconIdentifier.InfoCircle,
      toolTipText: 'Additional Information',
    },
    cardProps: {
      title: Map3DSidebarOption.AdditionalInformation,
      component: <AdditionalInformation />,
    },
    isHidden: true,
  },
  {
    icon: { identifier: IconIdentifier.Earth, toolTipText: 'Base Map' },
    cardProps: {
      title: Map3DSidebarOption.BaseMap,
      component: <Map3DBaseLayer />,
    },
    isOutsideSidecard: true,
    isHidden: true,
  },
];

export const map3dSidebarFeatureFlags = {
  [Map3DSidebarOption.GenerateAnalytics]: FeatureFlag.GenerateAnalytics,
  [Map3DSidebarOption.SlopeMap]: FeatureFlag.SlopeMap,
  [Map3DSidebarOption.HaulRoadAnalytics]: FeatureFlag.HaulRoadAnalytics,
};
