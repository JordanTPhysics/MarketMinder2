"use client";

import Link from 'next/link';
import Image from 'next/image';

import { RiNextjsLine, RiReactjsLine, RiTailwindCssLine } from 'react-icons/ri';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

import useMediaQuery from '../lib/media-query';


export default function Footer() {

  const size = useMediaQuery('(min-width: 640px)') ? 45 : 25;
  const iconColor = 'rgba(var(--text))';

  return <footer className='bg-gradient-to-t from-slate-800 to-violet-800 border-t-4 border-border text-text text-center pt-2'>
    <div className='flex flex-row justify-evenly'>
      <div className='mx-auto'>
        Built using NextJS and Tailwind CSS
        <div className='flex flex-row'>
          <Link href='https://nextjs.org/' className='mx-auto' target='_blank'><RiNextjsLine size={size} color="black" /></Link>
          <Link href='https://tailwindcss.com/' className='mx-auto' target='_blank'><RiTailwindCssLine size={size} color="turquoise" /></Link>
        </div>
      </div>
      <div className='mx-auto'>© 2025 MarkitMinder
        <div className='flex flex-row'>
          <Link href='https://github.com/JordanTPhysics' className='mx-auto' target='_blank'><FaGithub size={size} color={iconColor} /></Link>

        </div>
      </div>

    </div>
  </footer>;
}