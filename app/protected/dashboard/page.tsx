"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Marker, APIProvider, InfoWindow } from "@vis.gl/react-google-maps";

const InteractiveMap = dynamic(() => import('../../../components/InteractiveMap'), {
  ssr: false,
});

import { columns, Place, IsCloseMatch, FindCloseMatch, calculateUptime, CityData, loadUKAgeDemographics } from "../../../lib/places";
import BusinessIntelligence from "../../../components/BusinessIntelligence";
import AreaDemographics from "../../../components/AreaDemographics";
import GoogleSearchResult from "../../../components/GoogleSearchRanking";
import ScrapeContacts from "@/components/ScrapeContacts";

import { DataTable } from "../../../components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ComboboxDropdown } from "../../../components/ui/combobox";

import { useUser } from "../../../utils/use-user";
import { useRequestStatus } from "../../../utils/request-status";
import { RequestStatusDisplay } from "../../../components/RequestStatusDisplay";
import { apiClient } from "../../../utils/enhanced-api-client";
import { PaidOnly } from "../../../components/SubscriptionGuard";
import Link from "next/link";
import { computeLocalDensityScores, LatLng } from "@/lib/spatialDensity";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { useSubscription } from "../../../utils/use-subscription";
import { getDashboardRoute } from "../../../utils/dashboard-routing";
import { useRouter } from "next/navigation";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const getPlacesFromData = (data: any, name: string) => {
  const places = [];

  for (let i = 0; i < data.places.length; i++) {
    let placeName = data.places[i].displayName.text;
    const weekdayDescriptions = data.places[i].regularOpeningHours?.weekdayDescriptions || [];
    const openHours = weekdayDescriptions.join(' | ');
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
      IsCloseMatch(name, placeName),
      openHours,
    );

    // Calculate uptime percentage
    place.Uptime = calculateUptime(openHours);

    places.push(place);
  }

  const spatialDensity = computeLocalDensityScores(places.map(p => ({ lat: p.Latitude, lng: p.Longitude })));

  for (let i = 0; i < data.places.length; i++) {
    places[i].DensityScore = spatialDensity[i].densityScore;
    places[i].MeanDistance = spatialDensity[i].meanDist;
  };

  return places;
}

