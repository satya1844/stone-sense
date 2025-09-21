"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  const handleDoctorLogin = () => {
    router.push("/doctor-login");
  };

  return (
    <div className="min-h-screen bg-[#ddeeff] relative px-4 py-3">
      {/* Doctor Login Button - Top Right */}
      <div className="absolute  top-4 right-4">
        <button className="bg-transparent border-2 border-black rounded-3xl hover:bg-black hover:text-white p-3"
          onClick={handleDoctorLogin}
        >
          Doctor Login
        </button>
      </div>

      {/* Main Content Container */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-4xl w-full grid md:grid-cols-[1fr_auto] gap-8 p-8 md:p-12 items-center">
          
          {/* Left Section - Welcome Content */}
          <div className="flex flex-col gap-6 justify-center">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900  leading-tight">
              Hello there, <br/>your scan<br/>explained clearly
            </h1>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button
                variant="uiverse"
                className="flex-1"
                onClick={handleLogin}
              >
                Login
              </Button>
              <Button
                variant="uiverse"
                className="flex-1"
                onClick={handleSignup}
              >
                Sign Up
              </Button>
            </div>
          </div>

          {/* Right Section - Image */}
          <div className="hidden md:flex justify-center self-center">
            <Image
              src="/splash-screen.png"
              alt="Stone Sense Illustration"
              width={500}
              height={500}
              className="max-w-full h-auto rounded-xl "
            />
          </div>
        </div>
      </div>
    </div>
  );
}
