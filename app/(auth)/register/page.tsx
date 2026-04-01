"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, Zap, Shield, Star, Lock, GraduationCap, Briefcase, School, Coins, TrendingUp, Beaker, Palette, Calculator, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
 


type ExamCategory = "senior" | "junior" | "professional";
type Specialization = "sciences" | "arts" | "commercial" | "general";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

const EXAM_CATEGORIES = [
  {
    id: "senior" as const,
    label: "Senior Secondary (SS1-SS3)",
    description: "JAMB, WAEC, NECO - University & College Entry",
    icon: GraduationCap,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    exams: ["JAMB/UTME", "WAEC/SSCE", "NECO"],
    hasSpecialization: true
  },
  {
    id: "junior" as const,
    label: "Junior Secondary (JSS1-JSS3)",
    description: "Common Entrance, BECE, Junior WAEC",
    icon: School,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    exams: ["Common Entrance", "BECE", "Junior WAEC"],
    hasSpecialization: false,
     comingSoon: true 
  },
  {
    id: "professional" as const,
    label: "Job Interview & Career",
    description: "Aptitude Tests, General Knowledge, Interview Prep",
    icon: Briefcase,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    exams: ["Job Aptitude", "Interview Prep", "General Knowledge"],
    hasSpecialization: false,
    comingSoon: true 
  }
];

const SPECIALIZATIONS = [
  {
    id: "sciences" as const,
    label: "Science",
    description: "Physics, Chemistry, Biology, Mathematics",
    icon: Beaker,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics"]
  },
  {
    id: "arts" as const,
    label: "Arts",
    description: "Literature, Government, CRS, History",
    icon: Palette,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    subjects: ["Literature", "Government", "CRS", "History", "Geography"]
  },
  {
    id: "commercial" as const,
    label: "Commercial",
    description: "Accounting, Commerce, Economics",
    icon: Calculator,
    color: "bg-green-100 text-green-700 border-green-200",
    subjects: ["Accounting", "Commerce", "Economics", "Business Studies"]
  },
  {
    id: "general" as const,
    label: "General / All Subjects",
    description: "Access all subjects across all fields",
    icon: GraduationCap,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    subjects: ["All Subjects"]
  }
];

