"use client";

import React, { useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import useMediaQuery from '@/lib/media-query';


type InteractiveMapProps = {
  center: [number, number];
  zoom: number;
  markers: React.ReactElement[];
};

const InteractiveMap = ({ center, zoom, markers }: InteractiveMapProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setCenter({ lat: center[0], lng: center[1] });
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);

  return (
    <div className='border-2 border-slate-500 rounded-lg shadow-lg my-2'>

      <Map
        style={{ width: isMobile ? '80vw' : '50vw', height: isMobile ? '80vh' : '50vh' }}
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