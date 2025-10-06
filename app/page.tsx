// Do not place client code in this file
import React from 'react';
import Link from 'next/link';

import { GiFluffyWing } from "react-icons/gi";
import { BsLightningCharge } from "react-icons/bs";
import { TbMapSearch } from "react-icons/tb";
import { Button } from '@/components/ui/button';

export default async function Home() {
  return (
     <div className="w-screen min-h-screen flex flex-col items-center justify-evenly p-2">
      <section className="flex flex-col items-center justify-evenly p-2 w-screen bg-background-secondary">
        <h1 className="lg:text-6xl text-3xl font-bold text-text text-center font-display">Home</h1>
        <div className='m-4 flex flex-row justify-center gap-4'>
          <Button asChild size="lg" variant={"outline"}>
            <Link href="/demo">Demo</Link>
          </Button>
          <Button asChild size="lg" variant={"outline"}>
            <Link href="/sign-up">Sign Up</Link>
          </Button>
          <Button asChild size="lg" variant={"outline"}>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
        </section>
        <section className="flex flex-col items-center justify-evenly p-2 w-screen">
         <h1 className="lg:text-5xl text-3xl m-4 font-bold font-display italic text-text">Why?</h1>
        <span className='lg:text-3xl text-lg m-4 w-2/3'>
          Looking to start a business, or buy an existing one, but not sure of market viability?
          Interested in discovering your local competitors to see how you can stand out?
          Or are you a sales rep looking for prospects? MarkitMinder has all the tools you need to keep a finger on the pulse in real time.
        </span>
        <ul className="list-disc list-inside lg:text-3xl text-lg text-text">
          <li className="m-4 flex-row flex"><BsLightningCharge size={35} color='gold' className='mx-2' />Scrape hundreds of businesses, ratings and reviews in minutes</li>
          <li className="m-4 flex-row flex"><TbMapSearch size={35} color='green' className='mx-2' />Integrate with Google Maps API for competitor overview</li>
          <li className="m-4 flex-row flex"><GiFluffyWing size={35} color='silver' className='mx-2' />Swiftly view area demographics and analyze markets with our viability checks</li>
        </ul>
      </section>
      <section className="flex flex-col items-center justify-evenly p-2 w-screen">
        <span>What are you waiting for? Start now!</span>
        <Button asChild size="lg" variant={"outline"}>
          <Link href="/protected/dashboard">Dashboard</Link>
        </Button>
      </section>
    </div>
  );
}
