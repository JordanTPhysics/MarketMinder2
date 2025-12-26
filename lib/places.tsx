"use client"

import React from "react"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { FaExternalLinkAlt } from "react-icons/fa";

import Link from "next/link"
import { Review } from "./review"

import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";

export class Place {
  PlaceID: string;
  Address: string;
  PlaceName: string;
  Latitude: number;
  Longitude: number;
  Rating: number;
  RatingCount: number;
  BusinessScore: number;
  Url: string;
  Types: string;
  Phone: string;
  Selected: boolean = false;
  OpenHours: string = "";
  MeanDistance: number = 0;
  DensityScore: number = 0;
  Uptime: number = 0;
  Reviews: Review[] = [];

  constructor(
    PlaceID: string,
    Address: string,
    PlaceName: string,
    Latitude: number,
    Longitude: number,
    Rating: number,
    RatingCount: number,
    Url: string,
    Types: string,
    Phone: string,
    Selected: boolean = false,
    OpenHours: string = "",
    MeanDistance: number = 0,
    DensityScore: number = 0,
    Reviews: Review[] = [],
  ) {
    this.PlaceID = PlaceID;
    this.Address = Address;
    this.PlaceName = PlaceName;
    this.Latitude = Latitude;
    this.Longitude = Longitude;
    this.Rating = Rating;
    this.RatingCount = RatingCount;
    this.BusinessScore = (Rating ?? 0) * (RatingCount ?? 0);
    this.Url = Url;
    this.Types = Types;
    this.Phone = Phone;
    this.Selected = Selected;
    this.OpenHours = OpenHours;
    this.MeanDistance = MeanDistance;
    this.DensityScore = DensityScore;
    this.Uptime = 0; // Will be calculated separately
    this.Reviews = Reviews;
  }
}

// Calculate uptime percentage from OpenHours string
export const calculateUptime = (openHours: string): number => {
  if (!openHours || openHours.trim() === "") {
    return 0;
  }

  // Parse the openHours string which is in format: "Monday: 7:00 - 7:30 am, 9:30 am - 9:30 pm | Tuesday: ..."
  const days = openHours.split('|').map(day => day.trim()).filter(day => day.length > 0);
  let totalHours = 0;

  days.forEach(dayStr => {
    // Match pattern like "Monday: 7:00 - 7:30 am, 9:30 am - 9:30 pm"
    // Extract day name and time ranges
    const colonIndex = dayStr.indexOf(':');
    if (colonIndex === -1) return;
    
    const timeRanges = dayStr.substring(colonIndex + 1).trim();
    if (!timeRanges) return;
    
    // Check for special cases
    const timeRangesLower = timeRanges.toLowerCase();
    if (timeRangesLower.includes("closed")) {
      // Closed for the day - add 0 hours
      return;
    }
    if (timeRangesLower.includes("open 24 hours") || timeRangesLower.includes("24 hours")) {
      // Open 24 hours - add 24 hours
      totalHours += 24;
      return;
    }
    
    // Split by comma to get multiple time ranges per day
    const ranges = timeRanges.split(',').map(r => r.trim()).filter(r => r.length > 0);
    
    ranges.forEach(range => {
      const rangeLower = range.toLowerCase();
      // Skip if range itself is closed
      if (rangeLower.includes("closed")) return;
      // If range is 24 hours, add 24 hours and continue
      if (rangeLower.includes("open 24 hours") || rangeLower.includes("24 hours")) {
        totalHours += 24;
        return;
      }
      
      const timeMatch = range.match(/(\d{1,2}):(\d{2})\s*(am|pm)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i);
      if (!timeMatch) return;
      
      let startHour = parseInt(timeMatch[1]);
      const startMinute = parseInt(timeMatch[2]);
      const startPeriod = timeMatch[3]?.toLowerCase();
      let endHour = parseInt(timeMatch[4]);
      const endMinute = parseInt(timeMatch[5]);
      const endPeriod = timeMatch[6]?.toLowerCase();
      
      // Convert to 24-hour format for start time
      if (startPeriod === 'pm' && startHour !== 12) {
        startHour += 12;
      } else if (startPeriod === 'am' && startHour === 12) {
        startHour = 0;
      } else if (!startPeriod) {
        // No AM/PM specified - assume AM unless it's 12
        // If 12, assume noon (12:00)
      }
      
      // Convert to 24-hour format for end time
      if (endPeriod === 'pm' && endHour !== 12) {
        endHour += 12;
      } else if (endPeriod === 'am' && endHour === 12) {
        endHour = 0;
      } else if (!endPeriod) {
        // No AM/PM specified - assume AM unless it's 12
        // If endHour < startHour and no periods specified, assume end is PM
        if (endHour < startHour && !startPeriod) {
          endHour += 12;
        }
      }
      
      // Calculate hours
      const startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;
      
      // If end time appears to be before start time, assume it's the next day
      if (endTotalMinutes < startTotalMinutes) {
        // Check if it's likely a same-day range (e.g., 9am - 5pm)
        // If both have periods or both lack periods and end < start, assume next day
        if ((startPeriod || endPeriod) || (endHour < startHour && !startPeriod && !endPeriod)) {
          endTotalMinutes += 24 * 60; // Add 24 hours
        }
      }
      
      const hours = (endTotalMinutes - startTotalMinutes) / 60;
      if (hours > 0 && hours <= 24) {
        totalHours += hours;
      }
    });
  });

  // Calculate percentage: total hours / 168 hours per week
  // Cap at 100% in case calculation exceeds 168 hours
  const percentage = Math.min((totalHours / 168) * 100, 100);
  return Math.round(percentage * 10) / 10; // Round to 1 decimal place
};

