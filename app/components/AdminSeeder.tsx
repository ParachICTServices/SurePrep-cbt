"use client";
import { useState } from "react";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { toast } from "sonner";

const dummyQuestions = [
  {
    subject: "english",
    questionText: "Which of the following is the correct spelling?",
    options: ["Accomodation", "Accommodation", "Acommodation", "Accommodattion"],
    correctOption: 1,
    explanation: "Accommodation has two 'c's and two 'm's."
  },
  {
    subject: "english",
    questionText: "Choose the option nearest in meaning to: 'The man is stingy.'",
    options: ["Generous", "Miserly", "Kind", "Poor"],
    correctOption: 1,
    explanation: "Miserly means unwilling to spend money, same as stingy."
  },
  {
    subject: "maths",
    questionText: "Solve for x: 2x + 5 = 15",
    options: ["5", "10", "2.5", "7"],
    correctOption: 0,
    explanation: "2x = 10, so x = 5."
  },
  {
    subject: "maths",
    questionText: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctOption: 2,
    explanation: "12 * 12 = 144."
  }
];

export default function AdminSeeder() {
  const [loading, setLoading] = useState(false);

  const seedData = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      dummyQuestions.forEach((q) => {
        const docRef = doc(collection(db, "questions")); // Auto-ID
        batch.set(docRef, q);
      });

      await batch.commit();
      toast.success("Success! Added dummy questions to database.");
    } catch (e) {
      console.error(e);
      toast.error("Error adding questions. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={seedData} 
      disabled={loading}
      className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg z-50 text-xs font-bold"
    >
      {loading ? "Seeding..." : "ADMIN: Seed DB"}
    </button>
  );
}