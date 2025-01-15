import { FeatureLike } from 'ol/Feature';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { WebGLStyle } from 'ol/style/webgl';
import {
  BlueYellowPointIcon,
  CheckpointTaggedIcon,
  CheckpointUntaggedIcon,
  GcpTaggedIcon,
  GcpUntaggedIcon,
  GeotagIcon,
  GeotagUnalignedIcon,
  GreenPinIcon,
  LocationPinFill,
  YellowPointIcon,
} from 'src/assets/images';

export const GeotagImageBlueIconStyle: WebGLStyle = {
  'icon-src': GeotagIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

export const GeotagImageYellowIconStyle: WebGLStyle = {
  'icon-src': GeotagUnalignedIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

export const GcpTaggedStyle: WebGLStyle = {
  'icon-src': GcpTaggedIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

export const GcpUntaggedStyle: WebGLStyle = {
  'icon-src': GcpUntaggedIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

export const CheckpointTaggedStyle: WebGLStyle = {
  'icon-src': CheckpointTaggedIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

export const CheckpointUntaggedStyle: WebGLStyle = {
  'icon-src': CheckpointUntaggedIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

export const dashedDrawingStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 1)',
    lineDash: [10, 10],
    width: 2,
  }),
});

export const blueDrawingStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 1)',
    width: 2,
  }),
});

export const geotagStyle: WebGLStyle = {
  'icon-src': GeotagIcon,
  'icon-opacity': 1,
  'icon-color': 'white',
};

const labelTextStyle = (feature: FeatureLike) =>
  new Text({
    textAlign: 'center',
    textBaseline: 'middle',
    font: '400 10px Nunito',
    text: feature.get('name'),
    fill: new Fill({ color: '#000' }),
    stroke: new Stroke({
      color: '#fff',
      width: 4,
    }),
    offsetY: -15,
  });

export const taggedGcpMarkerStyle = (feature: FeatureLike) =>
  new Style({
    image: new Icon({
      opacity: 1,
      src: GcpTaggedIcon,
      scale: 1,
      color: '#FFF500',
    }),
    text: labelTextStyle(feature),
  });

export const untaggedGcpMarkerStyle = (feature: FeatureLike) =>
  new Style({
    image: new Icon({
      opacity: 1,
      src: GcpUntaggedIcon,
      scale: 1,
    }),
    text: labelTextStyle(feature),
  });

export const taggedCheckpointMarkerStyle = (feature: FeatureLike) =>
  new Style({
    image: new Icon({
      opacity: 1,
      src: CheckpointTaggedIcon,
      scale: 1,
      color: '#FFF500',
    }),
    text: labelTextStyle(feature),
  });

export const unTaggedCheckpointMarkerStyle = (feature: FeatureLike) =>
  new Style({
    image: new Icon({
      opacity: 1,
      src: CheckpointUntaggedIcon,
      scale: 1,
    }),
    text: labelTextStyle(feature),
  });

export const blueLineStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(38, 116, 186, 1)',
    width: 3,
  }),
  fill: new Fill({
    color: 'rgba(38, 116, 186, 0.15)',
  }),
});

export const blueYellowPointStyle = new Style({
  image: new Icon({
    src: BlueYellowPointIcon,
  }),
});

export const blueYellowEditStyle = new Style({
  image: new Icon({
    src: BlueYellowPointIcon,
  }),
});

export const yellowPointStyle = new Style({
  image: new Icon({
    src: YellowPointIcon,
  }),
});

export const yellowLineStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(255, 245, 0, 1)',
    width: 3,
  }),
  fill: new Fill({
    color: 'rgba(255, 245, 0, 0.1)',
  }),
});

export const yellowEditStyle = new Style({
  image: new Icon({
    src: YellowPointIcon,
  }),
});

export const yellowPinStyle = new Style({
  image: new Icon({
    opacity: 1,
    src: LocationPinFill,
    scale: 1,
    displacement: [-0.75, 10.5],
  }),
});

export const greenLabelTextStyle = (feature: FeatureLike) =>
  new Text({
    textAlign: 'center',
    textBaseline: 'bottom',
    font: 'bold 12px Nunito',
    text: feature.get('label'),
    fill: new Fill({ color: '#3A3A3A' }),
    backgroundFill: new Fill({ color: '#43FF00' }),
    backgroundStroke: new Stroke({
      width: 15,
      color: '#43FF00',
      lineCap: 'round',
    }),
    padding: [-5, -2, -5, -2],
    offsetY: -18,
  });

export const greenLineStyle = (feature) =>
  new Style({
    stroke: new Stroke({
      color: 'rgba(67, 255, 0, 1)',
      width: 2,
    }),
    text: greenLabelTextStyle(feature),
  });

export const greenPointStyle = (feature) =>
  new Style({
    image: new Icon({
      src: GreenPinIcon,
    }),
    text: greenLabelTextStyle(feature),
  });

const spotCheckLabelText = (feature) =>
  new Text({
    textAlign: 'center',
    textBaseline: 'bottom',
    font: 'bold 12px Nunito',
    text: feature['label'],
    fill: new Fill({ color: '#3A3A3A' }),
    backgroundFill: new Fill({ color: '#F9CC34' }),
    backgroundStroke: new Stroke({
      width: 15,
      color: '#F9CC34',
      lineCap: 'round',
    }),
    padding: [-5, -2, -5, -2],
    offsetY: -26,
  });

export const spotCheckMarkerStyle = (feature) =>
  new Style({
    image: new Icon({
      opacity: 1,
      src: LocationPinFill,
      scale: 1,
      displacement: [-1, 10.5],
    }),
    text: spotCheckLabelText(feature),
  });
