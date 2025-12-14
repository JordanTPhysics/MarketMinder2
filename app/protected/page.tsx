import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MainBanner from "@/components/MainBanner";
import { getDashboardRouteServer } from "@/utils/dashboard-routing";


import { BsLightningCharge } from "react-icons/bs";
import { TbMapSearch } from "react-icons/tb";
import { GiFluffyWing } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const dashboardRoute = await getDashboardRouteServer(supabase);

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-evenly p-2">
      <MainBanner />
      <section className="flex flex-col items-center justify-evenly p-2 w-screen">
        <h1 className="lg:text-5xl text-3xl m-4 font-bold font-display italic text-text">Why?</h1>
        <span className='lg:text-3xl text-lg m-4 w-2/3'>
          Looking to start a business, or buy an existing one, but not sure of market viability?
          Interested in discovering your local competitors to see how you can stand out?
          Or are you a sales rep looking for prospects? MarkitMinder has all the tools you need to keep a finger on the pulse in real time.
        </span>
        <ul className="list-disc list-inside lg:text-3xl text-lg text-text">
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground transition-all duration-300 rounded-lg p-2">
            <TbTargetArrow size={35} color='red' className='mx-2 transition-colors duration-300' />
            <span >Only the latest, most accurate data for hundreds of businesses in minutes</span>
          </li>
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground transition-all duration-300 rounded-lg p-2">
            <BsLightningCharge size={35} color='gold' className='mx-2 transition-colors duration-300' />
            <span >30 seconds to evaluation: are you winning on the metrics that matter?</span>
          </li>
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground transition-all duration-300 rounded-lg p-2">
            <TbMapSearch size={35} color='green' className='mx-2 transition-colors duration-300' />
            <span >Integrated with Google Maps API - choose the KPIs that matter to you</span>
          </li>
          <li className="m-4 flex-row flex group cursor-pointer hover:bg-foreground transition-all duration-300 rounded-lg p-2">
            <GiFluffyWing size={35} color='silver' className='mx-2 transition-colors duration-300' />
            <span>Swiftly view area demographics and analyze markets with business intelligence</span>
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