const Dash = () => {
  const { user, loading: userLoading, error: userError } = useUser();
  const { status, error, loading: statusLoading, refreshStatus, setError } = useRequestStatus(user?.id);
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const router = useRouter();

  // Redirect to appropriate dashboard based on subscription
  // useEffect(() => {
  //   if (!subscriptionLoading && subscription) {
  //     const correctRoute = getDashboardRoute(subscription);
  //     // Only redirect if we're not already on the correct route
  //     if (correctRoute !== '/protected/dashboard') {
  //       router.replace(correctRoute);
  //     }
  //   }
  // }, [subscription, subscriptionLoading, router]);


  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [countriesData, setCountriesData] = useState<Array<{ name: string; cities: string[] }>>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [latLng, setLatLng] = useState<[number, number]>([54, -1]);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [zoom, setZoom] = useState<number>(5);
  const [averageDensityScore, setAverageDensityScore] = useState<number>(0);
  const [averageMeanDistance, setAverageMeanDistance] = useState<number>(0);


  // Column visibility state for paid-only optional columns
  const [columnVisibility, setColumnVisibility] = useState<{
    phone: boolean;
    openHours: boolean;
    meanDistance: boolean;
    densityScore: boolean;
  }>({
    phone: false,
    openHours: false,
    meanDistance: false,
    densityScore: false,
  });
  const [formData, setFormData] = useState<{
    type: string;
    name: string;
    country: string;
    city: string;
    postcode: string;
  }>({
    type: "",
    name: "", // Default to an empty string
    country: "United Kingdom",
    city: "",
    postcode: "",
  });


  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (userLoading) {
      const timeout = setTimeout(() => {
        console.log("Loading timeout reached");
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [userLoading]);


  useEffect(() => {
    const loadCountriesData = async () => {
      try {
        const response = await fetch('/resources/countries_cities.json');

        if (!response.ok) {
          console.error('Failed to load countries data:', response.status, response.statusText);
          return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setCountriesData(data);
          const countryNames = data.map((country: { name: string }) => country.name);
          setCountries(countryNames);
        } else {
          console.error('Invalid countries data structure:', data);
        }
      } catch (error) {
        console.error('Error loading countries data:', error);
      }
    };
    loadCountriesData();
  }, []);

  useEffect(() => {
    if (!formData.country || countriesData.length === 0 || !countries.includes(formData.country)) {
      setCities([]);
      return;
    }

    // Find the country in the loaded data
    const countryData = countriesData.find((c: { name: string }) => c.name === formData.country);

    if (countryData && Array.isArray(countryData.cities)) {
      setCities(countryData.cities);
    } else {
      console.error('Country not found or invalid cities data:', formData.country);
      setCities([]);
    }
  }, [formData.country, countriesData, countries]);

  useEffect(() => {
    if (places.length > 0) {
      setAverageDensityScore(places.reduce((acc, p) => acc + p.DensityScore, 0) / places.length);
      setAverageMeanDistance(1 / (places.reduce((acc, p) => acc + p.MeanDistance, 0) / places.length));
    }
  }, [places]);


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

          setPlaces(getPlacesFromData(data, formData.name));
          setZoom(15);
          setLatLng([latitude, longitude]);

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

      setPlaces(getPlacesFromData(data, formData.name));
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

  // Filter columns based on visibility state
  const visibleColumns = React.useMemo(() => {
    return columns.filter(col => {
      const colId = (col as any).id || (col as any).accessorKey;
      if (colId === 'phone') return columnVisibility.phone;
      if (colId === 'openHours') return columnVisibility.openHours;
      if (colId === 'uptime') return columnVisibility.openHours; // Uptime shown when openHours is visible
      if (colId === 'meanDistance') return columnVisibility.meanDistance;
      if (colId === 'densityScore') return columnVisibility.densityScore;
      // Always show non-optional columns
      return true;
    }) as ColumnDef<Place>[];
  }, [columnVisibility]);

  const sanitizeForCsv = (text: string): string => {
    if (!text) return "";
    // Replace em dashes (U+2013) and en dashes (U+2014) with regular hyphens
    // Replace various Unicode spaces with regular spaces
    // Replace other problematic Unicode characters while preserving times
    return text
      .replace(/[\u2013\u2014\u2015]/g, "-") // Replace em/en dashes with hyphen
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ") // Replace non-breaking and special spaces with regular space
      .replace(/[\u2026]/g, "...") // Replace ellipsis with three dots
      .replace(/[\u00AD]/g, "") // Remove soft hyphens
      .replace(/[^\x20-\x7E\n\r|:]/g, "") // Keep ASCII printable chars, newlines, pipe (|), and colons
      .replace(/\s+/g, " ") // Normalize multiple spaces to single space
      .trim();
  };

  const escapeCsvValue = (value: string | number): string => {
    const str = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadCsv = (filename: string) => {
    // Build headers based on visible columns
    const headers = ["Place Name", "Address", "Rating", "Review Count", "Business Score", "Url"];
    if (columnVisibility.openHours) {
      headers.push("Open Hours");
      headers.push("Uptime");
    }
    if (columnVisibility.meanDistance) headers.push("Proximity");
    if (columnVisibility.densityScore) headers.push("Density Score");
    if (columnVisibility.phone) headers.push("Phone");

    const csvHeaders = headers.join(",");
    const csvContent = places.map(place => {
      const baseRow = [
        escapeCsvValue(place.PlaceName),
        escapeCsvValue(place.Address.replace(/,/g, " ").replace(/\n/g, " ")),
        escapeCsvValue(place.Rating),
        escapeCsvValue(place.RatingCount),
        escapeCsvValue(place.BusinessScore.toFixed(1)),
        escapeCsvValue(place.Url)
      ];

      if (columnVisibility.phone) {
        baseRow.push(escapeCsvValue(place.Phone));
      }

      if (columnVisibility.openHours) {
        const sanitizedOpenHours = sanitizeForCsv(place.OpenHours || "");
        baseRow.push(escapeCsvValue(sanitizedOpenHours));
        baseRow.push(escapeCsvValue(place.Uptime ? `${place.Uptime.toFixed(1)}%` : "0%"));
      }
      if (columnVisibility.meanDistance) {
        baseRow.push(escapeCsvValue(place.MeanDistance ? `${(place.MeanDistance / 1000).toFixed(2)} km` : ""));
      }
      if (columnVisibility.densityScore) {
        baseRow.push(escapeCsvValue(place.DensityScore ? `${(place.DensityScore * 100).toFixed(2)}%` : ""));
      }

      return baseRow.join(",");
    }).join('\n');

    const blob = new Blob([csvHeaders + '\n' + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  // Show loading state while user is being fetched
  if (userLoading && !loadingTimeout) {
    return (
      <div className="text-text bg-gradient-to-b from-slate-800 to-violet-800 h-full flex flex-col align-middle items-center text-center">
        <div className="flex items-center justify-center h-screen">
          <div className="text-text">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4"></div>
            Loading...
            {userError && (
              <div className="text-red-500 mt-2">
                Error: {userError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show timeout error if loading takes too long
  if (loadingTimeout) {
    return (
      <div className="text-text bg-gradient-to-b from-slate-800 to-violet-800 h-full flex flex-col align-middle items-center text-center">
        <div className="flex items-center justify-center h-screen">
          <div className="text-text">
            <div className="text-red-500 mb-4">Loading Timeout</div>
            <div className="text-sm mb-4">
              Authentication is taking longer than expected. Please try refreshing the page.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>
    <div className="text-text bg-gradient-to-b from-slate-800 to-violet-800 h-full flex flex-col align-middle items-center text-center">
      <section className="flex flex-col items-center justify-center h-2/3 w-screen p-2">
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Search</h2>


        <div className="flex lg:flex-row md:flex-row flex-col items-center justify-evenly w-full p-4 relative">
          {/* Limit exceeded overlay */}
          {error?.type === 'limit_exceeded' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="bg-background/90 backdrop-blur-sm rounded-xl p-8 border border-border max-w-2xl mx-4">
                <RequestStatusDisplay
                  status={status}
                  error={error}
                  loading={statusLoading}
                  onRefreshStatus={refreshStatus}
                  onClearError={() => setError(null)}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className={error?.type === 'limit_exceeded' ? 'pointer-events-none opacity-50' : ''}>

            <div className="mb-4">
              <label htmlFor="type" className="block text-lg font-semibold text-text text-left">Business Type:</label>
              <input placeholder="restaurant, indian restaurant" type="type" id="type" name="type" onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>

            <div className="mb-4">
              <label htmlFor="country" className="block text-lg font-semibold text-text text-left">Country:</label>
              <ComboboxDropdown
                type="country"
                values={countries}
                keys={countries}
                defaultValue="United Kingdom"
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
              <label htmlFor="name" className="block text-lg font-semibold text-text text-left">Business Name <span className="italic text-sm">(Optional)</span></label>
              <input placeholder="Nawaabs" type="name" id="name" name="name" onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500" />
            </div>

            <PaidOnly
              fallback={<div>Paid users can select additional data fields.</div>}
            >

              <div className="mb-4 p-3 bg-foreground/50 rounded-md border border-border">
                <label className="block text-sm font-semibold text-text text-left mb-2">Premium Data Fields:</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id="All"
                      checked={columnVisibility.phone && columnVisibility.openHours && columnVisibility.meanDistance && columnVisibility.densityScore}
                      onCheckedChange={(checked) =>
                        setColumnVisibility(prev => ({ ...prev, phone: checked === true, openHours: checked === true, meanDistance: checked === true, densityScore: checked === true }))
                      }
                    />
                    <label htmlFor="All" className="text-sm text-text cursor-pointer">Check All</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="openHours"
                      checked={columnVisibility.openHours}
                      onCheckedChange={(checked) =>
                        setColumnVisibility(prev => ({ ...prev, openHours: checked === true }))
                      }
                    />
                    <label htmlFor="openHours" className="text-sm text-text cursor-pointer">Open Hours</label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phone"
                        checked={columnVisibility.phone}
                        onCheckedChange={(checked) =>
                          setColumnVisibility(prev => ({ ...prev, phone: checked === true }))
                        }
                      />
                      <label htmlFor="phone" className="text-sm text-text cursor-pointer">Phone Number</label>
                    </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meanDistance"
                      checked={columnVisibility.meanDistance}
                      onCheckedChange={(checked) =>
                        setColumnVisibility(prev => ({ ...prev, meanDistance: checked === true }))
                      }
                    />
                    <label htmlFor="meanDistance" className="text-sm text-text cursor-pointer">Mean Distance</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="densityScore"
                      checked={columnVisibility.densityScore}
                      onCheckedChange={(checked) =>
                        setColumnVisibility(prev => ({ ...prev, densityScore: checked === true }))
                      }
                    />
                    <label htmlFor="densityScore" className="text-sm text-text cursor-pointer">Density Score</label>
                  </div>
                </div>
              </div>
            </PaidOnly>

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
                      <React.Fragment key={place.PlaceID}>
                        <Marker
                          position={{ lat: place.Latitude, lng: place.Longitude }}
                          title={place.PlaceName}
                          onClick={() => {
                            setSelectedPlace(place);
                          }}
                        />
                        {selectedPlace?.PlaceID === place.PlaceID && (
                          <InfoWindow
                            position={{ lat: place.Latitude, lng: place.Longitude }}
                            onCloseClick={() => setSelectedPlace(null)}
                          >
                            <div className="p-2 min-w-[250px] max-w-[300px]">
                              <h3 className="font-bold text-lg text-gray-900 mb-2">{place.PlaceName}</h3>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-semibold text-gray-700">Address:</span>
                                  <p className="text-gray-600">{place.Address}</p>
                                </div>
                                {place.Phone && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Phone:</span>
                                    <p className="text-gray-600">{place.Phone}</p>
                                  </div>
                                )}
                                <div className="flex gap-4 pt-2 border-t border-gray-200">
                                  <div>
                                    <span className="font-semibold text-gray-700">Business Score:</span>
                                    <p className="text-gray-600 font-bold">{place.BusinessScore.toFixed(1)}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Review Score:</span>
                                    <p className="text-gray-600 font-bold">{place.Rating} / 5</p>
                                  </div>
                                </div>
                                {place.Url && (
                                  <div className="pt-2">
                                    <a
                                      href={place.Url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    >
                                      Visit Website
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </React.Fragment>
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
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Results</h2>
        <span className="text-text text-lg">
          Data may not persist if you refresh the page, download csv to make sure you keep any results you need.
        </span>
        {places.length > 0 ? (
          <div className="flex gap-4 mt-4">
            <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="px-6 bg-foreground border-2 border-border rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300"
                >
                  View Table
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-screen max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
                  <DialogTitle className="text-2xl font-bold text-text">Search Results</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <DataTable
                    columns={visibleColumns}
                    data={places.sort((a, b) => (b.Rating * b.RatingCount) - (a.Rating * a.RatingCount))}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="px-6 bg-foreground border-2 border-border rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300"
              onClick={() => downloadCsv(formData.type.trim() + formData.city.trim() + '.csv')}
              disabled={places.length === 0}
            >
              Download CSV
            </Button>
          </div>
        ) : <div className="text-text text-2xl font-semibold"></div>}
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Analytics</h2>

        {places.length > 0 ? (
          <PaidOnly
            fallback={
              <div className="w-full max-w-2xl mx-auto mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border">
                <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Viability Rating</h2>
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold text-text mb-4">Upgrade to Access Business Analytics</h3>
                  <p className="text-text/70 mb-6">
                    Get detailed business viability insights with a paid plan.
                  </p>
                  <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700">
                    <Link href="/protected/upgrade">Upgrade Now</Link>
                  </Button>
                </div>
              </div>
            }
          >
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-[95vw] mx-auto items-stretch">
              <BusinessIntelligence
                averageReviewScore={
                  places.length > 0
                    ? places.reduce((acc, p) => acc + (typeof p.Rating === 'number' ? p.Rating : 0), 0) / places.length
                    : 0
                }
                averageBusinessScore={
                  places.length > 0
                    ? places.reduce((acc, p) => acc + (p.BusinessScore || 0), 0) / places.length
                    : 0
                }
                maxBusinessScore={
                  places.length > 0
                    ? Math.max(...places.map(p => p.BusinessScore || 0))
                    : 0
                }
                userBusinessName={formData.name.trim()}
                places={places}
              />
              <AreaDemographics
                name={formData.city}
              />
            </div>

          </PaidOnly>
        ) : null}

      </section>
      <section className="flex flex-col items-center justify-center min-h-96 w-screen p-2 mb-4 relative z-0">
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Google Search Ranking</h2>
        <div className="w-full">
          {places.length > 0 && <GoogleSearchResult placeName={formData.name.trim() || ''} location={formData.city.trim() || ''} type={formData.type.trim()} />}
        </div>
      </section>

      <section className="flex flex-col items-center justify-center min-h-96 w-screen p-2 mb-4 relative z-0">
        <h2 className="lg:text-4xl text-2xl font-semibold italic text-text text-left border-b-2 w-full pl-4">Scrape Contacts</h2>
        <div className="w-full">
          {places.length > 0 && <ScrapeContacts places={places} country={formData.country.trim()} city={formData.city.trim()} type={formData.type.trim()} />}
        </div>
      </section>
    </div>
  </>;
};

export default Dash;