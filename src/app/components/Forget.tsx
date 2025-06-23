"use client";

import React, { FormEvent, useRef, useState } from "react";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";

export function Forget() {
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<boolean>();

  async function onSubmitForm(e: FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value;
    if (email?.trim()) {
      try {
        await sendPasswordResetEmail(auth, email);
        console.log("Password reset email sent successfully.");
        containerRef.current?.classList.add(
          "pointer-events-none",
          "opacity-55"
        );
        setSuccess(true);
      } catch (error) {
        setError("Error sending password reset email:");
      }
    } else {
      setError("Empty field");
    }
  }
  return (
    <div
      className="min-h-screen bg-gray-100 flex items-center justify-center w-full"
      ref={containerRef}
    >
      <div className="bg-white  shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-600">
          Fill to update password
        </h1>
        <form onSubmit={(e) => onSubmitForm(e)}>
          <div className="mb-4">
            <label
              htmlFor="gmail"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="gmail"
              className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your gmail"
              required
              ref={emailRef}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {success ? 'Sent' : 'Submit'}
          </button>
          {error && <p className="text-red-500">{error}</p>}{" "}
        </form>
      </div>
    </div>
  );
}
