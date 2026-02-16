"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, setDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, Zap, Shield, Star, Lock, GraduationCap, Briefcase, School, Coins, TrendingUp, Beaker, Palette, Calculator, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ExamCategory = "senior" | "junior" | "professional";
type Specialization = "sciences" | "arts" | "commercial" | "general";

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
    hasSpecialization: false
  },
  {
    id: "professional" as const,
    label: "Job Interview & Career",
    description: "Aptitude Tests, General Knowledge, Interview Prep",
    icon: Briefcase,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    exams: ["Job Aptitude", "Interview Prep", "General Knowledge"],
    hasSpecialization: false
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
    id: 'starter-free',
    name: 'Start Free',
    credits: 0,
    price: 0,
    bonus: 0,
    description: 'Get started with 0 credits. Purchase more anytime.',
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
  
  const [createdUser, setCreatedUser] = useState<any>(null);
  
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

 // Add this improved error handling to your existing registration file

// Replace the handleRegister function with this version:

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
    // 1. Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update profile
    await updateProfile(user, { displayName: name });

    // 3. Send verification email with improved error handling
    let emailSent = false;
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false,
      };
      
      await sendEmailVerification(user, actionCodeSettings);
      emailSent = true;
      toast.success("Verification email sent! Check your inbox.");
    } catch (emailError: any) {
      console.error("Email verification error:", emailError);
      
      // Log detailed error for debugging
      console.log("Error code:", emailError.code);
      console.log("Error message:", emailError.message);
      
      // Show specific error messages
      if (emailError.code === "auth/invalid-email") {
        toast.error("Invalid email address format");
      } else if (emailError.code === "auth/user-disabled") {
        toast.error("This account has been disabled");
      } else if (emailError.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please try again later.");
      } else {
        // Still create account but warn about email
        toast.warning("Account created but verification email failed. You can resend it from the next page.");
      }
    }

    // 4. Create user document
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: name,
      examCategory: examCategory as ExamCategory,
      specialization: specialization || 'general',
      subscriptionStatus: "free",
      credits: 0,
      totalCreditsEarned: 0,
      emailVerified: false,
      verificationEmailSent: emailSent, // Track if email was sent
      createdAt: new Date().toISOString(),
    });

    setCreatedUser(user);
    setLoading(false);
    setStep('verify');

  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Detailed error logging
    console.log("Error code:", error.code);
    console.log("Error message:", error.message);
    
    if (error.code === "auth/email-already-in-use") {
      toast.error("This email is already registered. Please log in.");
    } else if (error.code === "auth/weak-password") {
      toast.error("Password is too weak. Use at least 6 characters.");
    } else if (error.code === "auth/invalid-email") {
      toast.error("Invalid email address.");
    } else if (error.code === "auth/operation-not-allowed") {
      toast.error("Email/password sign-in is not enabled. Please contact support.");
    } else {
      toast.error("Registration failed: " + error.message);
    }
    setLoading(false);
  }
};

// Replace the handleResendVerification function with this version:

const handleResendVerification = async () => {
  if (!createdUser) {
    toast.error("No user found. Please try registering again.");
    return;
  }
  
  setResendingEmail(true);

  try {
    // Force reload user to get latest state
    await createdUser.reload();
    
    // Check if already verified
    if (createdUser.emailVerified) {
      toast.success("Email already verified!");
      await updateDoc(doc(db, "users", createdUser.uid), {
        emailVerified: true,
      });
      setStep('plan');
      setResendingEmail(false);
      return;
    }


    const actionCodeSettings = {
      url: `${window.location.origin}/dashboard`,
      handleCodeInApp: false,
    };
    

    await sendEmailVerification(createdUser, actionCodeSettings);

    await updateDoc(doc(db, "users", createdUser.uid), {
      lastVerificationEmailSent: new Date().toISOString(),
      verificationEmailResendCount: increment(1),
    });
    
    toast.success("Verification email sent! Check your inbox and spam folder.");
    
  } catch (error: any) {
    console.error("Resend error:", error);
    console.log("Error code:", error.code);
    console.log("Error message:", error.message);
    
    if (error.code === "auth/too-many-requests") {
      toast.error("Too many requests. Please wait 5 minutes before trying again.");
    } else if (error.code === "auth/invalid-action-code") {
      toast.error("Verification session expired. Please log in and request a new verification email.");
    } else if (error.code === "auth/user-disabled") {
      toast.error("This account has been disabled. Please contact support.");
    } else if (error.code === "auth/user-not-found") {
      toast.error("User not found. Please try registering again.");
    } else {
      toast.error("Failed to send email. Please check Firebase configuration or try again later.");
    }
  } finally {
    setResendingEmail(false);
  }
};



