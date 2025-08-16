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

interface BusinessViabilitySectionProps {
  name: string;
  averageReviewScore: number;
  gdp?: number;
  population?: number;
  populationDensity?: number;
  notableFeatures?: string[];
}

const BusinessViabilitySection: React.FC<BusinessViabilitySectionProps> = ({
  averageReviewScore,
  gdp,
  population,
  populationDensity,
  notableFeatures = [
    "High foot traffic",
    "Tourist hotspot",
    "Near public transport",
  ],
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

  if (loading) {
    return (
      <section className="w-full max-w-2xl mx-auto mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border">
        <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Viability Rating ({name})</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-text">Loading city data...</div>
        </div>
      </section>
    );
  }

  if (error || !cityData) {
    return (
      <section className="w-full max-w-2xl mx-auto mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border">
        <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Viability Rating ({name})</h2>
        <div className="flex items-center justify-center py-8">
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
    gdp !== undefined ? { label: "GDP (USD)", value: gdp, max: 100000, suffix: "" } : undefined,
    { label: "Population", value: totalPopulation, max: 20000000, suffix: "" },
    populationDensity !== undefined ? { label: "Population Density (/km²)", value: populationDensity, max: 20000, suffix: "" } : undefined,
    { label: "Review Score", value: averageReviewScore, max: 5, suffix: "/5" },
    ...ageDemographics,
  ].filter(Boolean) as MetricBarProps[];

  // Simple overall score calculation (mock, can be improved)
  const overallScore = Math.round((
    (gdp ? Math.min(gdp / 100000, 1) * 0.2 : 0.1) +
    (populationDensity ? Math.min(populationDensity / 20000, 1) * 0.2 : 0.1) +
    (averageReviewScore / 5 * 0.3) +
    0.3
  ) * 100);

  return (
    <section className="w-full max-w-2xl mx-auto mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border">
      <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Viability Rating ({name})</h2>
      <div className="flex flex-col gap-2">
        {metrics.map((metric) => (
          <MetricBar key={metric.label} {...metric} />
        ))}
      </div>
      {/* <div className="mt-6">
        <div className="font-semibold text-text mb-2">Notable Features:</div>
        <div className="flex flex-wrap gap-2">
          {notableFeatures.map((feature) => (
            <span key={feature} className="bg-violet-700 text-white px-3 py-1 rounded-full text-sm font-medium border border-violet-400">{feature}</span>
          ))}
        </div>
      </div> */}
      <div className="mt-8 flex items-center justify-between">
        <span className="text-lg font-semibold text-text">Overall Score</span>
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 text-white px-4 py-2 rounded-lg text-xl font-bold border-2 border-violet-800">{overallScore}%</div>
        </div>
      </div>
    </section>
  );
};

export default BusinessViabilitySection; 