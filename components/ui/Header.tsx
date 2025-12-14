import React from 'react';
import AuthButtons from '@/components/ui/AuthButtons';
import HeaderLogo from '@/components/ui/HeaderLogo';

const Header = () => {

  return (
    <header
      className="w-full items-center text-center flex justify-center lg:flex-row md:flex-row flex-col lg:justify-between p-4 m-0 bg-slate-700/90 backdrop-blur-sm"
    >
      <div className='lg:flex lg:flex-row text-text font-display justify-evenly items-center'>
        <HeaderLogo />
      </div>
      <AuthButtons />
      
    </header>
  );
};

export default Header;
