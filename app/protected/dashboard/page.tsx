"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Marker, APIProvider } from "@vis.gl/react-google-maps";

const InteractiveMap = dynamic(() => import('../../../components/InteractiveMap'), {
  ssr: false,
});

import { DataTable } from "../../../components/ui/data-table";
import { columns, Place, IsCloseMatch } from "../../../lib/places";
import { ComboboxDropdown } from "../../../components/ui/combobox";
import BusinessViabilitySection from "../../../components/BusinessViabilitySection";
import { Button } from "@/components/ui/button";
import { useUser } from "../../../utils/use-user";
import { useRequestStatus } from "../../../utils/request-status";
import { RequestStatusDisplay } from "../../../components/RequestStatusDisplay";
import { apiClient } from "../../../utils/enhanced-api-client";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface CityData {
  populationDensity: string | null;
  ageDemographics: string | null;
  employmentStats: string | null;
  gdp: string | null;
}

const fetchWikidataCityStats = async (city: string, country: string) => {
  // SPARQL query for city population, area, and GDP (if available)
  const endpoint = "https://query.wikidata.org/sparql";
  const query = `
    SELECT ?population ?area ?gdp WHERE {
      ?city rdfs:label "${city}"@en.
      ?city wdt:P17 ?country.
      ?country rdfs:label "${country}"@en.
      OPTIONAL { ?city wdt:P1082 ?population. }
      OPTIONAL { ?city wdt:P2046 ?area. }
      OPTIONAL { ?city wdt:P2131 ?gdp. }
    } LIMIT 1
  `;
  const url = endpoint + "?query=" + encodeURIComponent(query) + "&format=json";
  const res = await fetch(url);
  const data = await res.json();
  if (data.results.bindings.length === 0) return {};
  const row = data.results.bindings[0];
  const population = row.population ? parseInt(row.population.value) : undefined;
  const area = row.area ? parseFloat(row.area.value) : undefined;
  const gdp = row.gdp ? parseFloat(row.gdp.value) : undefined;
  const populationDensity = population && area ? Math.round(population / area) : undefined;
  return { population, area, gdp, populationDensity };
};

