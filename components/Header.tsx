import Link from 'next/link';
import React from 'react';
import HeaderAuth from './header-auth';
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { EnvVarWarning } from "@/components/env-var-warning";

const Header = () => {

  return (
    <header
      className="items-center text-center flex flex-row justify-between p-4 m-0 header bg-slate-800 border-b-4 border-border shadow-lg shadow-violet-800"
    >
      <div className='lg:flex lg:flex-row text-text font-serif justify-evenly'>
        <h1 className='lg:text-5xl font-bold text-xl text-text rounded-md hover:scale-110 mx-4 px-12 transition-all duration-300 ease-in-out'><Link href="/">MarketMinder</Link></h1>
        {/* <Link href="/blog" className='lg:text-3xl -skew-x-6 text-lg mx-auto lg:px-4 px-12 hover:scale-110 rounded-r-md transition-all duration-300 ease-in-out link-border' >Blog</Link> */}
        {/* <Link href="/tracker" className='lg:text-3xl -skew-x-6 text-lg mx-auto lg:px-4 px-12 hover:scale-110 rounded-l-md transition-all duration-300 ease-in-out link-border' >Tracker</Link> */}
        {/* <Link href="/cases" className='lg:text-3xl -skew-x-6 text-lg mx-auto lg:px-4 px-12 hover:scale-110 rounded-l-md transition-all duration-300 ease-in-out link-border' >Case Studies</Link> */}
      </div>
      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
      
    </header>
  );
};

export default Header;
