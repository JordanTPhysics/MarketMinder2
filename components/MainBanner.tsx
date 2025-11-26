'use client';

import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import Image from 'next/image'
import useMediaQuery from '@/lib/media-query'

const MainBanner = () => {

    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <section className="flex lg:flex-row md:flex-row flex-col items-center justify-evenly lg:p-2 w-screen bg-background-secondary">
            {!isMobile && <Image src="/images/mmlogo.png" alt="MarkitMinder Logo" width={100} height={100} />}
            <div className="flex flex-col items-center justify-evenly">
                <h1 className="lg:text-6xl text-3xl font-bold text-text text-center font-display">Home</h1>
                <div className='m-4 flex lg:flex-row md:flex-row flex-col justify-center gap-4'>
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
            {!isMobile && <Image src="/images/mmlogo.png" alt="MarkitMinder Logo" width={100} height={100} />}
        </section>
    )
}

export default MainBanner;