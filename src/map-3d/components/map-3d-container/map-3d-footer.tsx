import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import {
  selectMap3DState,
  selectMap3dDataset,
} from '../../shared/map-3d-slices';

const Map3DFooter = () => {
  // States.
  const [mouseLocationString, setMouseLocationString] = useState('');

  // Selectors.
  const { selectedTerrainSite } = useAppSelector(selectMap3dDataset);

  // Hooks.
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // useEffect - Mount.
  useEffect(() => {
    // Set mouse location listener to update mouse location in bottom bar of 3D map.
    cesiumProxy?.setMouseLocationListener(onMouseLocationUpdate);
  }, [cesiumProxy]);

  // Handlers.
  const onMouseLocationUpdate = (newMouseLocationString: string) => {
    if (newMouseLocationString) {
      setMouseLocationString(newMouseLocationString);
    }
  };

  return (
    <footer className="map-3d-container__bottom-bar">
      <div className="map-3d-container__bottom-bar-company">AUS Pvt Ltd</div>
      <div className="map-3d-container__bottom-bar-site-name">
        {selectedTerrainSite?.name}
      </div>
      <div className="map-3d-container__bottom-bar-mouse-location">
        {mouseLocationString}
      </div>
    </footer>
  );
};

export default Map3DFooter;
