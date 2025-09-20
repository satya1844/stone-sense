"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/button';

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Wire to auth flow
+    console.log('Signup clicked', form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFC1D6] p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#2f2e30] mb-6">
          Enter your details
          <br />
          to continue
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="name"
              className="w-full rounded-full bg-white/95 px-4 py-3 text-[#2f2e30] placeholder:text-[#7a7a7a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b1f5a]"
            />
          </div>
          <div>
            <input
              name="contact"
              value={form.contact}
              onChange={handleChange}
              placeholder="mobile number / email"
              className="w-full rounded-full bg-white/95 px-4 py-3 text-[#2f2e30] placeholder:text-[#7a7a7a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b1f5a]"
            />
          </div>
          <div>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="username"
              className="w-full rounded-full bg-white/95 px-4 py-3 text-[#2f2e30] placeholder:text-[#7a7a7a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b1f5a]"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="password"
              className="w-full rounded-full bg-white/95 px-4 py-3 text-[#2f2e30] placeholder:text-[#7a7a7a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b1f5a]"
            />
          </div>

          {/* Next button with offset white shadow */}
          <div className="pt-2">
            <div className="relative inline-block">
              <div className="absolute -bottom-1 -right-1 h-12 w-full rounded-full bg-white/70" />
              <Button type="submit" className="relative z-[1] rounded-full bg-[#0e1246] text-white px-8 h-12">
                Next
              </Button>
            </div>
          </div>
        </form>

        {/* Illustration */}
        <div className="mt-10 flex justify-center">
          <Image
            src="/Doctor-amico 1.png"
            alt="Doctor Illustration"
            width={180}
            height={180}
            className="h-auto w-auto"
          />
        </div>
      </div>
    </div>
  );
}
