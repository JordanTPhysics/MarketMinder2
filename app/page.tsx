// Do not place client code in this file
import React from 'react';
import Link from 'next/link';

import { GiFluffyWing } from "react-icons/gi";
import { BsLightningCharge } from "react-icons/bs";
import { TbMapSearch } from "react-icons/tb";

export default async function Home() {
  return (
    <>
      <section className="flex flex-col items-center justify-evenly h-[80vh] p-2 w-screen">
        <div>
          <h1 className="lg:text-6xl text-3xl font-bold text-text">MarketMinder</h1>
          <span className="m-4 lg:text-2xl text-lg text-text"><span className='font-semibold'>FAST AND CHEAP </span>In-Browser competitor analytics</span>
          <div className='my-4'>
            <Link href="/sign-in" className="m-8 px-6 py-3 bg-slate-600 rounded-md text-lg font-semibold hover:bg-slate-700 transition duration-300">Sign In</Link>
            <Link href="/sign-up" className="m-8 px-6 py-3 bg-slate-600 rounded-md text-lg font-semibold hover:bg-slate-700 transition duration-300">Sign Up</Link>
          </div>
        </div>

        <span className="m-10 lg:text-4xl text-lg text-text font-serif bg-foreground p-4 rounded-md shadow-md shadow-violet-500/50 border-2 border-border hover:scale-105 transition duration-300">
          <Link href="/demo">Demo</Link>
        </span>
      </section>
      <section className="flex flex-col items-center justify-evenly p-2 w-screen">
        <h1 className="lg:text-9xl text-3xl m-4 font-bold font-serif italic text-text">Why?</h1>
        <span className='lg:text-3xl text-lg m-4 w-2/3'>
          Looking to start a business, or buy an existing one, but not sure of market viability?
          Interested in analyzing your local competitors to see how you can stand out?
          Or are you a sales rep looking for prospects? MarketMinder has all the tools you need to keep a finger on the pulse in real time.
        </span>
        <ul className="list-disc list-inside lg:text-3xl text-lg text-text">
          <li className="m-4 flex-row flex"><BsLightningCharge size={35} color='gold' className='mx-2' />scraping API of local market participants, reviews, ratings</li>
          <li className="m-4 flex-row flex"><TbMapSearch size={35} color='green' className='mx-2' />integrate with Google Maps API for competitor overview</li>
          <li className="m-4 flex-row flex"><GiFluffyWing size={35} color='silver' className='mx-2' />Swiftly view area demographics and analyze markets with our viability tools</li>
        </ul>
      </section>
    </>
  );
}
