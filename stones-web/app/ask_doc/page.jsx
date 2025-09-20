"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Contact Information
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Help us reach you with your results (optional)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              leftIcon={<Phone className="h-4 w-4" />}
            />
            
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                variant="uiverse"
                className="w-full"
                isLoading={loading}
                disabled={!phone && !email}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue to Upload
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleSkip}
                leftIcon={<ArrowRight className="h-4 w-4" />}
              >
                Skip for now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
