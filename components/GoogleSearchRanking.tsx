import React, { useEffect, useState } from 'react';
import { apiClient } from "@/utils/enhanced-api-client";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { DataTable } from './ui/data-table';
import { ColumnDef } from '@tanstack/react-table';



const parseGoogleSearch = (data: any) => {
    return data.items.map((item: any) => {
        return {
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        };
    });
};

export interface GoogleSearchResultData {
    title: string;
    link: string;
    snippet: string;
}
const columns: ColumnDef<GoogleSearchResultData>[] = [
    {
        header: 'Title',
        accessorKey: 'title',
    },
    {
        header: 'Link',
        accessorKey: 'link',
        cell: ({ row }) => {
            return <Link href={row.original.link} target="_blank" rel="noopener noreferrer">{row.original.link}</Link>
        },
    },
    {
        header: 'Snippet',
        accessorKey: 'snippet',
    },
];


const GoogleSearchResult = ({ placeName, location, type }: { placeName: string, location: string, type: string }) => {
    const [ranking, setRanking] = useState<number>(0);
    const [results, setResults] = useState<GoogleSearchResultData[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchGoogleSearch = async (location: string, type: string) => {
        const data = await apiClient.getGoogleCustomSearch({
            query: type + ' ' + location
        });

        const results = parseGoogleSearch(data);
        setResults(results);
        setRanking(results.findIndex((result: GoogleSearchResultData) => result.title.toLowerCase().includes(placeName.toLowerCase()) || result.snippet.toLowerCase().includes(placeName.toLowerCase())) + 1);
    };

    return (
        <div className="w-full flex flex-col gap-4 relative z-0">
            <span className="text-text text-2xl text-left font-semibold">Check Google Search Rankings for {placeName} in {location} (Beta)</span>
            {results.length > 0 &&
                <div className="flex flex-col text-xl font-semibold items-center justify-center border-2 border-neon-purple bg-slate-700 rounded-md p-2 w-1/3 mx-auto">
                    <span>Google Search Ranking: {ranking}</span>
                    <br/>
                    {ranking === 0 ? <span>Your business did not appear on the first page of Google Search</span> : null}
                </div>
            }

            <Button
                variant="outline"
                className="px-6 mx-auto bg-foreground border-2 border-neon-green rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300"
                onClick={() => fetchGoogleSearch(location, type)}>
                {results.length > 0 ? 'Refresh' : 'Fetch'}
            </Button>

            <div className="overflow-auto max-h-64 w-2/3 mx-auto">
                {results.length > 0 ? (
                    <DataTable 
                        data={results} 
                        columns={columns}
                        getRowClassName={(row) => {
                            const normalizedPlaceName = placeName.toLowerCase();
                            const matchesTitle = row.title.toLowerCase().includes(normalizedPlaceName);
                            const matchesSnippet = row.snippet.toLowerCase().includes(normalizedPlaceName);
                            return (matchesTitle || matchesSnippet) 
                                ? "bg-neon-orange/30 hover:bg-neon-orange/40 border-neon-orange" 
                                : "";
                        }}
                    />
                ) : (
                    <span className="text-text text-lg text-center">Click 'Fetch'</span>
                )}
            </div>
        </div>
    );
};

export default GoogleSearchResult;