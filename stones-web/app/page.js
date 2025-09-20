"use client";


import React from 'react';
import Link from 'next/link';
import Image from "next/image";
import Button from "@/components/ui/button";

export default function Home() {
  return (
    <div className="overflow-hidden min-h-screen bg-[#ddeeff] grid grid-rows-[auto_1fr] gap-8 px-6 py-6">
      {/* Text Section - Top Center */}
      <div className="grid place-items-center mt-8 md:mt-16">
        <p className="text-3xl md:text-5xl font-inter font-bold text-[#2f2e30] text-center">
          hello there.
          <br />
          your scan,
          <br />
          explained clearly
        </p>
      </div>

      {/* Image and Buttons Section - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center justify-center max-w-6xl mx-auto">


{/* Buttons */}
        <div className="grid grid-cols-1 gap-4 w-full max-w-xs justify-items-stretch">
          {/* Signup - pushable button */}
          <Link href="/register" className="w-full">
            <Button variant="pushable" className="pill w-full py-3 text-lg font-medium bg-white text-[#2f2e30] rounded-full border border-[#2f2e30]/20
               relative transition-transform duration-300 ease-out hover:-translate-y-1 active:translate-y-0.5 
               shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
              Signup
            </Button>
          </Link>

          {/* Login - pushable button */}
          <Link href="/login" className="w-full">
            <Button variant="pushable" className="w-full py-3 text-lg font-medium bg-[#0e1246] text-white rounded-full
               relative transition-transform duration-300 ease-out hover:-translate-y-1 active:translate-y-0.5
               shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
              Login
            </Button>
          </Link>
        </div>

        {/* Image */}
        <div className="grid place-items-center">
          <Image
            src="/splash-screen.png"
            alt="Hero Image"
            width={500}
            height={500}
            className="max-w-full h-auto"
          />
        </div>

        
      </div>

      
    </div>
  );
}