const STARTER_CREDIT_PACKAGES = [
  {
    id: 'starter-Base',
    name: 'Base Pack',
    credits: 50,
    price: 1000,
    bonus: 10,
    description: 'Test the waters whit this plan',
    isFree: true,
  },
  {
    id: 'starter-basic',
    name: 'Basic Pack',
    credits: 100,
    price: 2000,
    bonus: 10,
    description: 'Perfect for getting started',
    popular: true,
    isFree: false,
  },
  {
    id: 'starter-premium',
    name: 'Premium Pack',
    credits: 250,
    price: 5000,
    bonus: 50,
    description: 'Best value for serious students',
    isFree: false,
  }
];
export default function RegisterOnboarding() {
  const [step, setStep] = useState<'register' | 'specialization' | 'verify' | 'plan'>('register');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [examCategory, setExamCategory] = useState<ExamCategory | "">("");
  const [specialization, setSpecialization] = useState<Specialization | "">("");
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(STARTER_CREDIT_PACKAGES[1]);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  
  const router = useRouter();

  const handleCategoryNext = () => {
    if (!examCategory) {
      toast.error("Please select your exam category");
      return;
    }
    
    const selectedCategory = EXAM_CATEGORIES.find(cat => cat.id === examCategory);
    
    if (selectedCategory?.hasSpecialization) {
      setStep('specialization');
    } else {
      setSpecialization('general');
      handleRegister();
    }
  };

 
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!examCategory) {
      toast.error("Please select your exam category");
      return;
    }

    const selectedCategory = EXAM_CATEGORIES.find(cat => cat.id === examCategory);
    if (selectedCategory?.hasSpecialization && !specialization) {
      toast.error("Please select your subject specialization");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName: name,
          examCategory: examCategory as ExamCategory,
          specialization: specialization || 'general',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

  
      setUserId(data.user.id || data.userId);

      await fetch(`${API_BASE_URL}/auth/send-verification-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
});

setStep('verify');
      
    
      if (data.verificationToken) {
        setVerificationToken(data.verificationToken);
      }

      toast.success("Account created! Please verify your email.");
      setLoading(false);
      setStep('verify');

    } catch (error: any) {
      console.error("Registration error:", error);
     
      if (error.message.includes("email already exists") || error.message.includes("already registered")) {
        toast.error("This email is already registered. Please log in.");
      } else if (error.message.includes("weak password")) {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else if (error.message.includes("invalid email")) {
        toast.error("Invalid email address.");
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };


const handleResendVerification = async () => {
  setResendingEmail(true);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-verification-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email }),
    });

    if (!response.ok) throw new Error('Failed to send OTP');
    
    toast.success("OTP sent to your email!");
  } catch (error) {
    toast.error("Failed to send OTP. Please try again.");
  } finally {
    setResendingEmail(false);
  }
};


const handleVerifyOTP = async () => {
  if (otp.length < 4) {
    toast.error("Please enter the full OTP code");
    return;
  }
  
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }), 
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid OTP code');
    }
    
    toast.success("Email verified successfully! 🎉");
    setStep('plan');
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  const handleCheckVerification = async () => {
    if (!userId) {
      toast.error("No user found. Please try registering again.");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification check failed');
      }
      
      if (data.emailVerified || data.verified) {
        toast.success("Email verified successfully! 🎉");
        setStep('plan');
      } else {
        toast.error("Email not verified yet. Please check your inbox and click the verification link first.");
      }
    } catch (error: any) {
      console.error("Verification check error:", error);
      toast.error(error.message || "Failed to check verification status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async () => {
    if (!userId) {
      toast.error("User session not found. Please try again.");
      return;
    }

    if (selectedPackage.isFree) {
      handleFreePlan();
      return;
    }

    setLoading(true);

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        email: email,
        amount: selectedPackage.price * 100,
        currency: "NGN",
        metadata: {
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: userId },
            { display_name: "Package", variable_name: "package", value: selectedPackage.id },
          ],
        },
         
        onSuccess: async (transaction: any) => {
          try {
            toast.loading("Confirming payment...");

            const response = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: transaction.reference,
                userId: userId,
                packageId: selectedPackage.id,
                credits: selectedPackage.credits,
                bonusCredits: selectedPackage.bonus,
                amount: selectedPackage.price,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Verification failed");
            }

           
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
            }

            toast.success(`Welcome! ${data.creditsAdded || (selectedPackage.credits + selectedPackage.bonus)} credits added to your account! 🎉`);
            
           
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);

          } catch (error: any) {
            console.error("Credit update error:", error);
            toast.error(
              error.message ||
              "Payment successful but credits failed to update. Please contact support with reference: " +
              transaction.reference
            );
            setLoading(false);
          }
        },

        onCancel: () => {
          setLoading(false);
          toast.error("Transaction cancelled.");
        },
      });

    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Error initializing payment. Please try again.");
      setLoading(false);
    }
  };

  const handleFreePlan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Failed to log in. Please try logging in manually.");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-5xl w-full">
        
        {/* Progress Bar */}
        <div className="flex justify-center mb-8 gap-4">
          <div className={`h-2 w-12 rounded-full transition-colors ${step === 'register' ? 'bg-emerald-600' : 'bg-emerald-200'}`}></div>
          <div className={`h-2 w-12 rounded-full transition-colors ${step === 'specialization' ? 'bg-emerald-600' : (step === 'verify' || step === 'plan') ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
          <div className={`h-2 w-12 rounded-full transition-colors ${step === 'verify' ? 'bg-emerald-600' : step === 'plan' ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
          <div className={`h-2 w-12 rounded-full transition-colors ${step === 'plan' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
        </div>

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'register' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Create your Account</h2>
              <p className="text-slate-500 text-sm">Join thousands of students acing their exams.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCategoryNext(); }} className="space-y-5">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    placeholder="Chinedu Okeke"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    placeholder="student@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" required 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Exam Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What type of exam are you preparing for? <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXAM_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isSelected = examCategory === category.id;
                        const isDisabled = category.comingSoon;

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => !isDisabled && setExamCategory(category.id)}
                            disabled={isDisabled}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all text-left overflow-hidden
                              ${isDisabled
                                ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50'
                                : isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                              }
                            `}
                          >
                          
                            {isDisabled && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                  COMING SOON
                                </span>
                              </div>
                            )}

                            <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center mb-3 ${isDisabled ? 'opacity-50' : ''}`}>
                              <Icon size={20} />
                            </div>
                            <h4 className={`font-bold text-slate-900 text-sm mb-1 ${isDisabled ? 'opacity-70' : ''}`}>
                              {category.label}
                            </h4>
                            <p className={`text-xs text-slate-500 leading-relaxed ${isDisabled ? 'opacity-70' : ''}`}>
                              {category.description}
                            </p>

                            <div className="flex flex-wrap gap-1 mt-3">
                              {category.exams.slice(0, 2).map((exam, idx) => (
                                <span key={idx} className={`text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ${isDisabled ? 'opacity-50' : ''}`}>
                                  {exam}
                                </span>
                              ))}
                            </div>

                            {isSelected && !isDisabled && (
                              <div className="mt-3 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                <CheckCircle size={14} /> Selected
                              </div>
                            )}
                          </button>
                        );
                      })}
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center shadow-lg shadow-emerald-200 disabled:bg-emerald-400"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Continue to Next Step"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account? <Link href="/login" className="text-emerald-600 font-bold hover:underline">Log in</Link>
            </p>
          </div>
        )}

        {/* STEP 2: SPECIALIZATION */}
        {step === 'specialization' && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Choose Your Specialization</h2>
              <p className="text-slate-500 text-sm">Select your subject area to get personalized content</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {SPECIALIZATIONS.map((spec) => {
                const Icon = spec.icon;
                const isSelected = specialization === spec.id;
                
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setSpecialization(spec.id)}
                    className={`
                      p-6 rounded-2xl border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-50 shadow-xl scale-105' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }
                    `}
                  >
                    <div className={`w-12 h-12 rounded-xl ${spec.color} flex items-center justify-center mb-4`}>
                      <Icon size={24} />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">{spec.label}</h4>
                    <p className="text-sm text-slate-500 mb-3">{spec.description}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {spec.subjects.slice(0, 4).map((subject, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {subject}
                        </span>
                      ))}
                      {spec.subjects.length > 4 && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          +{spec.subjects.length - 4} more
                        </span>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="mt-4 flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle size={16} /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('register')}
                className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => handleRegister()}
                disabled={loading || !specialization}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center shadow-lg shadow-emerald-200"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Create Account & Verify Email"}
              </button>
            </div>
          </div>
        )}

       {/* STEP 3: OTP VERIFICATION */}
{step === 'verify' && (
  <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-right-4">
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield className="text-emerald-600" size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Enter Verification Code</h2>
      <p className="text-slate-500 text-sm">
        We've sent a 6-digit code to <strong className="text-slate-900">{email}</strong>
      </p>
    </div>

    <div className="space-y-6">
      <div>
        <input 
          type="text"
          maxLength={6}
          placeholder="0 0 0 0 0 0"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full text-center text-3xl font-bold tracking-[1rem] py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition"
        />
      </div>

      <button
        onClick={handleVerifyOTP}
        disabled={loading || otp.length < 4}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
      </button>

      <button
        onClick={handleResendVerification}
        disabled={resendingEmail}
        className="w-full text-emerald-600 font-medium py-2 hover:underline flex items-center justify-center gap-2"
      >
        {resendingEmail ? <Loader2 className="animate-spin" size={16} /> : "Didn't get a code? Resend OTP"}
      </button>
    </div>
  </div>
)}

       {/* STEP 4: CREDIT PACKAGE SELECTION */}
{step === 'plan' && (
  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
    <div className="text-center mb-10">
      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
        <Star size={16} fill="currentColor" /> Email Verified Successfully!
      </div>
      <h2 className="text-3xl font-bold text-slate-900">Choose a Starting Credit Pack</h2>
      <p className="text-slate-500">Credits are used to take exams. Select a pack to get started.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {STARTER_CREDIT_PACKAGES.map((pkg) => (
        <button
          key={pkg.id}
          onClick={() => setSelectedPackage(pkg)}
          className={`
            relative p-6 rounded-3xl border-2 transition-all text-left flex flex-col h-full
            ${selectedPackage.id === pkg.id 
              ? 'border-emerald-500 bg-white shadow-xl scale-105 ring-4 ring-emerald-50' 
              : 'border-slate-200 bg-white/50 hover:border-slate-300'}
          `}
        >
          {pkg.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Recommended
            </span>
          )}

          <div className="mb-4">
            <h4 className="font-bold text-slate-900 text-lg">{pkg.name}</h4>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-slate-900">
                {pkg.isFree ? "Free" : `₦${pkg.price.toLocaleString()}`}
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-8 flex-grow">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Coins size={16} className="text-emerald-500" />
              <span className="font-bold text-slate-900">{pkg.credits} Credits</span>
            </div>
            {pkg.bonus > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                <Zap size={16} />
                <span>+{pkg.bonus} Bonus Credits</span>
              </div>
            )}
            <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
          </div>

          <div className={`
            w-full py-3 rounded-xl font-bold text-center transition-colors
            ${selectedPackage.id === pkg.id 
              ? 'bg-emerald-600 text-white' 
              : 'bg-slate-100 text-slate-600'}
          `}>
            {selectedPackage.id === pkg.id ? 'Selected' : 'Choose Plan'}
          </div>
        </button>
      ))}
    </div>

    <div className="max-w-md mx-auto">
      <button
        onClick={handlePurchaseCredits}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 disabled:bg-emerald-400 text-lg"
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : selectedPackage.isFree ? (
          "Go to Dashboard"
        ) : (
          <>
            <Shield size={20} />
            Pay ₦{selectedPackage.price.toLocaleString()} & Get Credits
          </>
        )}
      </button>
      <p className="text-center text-slate-400 text-xs mt-4">
        Secure payment powered by Paystack. Credits are added instantly.
      </p>
    </div>
  </div>
)}

      </div>
    </div>
  );
}