const Dash = () => {
  const { user, loading: userLoading } = useUser();
  const { status, error, loading: statusLoading, refreshStatus, setError } = useRequestStatus(user?.id);

  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [latLng, setLatLng] = useState<[number, number]>([20, 0]);
  const [zoom, setZoom] = useState<number>(2); 
  const [formData, setFormData] = useState<{
    type: string;
    name: string;
    country: string;
    city: string;
    postcode: string;
  }>({
    type: "",
    name: "", // Default to an empty string
    country: "",
    city: "",
    postcode: "",
  });
  const [cityStats, setCityStats] = useState<{ population?: number; gdp?: number; populationDensity?: number }>({});
  const [cityData, setCityData] = useState<CityData | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/iso', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      const countryNames = data.data.map((country: { name: string }) => country.name);
      setCountries(countryNames);
    };
    fetchCountries();
  }, []); // Fetch places when formData.type changes

  useEffect(() => {
    const fetchCities = async () => {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: formData.country }), // Use the selected country from formData
      });
      const data = await response.json();
      const cityNames = data.data.map((city: string) => city);
      setCities(cityNames);
    };
    if (countries.includes(formData.country)) {
      fetchCities();
    }
  }, [formData.country]);

  useEffect(() => {
    // Fetch city stats from Wikidata when places are set and city/country are selected
    if (places.length > 0 && formData.city && formData.country) {
      fetchWikidataCityStats(formData.city, formData.country).then(setCityStats);
    }
  }, [places, formData.city, formData.country]);

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  const handleUseLocationClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLatLng([latitude, longitude]);
        setZoom(15);

        try {
          const data = await apiClient.getNearbyPlaces({
            type: formData.type.toLowerCase(),
            lat: latitude,
            lng: longitude
          }, setError);

          const places = [];
          for (let i = 0; i < data.places.length; i++) {
            let placeName = data.places[i].displayName.text;
            let place = new Place(
              data.places[i].name.split("/")[1],
              data.places[i].formattedAddress,
              placeName,
              data.places[i].location.latitude,
              data.places[i].location.longitude,
              data.places[i].rating,
              data.places[i].userRatingCount,
              data.places[i].websiteUri,
              data.places[i].types.join(", "),
              data.places[i].nationalPhoneNumber,
              IsCloseMatch(formData.name, placeName)
            );
            places.push(place);
          }
          setPlaces(places);
          
          // Refresh status after successful request
          await refreshStatus();
        } catch (error) {
          console.error('Error fetching nearby places:', error);
          // Error is already handled by the API client
        }
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const data = await apiClient.getGmapsPlaces({
        type: formData.type.toLowerCase(),
        city: formData.city,
        country: formData.country,
        postCode: formData.postcode,
      }, setError);

      const places = [];
      for (let i = 0; i < data.places.length; i++) {
        console.log("Place: ", data.places[i]);
        let placeName = data.places[i].displayName.text;
        let place = new Place(
          data.places[i].name.split("/")[1],
          data.places[i].formattedAddress,
          placeName,
          data.places[i].location.latitude,
          data.places[i].location.longitude,
          data.places[i].rating,
          data.places[i].userRatingCount,
          data.places[i].websiteUri,
          data.places[i].types.join(", "),
          data.places[i].nationalPhoneNumber,
          IsCloseMatch(formData.name, placeName)
        );
        places.push(place);
      }
      setPlaces(places);
      if (places.length > 0) {
        setLatLng([places[0].Latitude, places[0].Longitude]);
        setZoom(15); // Set zoom level to 10 for better visibility
      }
      
      // Refresh status after successful request
      await refreshStatus();
    } catch (error) {
      console.error('Error fetching places:', error);
      // Error is already handled by the API client
    }
  };

  const downloadCsv = () => {
    const csvHeaders = "Place Name,Address,Rating,Phone,Url";
    const csvContent = places.map(place => `${place.PlaceName},${place.Address.replace(/,/g, " ")},${place.Rating},${place.Phone},${place.Url}`).join('\n');
    const blob = new Blob([csvHeaders + '\n' + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'places.csv';
    a.click();
  }

  const infoWindowContent = (place: Place) => {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold">{place.PlaceName}</h2>
        <p>{place.Address}</p>
        <p>Rating: {place.Rating}</p>
        <p>Phone: {place.Phone}</p>
        <a href={place.Url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Website</a>
      </div>
    );
  }

  // Show loading state while user is being fetched
  if (userLoading) {
    return (
      <div className="text-text bg-gradient-to-b from-slate-800 to-violet-800 h-full flex flex-col align-middle items-center text-center">
        <div className="flex items-center justify-center h-screen">
          <div className="text-text">Loading...</div>
        </div>
      </div>
    );
  }

  return <>
    <div className="text-text bg-gradient-to-b from-slate-800 to-violet-800 h-full flex flex-col align-middle items-center text-center">
      <section className="flex flex-col items-center justify-center h-2/3 w-screen p-2">
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Search</h2>
        
        
        {error?.type === 'limit_exceeded' ? (
          <div className="w-full max-w-4xl">
            <RequestStatusDisplay
              status={status}
              error={error}
              loading={statusLoading}
              onRefreshStatus={refreshStatus}
              onClearError={() => setError(null)}
            />
          </div>
        ) : (
        <div className="flex flex-row items-center justify-evenly w-full p-4">
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4">
              <label htmlFor="country" className="block text-lg font-semibold text-text text-left">Country:</label>
              <ComboboxDropdown
                type="country"
                values={countries}
                keys={countries}
                onChange={(value: string) => handleFormChange({ target: { name: "country", value } } as React.ChangeEvent<HTMLInputElement>)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="city" className="block text-lg font-semibold text-text text-left">City:</label>
              <ComboboxDropdown
                type="city"
                values={cities}
                keys={cities}
                onChange={(value: string) => handleFormChange({ target: { name: "city", value } } as React.ChangeEvent<HTMLInputElement>)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="postcode" className="block text-lg font-semibold text-text text-left">Postcode <span className="italic text-sm">(Optional)</span></label>
              <input type="postcode" id="postcode" name="postcode" onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>

            <div className="mb-4">
              <label htmlFor="type" className="block text-lg font-semibold text-text text-left">Business Type:</label>
              <input placeholder="restaurant, indian restaurant" type="type" id="type" name="type" onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block text-lg font-semibold text-text text-left">Business Name <span className="italic text-sm">(Optional)</span></label>
              <input placeholder="Nawaabs" type="name" id="name" name="name" onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>

            <Button variant="outline" disabled={!formData.type} onClick={handleUseLocationClick} className="px-6 py-3 mx-2 bg-foreground rounded-md border-2 border-border text-lg font-semibold  hover:bg-slate-700 hover:scale-95 transition duration-300">Use Location</Button>
            <Button variant="outline" type="submit" disabled={!formData.type || !formData.city || !formData.country} className="px-6 py-3 bg-foreground mx-auto border-2 border-border rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300">Search</Button>
          </form>
          <div>
            {API_KEY == null ? <span className="text-danger">Google Maps API Key not Available</span> :
              <APIProvider apiKey={API_KEY}>
                <InteractiveMap
                  center={latLng}
                  zoom={zoom}
                  markers={places.map((place) => {
                    return (
                      <Marker
                        key={place.PlaceID}
                        position={{ lat: place.Latitude, lng: place.Longitude }}
                        title={place.PlaceName}
                        onClick={() => {
                          console.log("Marker clicked", place.PlaceName);
                        }}
                        onMouseOver={() => {
                          
                        }}
                        onMouseOut={() => {
                          console.log("Marker unhovered", place.PlaceName);
                        }
                        }
                      />
                    );
                  }
                  )}
                />
              </APIProvider>
            }
          </div>
        </div>
        )}
      </section>
      <section className="flex flex-col items-center justify-center h-2/3 w-screen p-2">
        {places.length > 0 ? <DataTable columns={columns} data={places} /> : <div className="text-text text-2xl font-semibold"></div>}
        {places.length > 0 ? <button className="px-6 bg-foreground mx-auto border-2 border-border rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300" onClick={downloadCsv}>Download CSV</button> : <div></div>}
        {places.length > 0 ? (
          <BusinessViabilitySection
            averageReviewScore={
              places.length > 0
                ? places.reduce((acc, p) => acc + (typeof p.Rating === 'number' ? p.Rating : 0), 0) / places.length
                : 0
            }
            gdp={cityStats.gdp}
            population={cityStats.population}
            populationDensity={cityStats.populationDensity}
            name={formData.city + ", " + formData.country}
            // TODO: Add ageDemographics and notableFeatures if available
          />
        ) : null}
        {places.length > 0 && cityData && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">City Data</h3>
            <pre className="text-xs font-mono p-3 rounded border overflow-auto">
              {JSON.stringify(cityData, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  </>;
};

export default Dash;
