"use client";

import React, { useEffect, useState } from "react";
import { loadUKAgeDemographics, findCityAgeData, UKCityAgeData } from "../lib/places";

interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, max = 100, suffix = "%" }) => {
  const percent = Math.round((value / max) * 100);
  return (
    <div className="flex items-center mb-4 w-full">
      <div className="w-48 text-left font-semibold text-text">{label}</div>
      <div className="flex-1 bg-slate-700 rounded-md h-6 mx-2 relative">
        <div
          className="bg-violet-500 h-6 rounded-md transition-all duration-300"
          style={{ width: `${percent}%` }}
        ></div>
        <span className="absolute right-2 top-0 h-6 flex items-center font-semibold text-white">
          {Number.isInteger(value) ? value.toString() : value.toFixed(1)}
          {suffix}
        </span>
      </div>
    </div>
  );
};

interface AreaDemographicsProps {
  name: string;
  userBusinessName: string;
  places: any[];
  population?: number;
  populationDensity?: number;
}

const AreaDemographics: React.FC<AreaDemographicsProps> = ({
  userBusinessName,
  places,
  population,
  populationDensity,

  name,
}) => {
  const [cityData, setCityData] = useState<UKCityAgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allCityData = await loadUKAgeDemographics();
        const foundCity = findCityAgeData(name, allCityData);
        setCityData(foundCity);
        setError(null);
      } catch (err) {
        setError('Failed to load city data');
        console.error('Error loading city data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [name]);

  // Find user's business in results
  const userBusiness = userBusinessName
    ? places.find(place =>
      place.PlaceName.toLowerCase().includes(userBusinessName.toLowerCase()) ||
      userBusinessName.toLowerCase().includes(place.PlaceName.toLowerCase())
    )
    : null;

  if (loading) {
    return (
      <section className="w-full md:flex-1 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border flex flex-col">
        <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Area Demographics</h2>
        <div className="flex items-center justify-center py-8 flex-1">
          <div className="text-text">Loading city data...</div>
        </div>
      </section>
    );
  }

  if (error || !cityData) {
    return (
      <section className="w-full md:flex-1 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border flex flex-col">
        <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Area Demographics</h2>
        <div className="flex items-center justify-center py-8 flex-1">
          <div className="text-text text-center">
            <div className="text-lg font-semibold mb-2">No data available</div>
            <div className="text-sm text-muted-foreground">
              Age demographics data not found for "{name}"
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Calculate age demographics percentages
  const totalPopulation = cityData.allAges;
  const ageDemographics = [
    {
      label: "Age 0-17 (%)",
      value: Math.round((cityData.aged0to17 / totalPopulation) * 100)
    },
    {
      label: "Age 18-24 (%)",
      value: Math.round((cityData.aged18to24 / totalPopulation) * 100)
    },
    {
      label: "Age 25-49 (%)",
      value: Math.round((cityData.aged25to49 / totalPopulation) * 100)
    },
    {
      label: "Age 50-64 (%)",
      value: Math.round((cityData.aged50to64 / totalPopulation) * 100)
    },
    {
      label: "Age 65+ (%)",
      value: Math.round((cityData.aged65plus / totalPopulation) * 100)
    },
  ];

  // Metrics for display
  const metrics = [
    { label: "Population", value: totalPopulation, max: 20000000, suffix: "" },
    populationDensity !== undefined ? { label: "Population Density (/km²)", value: populationDensity, max: 20000, suffix: "" } : undefined,
    ...ageDemographics,
  ].filter(Boolean) as MetricBarProps[];

  // Simple overall score calculation (mock, can be improved)

  return (
    <section className="w-full md:flex-1 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border flex flex-col">
      <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Area Demographics</h2>
      <h3 className="text-xl font-bold text-text mb-6 text-left pb-2">{name}</h3>
      <div className="flex flex-col gap-2">
        {metrics.map((metric) => (
          <MetricBar key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
};

export default AreaDemographics; 