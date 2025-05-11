import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { type, lat, lng } = req.body;

  const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${type}&key=${apiKey}`;
  console.log(apiUrl);
  const response = await fetch(apiUrl);
  const data = await response.json();

  res.status(200).json(data); // Respond with geocoding results (city, country, etc.)
}