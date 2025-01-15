import { HaulRoadDetailsLayer } from './haul-road-layer';
import { HaulRoadLayer } from 'src/shared/api';

type HaulRoadDetailsLayersProps = {
  haulRoadLayers: HaulRoadLayer[];
};

export const HaulRoadDetailsLayers: React.FC<HaulRoadDetailsLayersProps> = ({
  haulRoadLayers,
}) => {
  return (
    <div className="haul-road-details-layers">
      <div className="haul-road-details-layers__title haul-road-details-title">
        <span>Haul Road Layers</span>
        <hr />
      </div>
      <div className="haul-road-details-layers__container">
        {haulRoadLayers.map((haulRoadLayer: HaulRoadLayer, index) => (
          <HaulRoadDetailsLayer
            key={'haul-road-details-layer' + index}
            haulRoadLayer={haulRoadLayer}
          />
        ))}
      </div>
    </div>
  );
};
