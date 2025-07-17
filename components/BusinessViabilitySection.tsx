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
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
};

interface BusinessViabilitySectionProps {
  averageReviewScore: number;
  gdp?: number;
  population?: number;
  populationDensity?: number;
  ageDemographics?: { label: string; value: number }[];
  notableFeatures?: string[];
}

const BusinessViabilitySection: React.FC<BusinessViabilitySectionProps> = ({
  averageReviewScore,
  gdp,
  population,
  populationDensity,
  ageDemographics = [
    { label: "Age 18-35 (%)", value: 38 },
    { label: "Age 36-65 (%)", value: 44 },
    { label: "Age 65+ (%)", value: 18 },
  ],
  notableFeatures = [
    "High foot traffic",
    "Tourist hotspot",
    "Near public transport",
  ],
}) => {
  // Metrics for display
  const metrics = [
    gdp !== undefined ? { label: "GDP (USD)", value: gdp, max: 100000, suffix: "" } : undefined,
    population !== undefined ? { label: "Population", value: population, max: 20000000, suffix: "" } : undefined,
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
      <h2 className="text-2xl font-bold text-text mb-6 text-left border-b-2 pb-2">Business Viability Rating</h2>
      <div className="flex flex-col gap-2">
        {metrics.map((metric) => (
          <MetricBar key={metric.label} {...metric} />
        ))}
      </div>
      <div className="mt-6">
        <div className="font-semibold text-text mb-2">Notable Features:</div>
        <div className="flex flex-wrap gap-2">
          {notableFeatures.map((feature) => (
            <span key={feature} className="bg-violet-700 text-white px-3 py-1 rounded-full text-sm font-medium border border-violet-400">{feature}</span>
          ))}
        </div>
      </div>
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