const handleCheckVerification = async () => {
  if (!createdUser) {
    toast.error("No user found. Please try registering again.");
    return;
  }
  
  setLoading(true);
  
  try {

    await createdUser.reload();
    
    if (createdUser.emailVerified) {
     
      await updateDoc(doc(db, "users", createdUser.uid), {
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
      });
      
      toast.success("Email verified successfully! 🎉");
      setStep('plan');
    } else {
      toast.error("Email not verified yet. Please check your inbox and click the verification link first.");
    }
  } catch (error: any) {
    console.error("Verification check error:", error);
    console.log("Error code:", error.code);
    
    if (error.code === "auth/user-token-expired") {
      toast.error("Session expired. Please log in and request a new verification email.");
    } else {
      toast.error("Failed to check verification status. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  const handlePurchaseCredits = async () => {
    if (!createdUser) return;
    
    if (selectedPackage.isFree) {
      handleFreePlan();
      return;
    }
    
    setLoading(true);

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();
      
      const totalCredits = selectedPackage.credits + selectedPackage.bonus;
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        email: createdUser.email,
        amount: selectedPackage.price * 100,
        currency: 'NGN',
        metadata: { 
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: createdUser.uid },
            { display_name: "Package", variable_name: "package", value: selectedPackage.id },
            { display_name: "Credits", variable_name: "credits", value: totalCredits.toString() },
            { display_name: "Type", variable_name: "type", value: "registration" }
          ]
        },
        onSuccess: async (transaction: any) => {
          try {
            await updateDoc(doc(db, "users", createdUser.uid), {
              credits: increment(totalCredits),
              totalCreditsEarned: increment(totalCredits),
            });

            await addDoc(collection(db, "creditTransactions"), {
              userId: createdUser.uid,
              packageId: selectedPackage.id,
              packageName: selectedPackage.name,
              creditsPurchased: selectedPackage.credits,
              bonusCredits: selectedPackage.bonus,
              totalCredits: totalCredits,
              amountPaid: selectedPackage.price,
              paymentRef: transaction.reference,
              date: serverTimestamp(),
              status: 'completed',
              type: 'registration'
            });
            
            toast.success(`Welcome! ${totalCredits} credits added to your account! 🎉`);
            window.location.href = "/dashboard"; 
            
          } catch (error) {
            console.error("Error updating credits:", error);
            toast.error("Payment successful but error updating credits. Please contact support.");
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
          toast.error("Transaction Cancelled.");
        }
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Error initializing payment. Please try again.");
      setLoading(false);
    }
  };

  const handleFreePlan = () => {
    router.push("/dashboard");
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
                    
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setExamCategory(category.id)}
                        className={`
                          p-4 rounded-xl border-2 transition-all text-left
                          ${isSelected 
                            ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                          }
                        `}
                      >
                        <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center mb-3`}>
                          <Icon size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{category.label}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{category.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {category.exams.slice(0, 2).map((exam, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {exam}
                            </span>
                          ))}
                        </div>
                        
                        {isSelected && (
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

        {/* STEP 2: SPECIALIZATION (Only for Senior Secondary) */}
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

        {/* STEP 3: EMAIL VERIFICATION */}
        {step === 'verify' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-blue-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
              <p className="text-slate-500 text-sm">
                We've sent a verification link to <strong className="text-slate-900">{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle size={20} />
                Please Check Your Email
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Open your email inbox (check spam folder if needed)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Click the "Verify Email" button in the email</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Come back here and click "I've Verified My Email"</span>
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckVerification}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    I've Verified My Email
                  </>
                )}
              </button>

              <button
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Resend Verification Email
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-center text-slate-500 mt-6">
              Didn't receive the email? Check your spam folder or click resend
            </p>
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