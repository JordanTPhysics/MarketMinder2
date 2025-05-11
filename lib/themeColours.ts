// utils/themeColors.ts
"use client";

export const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)',
    teal: 'rgb(0,128,128)',
    pink: 'rgb(255,192,203)',
    brown: 'rgb(165,42,42)',
    lime: 'rgb(0,255,0)',
    indigo: 'rgb(75,0,130)',
  };

export interface ChartColors {
    background: string;
    foreground: string;
    backgroundSecondary: string;
    text: string;
    border: string;
    warning: string;
    success: string;
    danger: string;
    info: string;
    soil: string;
    slate800: string;
    indigo: string;
}

export const getChartColors = (): ChartColors => {
    if (typeof window === 'undefined') return {
        background: '16, 48, 16',
        foreground: '74, 94, 74',
        backgroundSecondary: '6, 38, 6',
        text: '10, 20, 10',
        border: '141, 134, 141',
        warning: '233, 72, 8',
        success: '39, 181, 39',
        danger: '255, 0, 0',
        info: '53, 53, 193',
        soil: '84, 57, 45',
        slate800: '30, 41, 59',
        indigo: '75, 0, 130',
    };
    
    const rootStyle = getComputedStyle(document.documentElement);

    return {
        background: `rgb(${rootStyle.getPropertyValue('--background').trim()})`,
        foreground: `rgb(${rootStyle.getPropertyValue('--foreground').trim()})`,
        backgroundSecondary: `rgb(${rootStyle.getPropertyValue('--background-secondary').trim()})`,
        text: `rgb(${rootStyle.getPropertyValue('--text').trim()})`,
        border: `rgb(${rootStyle.getPropertyValue('--border').trim()})`,
        warning: `rgb(${rootStyle.getPropertyValue('--warning').trim()})`,
        success: `rgb(${rootStyle.getPropertyValue('--success').trim()})`,
        danger: `rgb(${rootStyle.getPropertyValue('--danger').trim()})`,
        info: `rgb(${rootStyle.getPropertyValue('--info').trim()})`,
        soil: `rgb(${rootStyle.getPropertyValue('--soil').trim()})`,
        slate800: `rgb(${rootStyle.getPropertyValue('--slate-800').trim()})`,
        indigo: `rgb(${rootStyle.getPropertyValue('--indigo').trim()})`,
    };
};

export const linearGradient = (color1: string, color2: string, steps: number): string[] => {
    const [r1, g1, b1] = parseRGB(color1);
    const [r2, g2, b2] = parseRGB(color2);

    return Array.from({ length: steps }, (_, i) => {
        const ratio = i / (steps - 1);

        const r = Math.floor(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.floor(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.floor(b1 * (1 - ratio) + b2 * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    });
};

export const exponentialGradient = (color1: string, color2: string, steps: number): string[] => {

    const [r1, g1, b1] = parseRGB(color1);
    const [r2, g2, b2] = parseRGB(color2);
  
    return Array.from({ length: steps }, (_, i) => {
        const ratio = i / (steps - 1);
  
      const r = Math.floor(r1 * Math.pow((r2 / r1) * 5, ratio));
      const g = Math.floor(g1 * Math.pow((g2 / g1) * 5, ratio));
      const b = Math.floor(b1 * Math.pow((b2 / b1) * 5, ratio));
  
      return `rgb(${r}, ${g}, ${b})`;
    });
  };

  const parseRGB = (color: string): [number, number, number] => {
    const [r, g, b] = color.match(/[0-9]{1,3}/g)?.map(Number) ?? [0, 0, 0];
    return [r, g, b];
  };

type ChartColorKeys = keyof typeof CHART_COLORS;

export function colorNameToRgb(color: ChartColorKeys): string {
    try {
        const rgb = CHART_COLORS[color];
        return rgb;
    } catch {
        return 'rgb(0, 0, 0)'; // default color if not found
    }
}

export function rgbToRgba(rgb: string, alpha: number): string {
    const [r, g, b] = parseRGB(rgb);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}



