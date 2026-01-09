"use client";

import React, { useEffect, useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, setData } from "@/app/firebase/config";
import { useRouter } from "next/navigation";

export function Signup() {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [userName, setUserName] = useState<string>();
  const [error, setError] = useState<string>(""); 
  const [imageUrl, setImageUrl] = useState<string>();
  const router = useRouter();

  const [createUserWithEmailAndPassword, user, loading, authError] =
    useCreateUserWithEmailAndPassword(auth);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        console.log("File uploaded:", data);
        setImageUrl(data.filePath);
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    }
  };

  const handleImageClick = () => {
    document.getElementById("fileInput")!.click();
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (!email || !password || !userName || !imageUrl) {
      console.error("Please fill all fields.");
      setError("Please fill all fields including the picture");
      return;
    }


    try {
      const res = await createUserWithEmailAndPassword(email!, password!);

      if (res?.user) {
        setData(`/users/${res.user.uid}`, {
          imgUrl: imageUrl,
          userName: userName,
          gmail: email,
          custom_ID: res.user.uid,
          friends: [""],
          friendRequests: [""],
          state: "offline"
        });
        localStorage.setItem("user", "true");

        router.push("/login");
      }else {
        setError(
          "Email already in use"
        );      }
    } catch (err) {
     
      console.log("ERROR:");

    }
  };

  useEffect(() => {
    if (user) {
      console.log("User created:", user);
      router.push("/login");
    }
  }, [user]);

  return (
    <div className="bg-gray-100 flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex justify-center mb-6">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Selected"
              className="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-65"
              onClick={handleImageClick}
            />
          ) : (
            <span
              className="inline-block bg-gray-200 rounded-full p-3 cursor-pointer"
              onClick={handleImageClick}
            >
              <svg
                className="hover:opacity-65"
                xmlns="http://www.w3.org/2000/svg"
                width="72"
                height="72"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"
                />
              </svg>
            </span>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            style={{ display: "none" }} 
            onChange={handleFileChange}
          />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4">
          Create a new account
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your details to register.
        </p>
        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="mb-4">
            <label
              htmlFor="fullName"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Username *
            </label>

            <input
              type="text"
              id="fullName"
              className="form-input w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-blue-500"
              required
              placeholder="James Brown"
              maxLength={30}
              pattern="[^ ]*"
              onChange={(e) => setUserName(e.target.value)}
            />
            <p className="text-gray-600 text-xs mt-1">
              No empty spaces is allowed!
            </p>
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              className="form-input w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-blue-500"
              required
              placeholder="hello@alignui.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              className="form-input w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-blue-500"
              required
              placeholder="••••••••"
              pattern="^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$"
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-gray-600 text-xs mt-1">
              Must contain 1 uppercase letter, 1 digit, min. 8 characters.
            </p>
            <a
              href="./login"
              className="text-xs text-indigo-500 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </a>
          </div>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
