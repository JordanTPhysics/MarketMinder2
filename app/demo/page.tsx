"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Marker, APIProvider } from "@vis.gl/react-google-maps";

const InteractiveMap = dynamic(() => import('../../components/InteractiveMap'), {
  ssr: false,
});

import { DataTable } from "../../components/ui/data-table";
import { columns, Place, IsCloseMatch } from "../../lib/places";
import { ComboboxDropdown } from "../../components/ui/combobox";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const Dash = () => {

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
  }>({
    type: "",
    name: "", // Default to an empty string
    country: "",
    city: "",
  });

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
    if (formData.country.length > 0) {
      fetchCities();
    }
  }, [formData.country]);

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

  const handleUseLocationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const getNearbyPlaces = async () => {
      const response = await fetch('/api/getNearbyPlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type.toLowerCase(),
          lat: latLng[0],
          lng: latLng[1]
        }),
      });
      const data = await response.json();
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
          data.places[i].websiteUri,
          data.places[i].types.join(", "),
          data.places[i].nationalPhoneNumber,
          IsCloseMatch(formData.name, placeName)
        );
        places.push(place);
      }
      return places;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLatLng([latitude, longitude]);
        setZoom(15);

      });

      getNearbyPlaces().then(places => {
        setPlaces(places);

      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const getGmapsPlaces = async () => {
      const response = await fetch('/api/getGmapsPlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type.toLowerCase(),
          city: formData.city,
          country: formData.country,
        }),
      });
      const data = await response.json();

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
          data.places[i].websiteUri,
          data.places[i].types.join(", "),
          data.places[i].nationalPhoneNumber,
          IsCloseMatch(formData.name, placeName)

        );
        places.push(place);
      }
      return places;
    }

    getGmapsPlaces().then(places => {
      setPlaces(places);
      setLatLng([places[0].Latitude, places[0].Longitude]);
      setZoom(15); // Set zoom level to 10 for better visibility
    });
    // Add your form submission logic here
  };

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

  return <>
    <div className="text-text bg-gradient-to-b from-slate-800 to-violet-800 h-full flex flex-col align-middle items-center text-center">
      <section className="flex flex-col items-center justify-center h-2/3 w-screen p-2">
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Search</h2>
        <div className="flex flex-row items-center justify-evenly w-full p-4">
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-lg font-semibold text-text text-left">Business Name:</label>
              <input type="name" id="name" name="name" onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="type" className="block text-lg font-semibold text-text text-left">Business Type:</label>
              <input type="type" id="type" name="type" onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>
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

            <button onClick={handleUseLocationClick} className="px-6 py-3 mx-2 bg-foreground rounded-md border-2 border-border text-lg font-semibold  hover:bg-slate-700 hover:scale-95 transition duration-300">Use Location</button>
            <button type="submit" className="px-6 py-3 bg-foreground mx-auto border-2 border-border rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300">Search</button>
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
      </section>
      <section className="flex flex-col items-center justify-center h-2/3 w-screen p-2">
        <DataTable columns={columns} data={places} />
      </section>
    </div>
  </>;
};

export default Dash;
