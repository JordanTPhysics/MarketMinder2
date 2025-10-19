import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

import { BsLightningCharge } from "react-icons/bs";
import { TbMapSearch } from "react-icons/tb";
import { GiFluffyWing } from "react-icons/gi";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-evenly p-2">
      <section className="flex flex-row items-center justify-evenly p-2 w-screen bg-background-secondary">
        <Image src="/images/mmlogo.png" alt="MarkitMinder Logo" width={100} height={100} />
        <div className="flex flex-col items-center justify-evenly">
          <h1 className="lg:text-6xl text-3xl font-bold text-text text-center font-display">Home</h1>
          <div className='m-4 flex flex-row justify-center gap-4'>
            <Button asChild size="lg" variant={"outline"}>
              <Link href="/protected/dashboard">Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant={"outline"}>
              <Link href="/protected/upgrade">Pricing</Link>
            </Button>
            <Button asChild size="lg" disabled={true} variant={"outline"}>
              <Link href="/protected/account">My Account</Link>
            </Button>
          </div>
        </div>
        <Image src="/images/mmlogo.png" alt="MarkitMinder Logo" width={100} height={100} />
      </section>
      <section className="flex flex-col items-center justify-evenly p-2 w-screen">
        <h1 className="lg:text-5xl text-3xl m-4 font-bold font-display italic text-text">Why?</h1>
        <span className='lg:text-3xl text-lg m-4 w-2/3'>
          Looking to start a business, or buy an existing one, but not sure of market viability?
          Interested in discovering your local competitors to see how you can stand out?
          Or are you a sales rep looking for prospects? MarkitMinder has all the tools you need to keep a finger on the pulse in real time.
        </span>
        <ul className="list-disc list-inside lg:text-3xl text-lg text-text">
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground  transition-all duration-300 rounded-lg p-2">
            <BsLightningCharge size={35} color='gold' className='mx-2 transition-colors duration-300' />
            <span className="transition-colors duration-300">Scrape hundreds of businesses, ratings and reviews in minutes</span>
          </li>
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground  transition-all duration-300 rounded-lg p-2">
            <TbMapSearch size={35} color='green' className='mx-2 transition-colors duration-300' />
            <span className="transition-colors duration-300">Integrate with Google Maps API for competitor overview</span>
          </li>
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground  transition-all duration-300 rounded-lg p-2">
            <GiFluffyWing size={35} color='silver' className='mx-2 transition-colors duration-300' />
            <span className="transition-colors duration-300">Swiftly view area demographics and analyze markets with our viability checks</span>
          </li>
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
