import Link from 'next/link';
import React from 'react';
import HeaderAuth from './header-auth';
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { EnvVarWarning } from "@/components/env-var-warning";

const Header = () => {

  return (
    <header
      className="items-center text-center flex flex-row justify-between p-4 m-0 header border-b-4 border-border shadow-lg shadow-violet-800"
    >
      <div className='lg:flex lg:flex-row text-text font-serif justify-evenly'>
        <h1 className='lg:text-5xl font-bold text-xl text-text rounded-md hover:scale-110 mx-4 px-12 transition-all duration-300 ease-in-out'><Link href="/">MarkitMinder</Link></h1>
        {/* <span className='text-2xl text-orange-400'>Mark It Down, Quickly!</span> */}
      </div>
      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
      
    </header>
  );
};

export default Header;
