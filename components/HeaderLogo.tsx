"use client";

import useMediaQuery from '@/lib/media-query';
import Image from 'next/image';
import Link from 'next/link';

const HeaderLogo = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <div className='flex items-center'>
        <h1 className='lg:text-5xl font-bold italic text-xl text-text rounded-md hover:scale-110 mx-4 px-12 transition-all duration-300 ease-in-out'>
          <Link className='flex items-center justify-evenly gap-2' href="/">
          
          {!isMobile && "MarkitMinder"}
          <Image 
          src="/images/mmlogo.png" 
          alt="MarkitMinder Logo" 
          width={50} 
          height={50} 
          className="rounded-md"
        />
          </Link></h1>

      </div>
    )
}

export default HeaderLogo;