export const IsCloseMatch = (input: string, check: string): boolean => {
  const normalizedInput = input.toLowerCase();
  const normalizedCheck = check.toLowerCase();

  let matching: number = 0;
  let length = Math.min(normalizedInput.length, normalizedCheck.length);
  if (length < 3) return false;

  for (let i = 0; i < length; i++) {
    if (normalizedInput[i] === normalizedCheck[i]) {
      matching++;
    }
  }

  return matching >= normalizedInput.length / 2;
}

export const FindCloseMatch = (input: string, options: string[]): string | null => {
  const normalizedInput = input.toLowerCase();
  let closestMatch: string | null = null;
  let highestSimilarity = 0;

  options.forEach((option) => {
    const normalizedOption = option.toLowerCase();
    let similarity = 0;

    for (let i = 0; i < Math.min(normalizedInput.length, normalizedOption.length); i++) {
      if (normalizedInput[i] === normalizedOption[i]) {
        similarity++;
      } else {
        break;
      }
    }

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      closestMatch = option;
    }
  });

  return closestMatch;
};

export const CountPlaceType = (places: Place[]) => {
  const placeType: { [key: string]: number } = {};
  places.forEach((place) => {
    place.Types.split(",").forEach((type) => {
      let s = type.trim();
      if (s === "") return;
      if (placeType[s]) {
        placeType[s] += 1;
      } else {
        placeType[s] = 1;
      }
    });
  }
  );
  return placeType;
}
export const GroupByRating = (places: Place[]) => {
  const RankedRating: { [key: string]: number } = {
    "Great! (4-5)": 0,
    "Good (3-4)": 0,
    "Bad (0-3)": 0,
    "Unrated": 0
  };
  places.forEach((place) => {
    if (place.Rating > 4) {

      RankedRating["Great! (4-5)"] += 1;
    } else if (place.Rating > 3) {
      RankedRating["Good (3-4)"] += 1;
    }
    else if (place.Rating >= 0) {
      RankedRating["Bad (0-3)"] += 1;
    } else {
      RankedRating["Unrated"] += 1;
    }
  });
  return RankedRating;
}

