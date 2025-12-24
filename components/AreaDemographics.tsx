"use client";

import React, { useEffect, useState } from "react";
import { loadUKAgeDemographics, CityData, IsCloseMatch } from "../lib/places";
import { Pie } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart, ChartData, ChartOptions, Legend, LinearScale, Tooltip, ArcElement } from "chart.js";

Chart.register(Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

interface AreaDemographicsProps {
  name: string;
}

const AreaDemographics: React.FC<AreaDemographicsProps> = ({
  name,
}) => {
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageGDP, setAverageGDP] = useState<string>("");
  const [averagePopulation, setAveragePopulation] = useState<string>("");
  const [averagePopulationDensity, setAveragePopulationDensity] = useState<string>("");
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allCityData = await loadUKAgeDemographics();
        setCityData(allCityData.find(c => c.Name === name || IsCloseMatch(c.Name, name)) || null);
        setAverageGDP(allCityData.find(c => c.Name === "AVG")?.GDP.toFixed(1) || "0");
        setAveragePopulation(allCityData.find(c => c.Name === "AVG")?.Population.toFixed(0) || "0");
        setAveragePopulationDensity((allCityData.find(c => c.Name === "AVG")?.Population! / allCityData.find(c => c.Name === "AVG")?.Area!).toFixed(1) || "0");
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
      <section className="w-full md:flex-1 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-neon-purple flex flex-col">
        <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Area Demographics</h2>
        <div className="flex items-center justify-center py-8 flex-1">
          <div className="text-text">Loading city data...</div>
        </div>
      </section>
    );
  }

  if (error || !cityData) {
    return (
      <section className="w-full md:flex-1 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-neon-purple flex flex-col">
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

  const chartOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          color: "#e5e7eb", // text-text color (tailwind slate-200)
          font: {
            size: 16,
            weight: "bold"
          },
          boxWidth: 22,
          padding: 18
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#27272a", // bg-foreground (slate-900)
        borderColor: "#a78bfa", // border-neon-purple/violet-400
        borderWidth: 1,
        titleColor: "#c4b5fd", // violet-300
        bodyColor: "#f1f5f9", // slate-50
        bodyFont: {
          size: 10
        },
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed;
            return `${value} (${(value / cityData.Population * 100).toFixed(0)}%)`;
          }
        },
        cornerRadius: 8,
        padding: 12,
        caretPadding: 6,
        titleFont: {
          size: 14
        },

      },
    },
  };
  const ageDemographicsData: ChartData<"pie", number[], string> = {
    labels: ["Age 0-17", "Age 18-24", "Age 25-49", "Age 50-64", "Age 65+"],
    datasets: [
      {
        label: "Age Demographics",
        data: [cityData.aged0to17, cityData.aged18to24, cityData.aged25to49, cityData.aged50to64, cityData.aged65plus],
        backgroundColor: ["rgb(57, 255, 20)", "rgb(15, 105, 255)", "rgb(255, 5, 5)", "rgb(140, 0, 255)", "rgb(255, 154, 0)"],
      },
    ],
  };

  return (
    <section className="w-full md:w-1/2 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-neon-purple flex flex-col">
      <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Area Demographics</h2>
      <div className="flex flex-col gap-2 text-text text-left text-sm mb-4 border-2 border-neon-blue rounded-sm bg-foreground-secondary p-2">
        <h3 className="text-3xl font-bold text-text mb-6 text-left pb-2">{name}</h3>
        <div className="flex flex-row justify-between mr-4">
          <span className="text-xl font-bold">Population: {cityData.Population}</span>
          <span className="italic text-lg">Average: {averagePopulation}</span>
        </div>
        <div className="flex flex-row justify-between mr-4">
          <span className="text-xl font-bold">Population Density (per km²): {(cityData.Population / cityData.Area).toFixed(1)}</span>
          <span className="italic text-lg">Average: {averagePopulationDensity}</span>
        </div>
        <div className="flex flex-row justify-between mr-4">
          <span className="text-xl font-bold">GDP (£m): {cityData.GDP.toFixed(1)}</span>
          <span className="italic text-lg">Average: {averageGDP}</span>
        </div>

      </div>
      <div className="w-full h-96">
        <Pie data={ageDemographicsData} options={chartOptions} />
      </div>
    </section>
  );
};

export default AreaDemographics; 