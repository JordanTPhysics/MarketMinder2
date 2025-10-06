import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import HeaderAuth from './header-auth';
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { EnvVarWarning } from "@/components/env-var-warning";

const Header = () => {

  return (
    <header
      className="items-center text-center flex flex-row justify-between p-4 m-0 bg-slate-700/90 backdrop-blur-sm"
    >
      <div className='lg:flex lg:flex-row text-text font-display justify-evenly items-center'>
        <div className='flex items-center'>
          <h1 className='lg:text-5xl font-bold italic text-xl text-text rounded-md hover:scale-110 mx-4 px-12 transition-all duration-300 ease-in-out'>
            <Link className='flex items-center justify-evenly gap-2' href="/">
            
            MarkitMinder
            <Image 
            src="/images/mmlogo.png" 
            alt="MarkitMinder Logo" 
            width={50} 
            height={50} 
            className="rounded-md"
          />
            </Link></h1>

        </div>
      </div>
      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
      
    </header>
  );
};

export default Header;
