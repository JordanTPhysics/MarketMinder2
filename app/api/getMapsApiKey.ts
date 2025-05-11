// pages/api/someEndpoint.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  ; // This remains hidden from the client
  // Use the apiKey to make server-side requests
  // ...
  res.status(200).json({ message: 'Success' });
}
