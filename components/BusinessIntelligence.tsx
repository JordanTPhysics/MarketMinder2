"use client";

import React from "react";

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


  // Metrics for display
  const metrics = [
    { label: "Review Score", value: averageReviewScore, max: 5, suffix: "/5" },
    { label: "Average Business Score", value: averageBusinessScorePercentage, max: 100, suffix: "%" },
    userBusiness ? { label: "Your Score", value: userBusinessScorePercentage, max: 100, suffix: "%" } : undefined,
  ].filter(Boolean) as MetricBarProps[];

  return (
    <section className="w-full md:flex-1 mt-8 bg-foreground rounded-lg shadow-lg p-6 border-2 border-border flex flex-col">
            <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Intelligence</h2>
            <h3 className="text-xl font-bold text-text mb-6 text-left pb-2">{userBusinessName}</h3>
      <div className="flex flex-col gap-2">
        {metrics.map((metric) => (
          <MetricBar key={metric.label} {...metric} />
        ))}
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