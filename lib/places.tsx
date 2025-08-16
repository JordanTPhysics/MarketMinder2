"use client"

import React from "react"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";
import StarRating from "../components/ui/star-rating"

export class Place {
  PlaceID: string;
  Address: string;
  PlaceName: string;
  Latitude: number;
  Longitude: number;
  Rating: number;
  RatingCount: number;
  Url: string;
  Types: string;
  Phone: string;
  Selected: boolean = false;

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
    Selected: boolean = false
  ) {
    this.PlaceID = PlaceID;
    this.Address = Address;
    this.PlaceName = PlaceName;
    this.Latitude = Latitude;
    this.Longitude = Longitude;
    this.Rating = Rating;
    this.RatingCount = RatingCount;
    this.Url = Url;
    this.Types = Types;
    this.Phone = Phone;
    this.Selected = Selected;
  }
}

export const IsCloseMatch = (input: string, check: string): boolean => {
  const normalizedInput = input.toLowerCase();
  const normalizedCheck = check.toLowerCase();
  console.log("Normalized Input: ", normalizedInput);
  console.log("Normalized Check: ", normalizedCheck);

  let matching: number = 0;
  let length = Math.min(normalizedInput.length, normalizedCheck.length);
  if (length < 3) return false;

  for (let i = 0; i < length; i++) {
    if (normalizedInput[i] === normalizedCheck[i]) {
      matching++;
    }
  }

  console.log("Matching: ", matching);
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
          {cell.row.original.PlaceName}
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
          Review Count
          <ArrowUpDown className="ml-2 h-4 w-4 text-white" />
        </button>
      )

    }, accessorKey: "RatingCount",
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

]

export interface UKCityAgeData {
  area: string;
  allAges: number;
  aged0to17: number;
  aged18to24: number;
  aged25to49: number;
  aged50to64: number;
  aged65plus: number;
}

export async function loadUKAgeDemographics(): Promise<UKCityAgeData[]> {
  try {
    const response = await fetch('/resources/UK_AgeDemographicsByCity.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    const data: UKCityAgeData[] = [];
    
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
      
      // Skip rows with missing data (marked with "-")
      if (values.some(val => val === '-')) continue;
      
      const area = values[0].replace(/"/g, '');
      const allAges = parseInt(values[1].replace(/"/g, '').replace(/,/g, '')) || 0;
      const aged0to17 = parseInt(values[2].replace(/"/g, '').replace(/,/g, '')) || 0;
      const aged18to24 = parseInt(values[3].replace(/"/g, '').replace(/,/g, '')) || 0;
      const aged25to49 = parseInt(values[4].replace(/"/g, '').replace(/,/g, '')) || 0;
      const aged50to64 = parseInt(values[5].replace(/"/g, '').replace(/,/g, '')) || 0;
      const aged65plus = parseInt(values[6].replace(/"/g, '').replace(/,/g, '')) || 0;
      
      data.push({
        area,
        allAges,
        aged0to17,
        aged18to24,
        aged25to49,
        aged50to64,
        aged65plus
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error loading UK age demographics:', error);
    return [];
  }
}

export function findCityAgeData(cityName: string, cityData: UKCityAgeData[]): UKCityAgeData | null {
  const normalizedCityName = cityName.toLowerCase().trim();
  
  return cityData.find(city => {
    const normalizedArea = city.area.toLowerCase().trim();
    return normalizedArea === normalizedCityName || 
           normalizedArea.includes(normalizedCityName) ||
           normalizedCityName.includes(normalizedArea);
  }) || null;
}
