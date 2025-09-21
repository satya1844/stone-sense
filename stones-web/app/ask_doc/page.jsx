"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/button";
export default function AskDocPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSkip = () => {
    router.push("/upload");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Here you could save the contact info to user profile
    // For now, just simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    router.push("/upload");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#92e3a9',
        
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => router.push("/register")}
        className="absolute top-6 left-6 p-3 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>
      
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row bg-[#92e3a9] rounded-2xl  overflow-hidden">
          {/* Image Section */}
          <div className="lg:w-1/2 flex items-center justify-center p-8" >
            <img
              src="/doc.png"
              alt="Doctor consultation illustration"
              className="w-full max-w-lg h-auto object-contain scale-110"
            />
          </div>

          {/* Form Section */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Do you already have a doctor?
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Share their contact to send reports if needed. Don't have one? We'll suggest trusted doctors.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="mobile number"
                      className="w-full px-6 py-4  border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition-all duration-200"
                    />
                  </div>
                  
                  <div className="text-center text-gray-400 font-medium">
                    or
                  </div>
                  
                  <div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email id"
                      className="w-full px-6 py-4 bg-gray-50 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="pt-6 align-middle  ">
                  <Button
                    type="button"
                    disabled={(!phone && !email) || loading}
                    className="w-1/2  my-3 mr-5"
                    variant="uiverse"
                    
                  >
                    {loading ? "Processing..." : "Next"}

                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleSkip}
                    className="w-1/3.5 mx-5"
                    variant="uiverse"
                    
                  >
                    Skip for now
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
