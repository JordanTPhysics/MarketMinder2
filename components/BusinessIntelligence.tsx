"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
  Filler,
);

interface BusinessIntelligenceProps {
  averageReviewScore: number;
  averageBusinessScore: number;
  maxBusinessScore: number;
  userBusinessName: string;
  places: any[];
  gdp?: number;
  population?: number;
  populationDensity?: number;
}

const BusinessIntelligence: React.FC<BusinessIntelligenceProps> = ({
  averageReviewScore,
  averageBusinessScore,
  maxBusinessScore,
  userBusinessName,
  places,
}) => {
  // Find user's business in results
  const userBusiness = userBusinessName
    ? places.find(place =>
      place.PlaceName.toLowerCase().includes(userBusinessName.toLowerCase()) ||
      userBusinessName.toLowerCase().includes(place.PlaceName.toLowerCase())
    )
    : null;

  // Calculate average business score as percentage of max
  const averageBusinessScorePercentage = maxBusinessScore > 0
    ? (averageBusinessScore / maxBusinessScore) * 100
    : 0;

  // Calculate user's business score as percentage of max
  const userBusinessScorePercentage = userBusiness && maxBusinessScore > 0
    ? ((userBusiness.BusinessScore || 0) / maxBusinessScore) * 100
    : 0;

  // Prepare chart data: sort all places by business score (highest to lowest)
  const sortedPlaces = [...places].sort((a, b) => (b.BusinessScore || 0) - (a.BusinessScore || 0));
  const chartLabels = sortedPlaces.map((place, index) => {
    // Truncate long names for better display
    const name = place.PlaceName.length > 20
      ? place.PlaceName.substring(0, 20) + '...'
      : place.PlaceName;
    return `${index + 1}. ${name}`;
  });
  const chartScores = sortedPlaces.map(place => place.BusinessScore || 0);

  // Find index of user's business in sorted array
  const userBusinessIndex = userBusiness
    ? sortedPlaces.findIndex(p => p.PlaceID === userBusiness.PlaceID)
    : -1;

  // Create background colors array - highlight user's business and average
  const backgroundColors = sortedPlaces.map((place, index) => {
    if (userBusiness && place.PlaceID === userBusiness.PlaceID) {
      return 'rgba(251, 191, 36, 0.8)'; // Gold/amber for user's business
    }
    return 'rgba(139, 92, 246, 0.6)'; // Violet for others
  });

  const borderColors = sortedPlaces.map((place, index) => {
    if (userBusiness && place.PlaceID === userBusiness.PlaceID) {
      return 'rgba(251, 191, 36, 1)'; // Gold/amber border
    }
    return 'rgba(139, 92, 246, 1)'; // Violet border
  });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Average',
        data: chartLabels.map(() => averageBusinessScore),
        type: 'line' as const,
        borderColor: "rgba(34, 197, 94, 1)", // Green color
        backgroundColor: "rgba(34, 197, 94, 0.1)", // Light green fill
        borderWidth: 2,
        borderDash: [5, 5], // Dashed line for better visibility
        fill: false,
        pointRadius: 0, // Hide points on the line
        pointHoverRadius: 0,
        order: 2, // Render this dataset first (behind bars)
      },
      {
        label: 'Business Score',
        data: chartScores,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        order: 1, // Render this dataset second (on top of line)
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb', // text-text color
        },
      },
      title: {
        display: true,
        text: `Business Scores Comparison (Average: ${averageBusinessScore.toFixed(1)})`,
        color: '#e5e7eb',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#e5e7eb',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#e5e7eb',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#e5e7eb',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        title: {
          display: true,
          text: 'Business Score',
          color: '#e5e7eb',
        },
      },
    },
  };

  return (
    <section className="w-full md:w-1/2 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border flex flex-col">
      <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Intelligence</h2>
      <div className="flex flex-col gap-2 text-text text-left text-sm mb-4 border-2 border-border rounded-sm bg-slate-700 p-2">
        <h3 className="text-xl font-bold text-text mb-6 text-left pb-2">{userBusiness ? `${userBusiness.PlaceName} (${userBusinessName})` : "All Businesses"}</h3>
        <div className="flex flex-row justify-between mr-4">
          <span className="text-xl font-bold">Review Score: {userBusiness?.Rating}</span>
          <span className="italic text-lg">Average: {averageReviewScore?.toFixed(1)}</span>
        </div>
        <div className="flex flex-row justify-between mr-4">
          <span className="text-xl font-bold">Business Score: {userBusiness?.BusinessScore}</span>
          <span className="italic text-lg">Average: {averageBusinessScore?.toFixed(1)}</span>
        </div>
      </div>
      <div className="w-full h-96">
        
        <Bar data={chartData as any} options={chartOptions} />
      </div>
      {userBusiness && userBusinessIndex >= 0 && (
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 bg-amber-500 rounded mr-2"></span>
          {userBusiness.PlaceName} (Rank #{userBusinessIndex + 1})
        </div>
      )}
      <div className="flex items-center">
        <span className="inline-block w-4 h-4 border-2 border-green-500 rounded mr-2"></span>
        Average: {averageBusinessScore?.toFixed(1)}
      </div>

      {/* Show note if business name provided but no match found */}
      {userBusinessName && !userBusiness && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <div className="text-amber-800 font-semibold mb-2">Business Not Found</div>
          <div className="text-amber-700 text-sm">
            "{userBusinessName}" was not found in the search results. This could mean:
            <ul className="list-disc list-inside mt-2 ml-4">
              <li>The business name doesn't match exactly</li>
              <li>The business is not in the search area</li>
              <li>The business type doesn't match your search criteria</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default BusinessIntelligence; 