export const columns: ColumnDef<Place>[] = [
  {
    accessorKey: "PlaceName",
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Link href={""} > Name</Link>
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    },
    cell: ({ cell }) => {
      if (cell.row.original.Url === "" || cell.row.original.Url == null || cell.row.original == undefined) return cell.row.original.PlaceName;
      return <Link href={cell.row.original.Url} target="_blank" rel="noreferrer">
        <span className="text-slate-400 hover:text-slate-600 underline highlight">
          {cell.row.original.PlaceName} <FaExternalLinkAlt/>
        </span>
      </Link>;
    }
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Address
          <ArrowUpDown className="ml-2 h-4 w-4 " />
        </button>
      )

    }, accessorKey: "Address"
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rating
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, accessorKey: "Rating"
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Business Score
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, 
    accessorFn: (row) => row.BusinessScore,
    id: "businessScore",
    cell: ({ cell }) => {
      const score = cell.getValue<number>();
      return (
        <span className="font-semibold">
          {score.toFixed(1)}
        </span>
      );
    }
  },
  {
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white"
        >
          Types
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    },
    accessorKey: "Types",
    cell: ({ cell }) => {
      return (
        <span>
          {cell.getValue<string>().replaceAll("_", " ")}
        </span>
      );
    }
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Selected
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, accessorKey: "Selected",
    cell: ({ cell }) => {
      return (
        <span className="flex justify-center items-center">
          {cell.getValue<boolean>() ? (
            <MdOutlineCheckBox color="orange" size="40" />
          ) : (
            <MdOutlineCheckBoxOutlineBlank color="gray" size={40}/>
          )}
        </span>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, accessorKey: "Phone"

  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Opening Hours
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, 
    accessorKey: "OpenHours",
    id: "openHours",
    cell: ({ cell }) => <span className="overflow-x-auto">{cell.getValue<string>()}</span>
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Uptime
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, 
    accessorFn: (row) => row.Uptime,
    id: "uptime",
    cell: ({ cell }) => {
      const value = cell.getValue<number>();
      return (
        <span className="font-semibold">
          {value.toFixed(1)}%
        </span>
      );
    }
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Proximity
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, 
    accessorKey: "MeanDistance",
    id: "meanDistance",
    cell: ({ cell }) => {
      const value = cell.getValue<number>();
      return value ? `${(value / 1000).toFixed(2)} km` : "-";
    }
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Density Score
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, 
    accessorKey: "DensityScore",
    id: "densityScore",
    cell: ({ cell }) => {
      const value = cell.getValue<number>();
      return value ? `${(value * 100).toFixed(2)}%` : "-";
    }
  }

]

export interface CityData {
  DistrictCode: string;
  Population: number;
  Area: number;
  Name: string;
  Country: string;
  GDP: number;
  Centroid: [number, number];
  aged0to17: number;
  aged18to24: number;
  aged25to49: number;
  aged50to64: number;
  aged65plus: number;
}

export async function loadUKAgeDemographics(): Promise<CityData[]> {
  try {
    const response = await fetch('/resources/UK_AgeDemographicsByCity.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    
    const data: CityData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing with quotes
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      values.push(current.trim());

      data.push({
        DistrictCode: values[0],
        Name: values[1],
        Country: values[2],
        GDP: parseFloat(values[3]),
        Area: parseFloat(values[4]),
        Centroid: [parseFloat(values[5]), parseFloat(values[6])],
        Population: parseInt(values[7]),
        aged0to17: parseInt(values[8]),
        aged18to24: parseInt(values[9]),
        aged25to49: parseInt(values[10]),
        aged50to64: parseInt(values[11]),
        aged65plus: parseInt(values[12])
      });
    }

    return data;
  } catch (error) {
    console.error('Error loading UK age demographics:', error);
    return [];
  }
}

export function findCityAgeData(cityName: string, cityData: CityData[]): CityData | null {
  const normalizedCityName = cityName.toLowerCase().trim();
  
  return cityData.find(city => {
    const normalizedName = city.Name.toLowerCase().trim();
    return normalizedName === normalizedCityName || 
    normalizedName.includes(normalizedCityName) ||
           normalizedCityName.includes(normalizedName) || IsCloseMatch(normalizedCityName, normalizedName);
  }) || null;
}
