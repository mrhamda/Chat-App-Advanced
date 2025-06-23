"use client";

import React, { useState } from "react";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, setData } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import Settings from "./Settings";
import { useProjectContext } from "../context/projectContext";
import { Friends } from "./Friends";
import { AddFriends } from "./AddFriends";
import Groups from "./Groups";
import {
  getDatabase,
  ref,
  onDisconnect,
  set,
  onValue,
  update,
} from "firebase/database";
import firebase from "firebase/compat/app";

export function Home() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const userSession = localStorage.getItem("user");
  const { currentComponent } = useProjectContext();



  useEffect(() => {
    if (!user && userSession !== "true") {
      router.push("/login");
    }
  }, [user, userSession, router]);

  if (!user) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <Navbar
        LogoutFunction={() => {
          signOut(auth);
          localStorage.removeItem("user");
        }}
        userID={user.uid}
      />
      <div className="bg-gray-100 flex items-center justify-center h-screen">
        {/* {currentComponent === "settings" && <Settings userID={user.uid} />}

        {currentComponent === "friendslist" && <Friends />}

        {currentComponent === "explore" && <AddFriends />}

        {currentComponent === "groups" && <Groups />} */}
        <Friends userID={user.uid} />
        {/* {currentComponent === "explore" && <AddFriends userID={user.uid} />} */}
      </div>
    </>
  );
}
