import React, { useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';


type InteractiveMapProps = {
  center: [number, number];
  zoom: number;
  markers: React.ReactElement[];
};

const InteractiveMap = ({ center, zoom, markers }: InteractiveMapProps) => {

  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setCenter({ lat: center[0], lng: center[1] });
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);

  return (
    <div className='border-2 border-slate-500 rounded-lg shadow-lg'>

      <Map
        style={{ width: '50vw', height: '50vh' }}
        defaultCenter={{ lat: center[0], lng: center[1] }}
        defaultZoom={zoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        {markers}
      </Map>
    </div>


  );

}

export default InteractiveMap;