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

    }, accessorKey: "Rating",
    cell: ({ cell }) => {
      return <StarRating rating={cell.row.original.Rating} size="sm" />;
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
          {cell.getValue<string>().replaceAll(",", "")}
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
