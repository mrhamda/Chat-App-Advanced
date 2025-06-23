"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Collapse, Dropdown, initTWE } from "tw-elements";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX, faCheck, faBell } from "@fortawesome/free-solid-svg-icons";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { useProjectContext } from "../context/projectContext";
import "flowbite";
import { initFlowbite } from "flowbite";
import UserSentReq from "./UserSentReq";

type NavbarType = {
  LogoutFunction: () => void;
  userID: string;
};

type DataType = {
  imgUrl: string;
  userName: string;
  gmail: string;
  custom_ID: string;
  friends: string[];
  friendRequests: string[];
  state: string;
};
export function Navbar({ LogoutFunction, userID }: NavbarType) {
  const [data, setData] = useState<DataType | undefined>();
  const enableProfileNabarRef = useRef<HTMLButtonElement>(null);
  const enableNormalNabarRef = useRef<HTMLButtonElement>(null);

  const [notifcationState, setNotficationState] = useState(false);
  const [isNoramlToggled, setIsNormalToggle] = useState(false);

  const { currentComponent, setCurrentComponent } = useProjectContext();

  function closeNavbarProfile() {
    enableProfileNabarRef.current?.click();
  }
  function closeNormalNabar() {
    enableNormalNabarRef.current?.click();
  }
  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${userID}`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        setData(snapshot.val());
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe(); //
  }, []);

  function handleClicking(e: React.MouseEvent<HTMLAnchorElement>) {
    const elementsWithBlue = document.querySelectorAll(".text-blue-700");
    elementsWithBlue.forEach((element) => {
      element.classList.remove("text-blue-700");
      element.classList.remove("pointer-events-none");
    });

    e.currentTarget.classList.add("text-blue-700");
    e.currentTarget.classList.add("pointer-events-none");
  }

  useEffect(() => {
    initFlowbite();
  });
  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900 fixed top-0 left-0 w-full z-50">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <div className="relative inline-block">
            <FontAwesomeIcon
              icon={faBell}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors duration-200 mr-2"
              onClick={() => {
                if (isNoramlToggled) {
                  closeNormalNabar();
                }
                setNotficationState((prev) => !prev);
              }}
            />

            {data?.friendRequests.filter((req) => req !== "").length !== 0 && (
              <div className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
                {data?.friendRequests.filter((req) => req !== "").length}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            id="user-menu-button"
            aria-expanded="false"
            data-dropdown-toggle="user-dropdown"
            data-dropdown-placement="bottom"
            ref={enableProfileNabarRef}
          >
            <span className="sr-only">Open user menu</span>
            <img
              className="w-8 h-8 rounded-full"
              src={data?.imgUrl}
              alt="user photo"
            />
          </button>

          <div
            className="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
            id="user-dropdown"
          >
            <div className="px-4 py-3">
              <span className="block text-sm text-gray-900 dark:text-white">
                {data?.userName}
              </span>
              <span className="block text-sm  text-gray-500 truncate dark:text-gray-400">
                {data?.gmail}
              </span>
            </div>
            <ul className="py-2" aria-labelledby="user-menu-button">
              <li>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white text-blue-700 pointer-events-none"
                  onClick={(e) => {
                    setCurrentComponent("settings");
                    closeNavbarProfile();
                    handleClicking(e);
                  }}
                >
                  Settings
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                  onClick={() => {
                    LogoutFunction();
                  }}
                >
                  Sign out
                </a>
              </li>
            </ul>
          </div>
          <button
            data-collapse-toggle="navbar-user"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 relative"
            aria-controls="navbar-user"
            aria-expanded="false"
            ref={enableNormalNabarRef}
            onClick={() => {
              setNotficationState(false);
              setIsNormalToggle((prev) => !prev);
            }}
          >
            <span className="sr-only">Open main menu</span>

            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                onClick={(e) => {
                  setCurrentComponent("friendslist");
                  handleClicking(e);
                  closeNormalNabar();
                }}
              >
                Friendslist
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                onClick={(e) => {
                  setCurrentComponent("groups");
                  handleClicking(e);
                  closeNormalNabar();
                }}
              >
                Groups
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                onClick={(e) => {
                  setCurrentComponent("explore");
                  handleClicking(e);
                  closeNormalNabar();
                }}
              >
                Explore
              </a>
            </li>
          </ul>
        </div>
      </div>

      {notifcationState && (
        <div className="bg-white rounded-lg shadow-xl border p-8 w-3xl max-h-96 overflow-y-auto">
          <div className="mb-4">
            <h1 className="font-semibold text-gray-800">Friend Requests</h1>
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mt-16">
              {data?.friendRequests.filter((req) => req !== "").length}
            </div>
          </div>
          {data?.friendRequests
            .filter((req) => req !== "")
            .map((req) => (
              <div
                className="flex justify-between items-center mb-4 relative"
                key={req}
              >
                <UserSentReq thisUserID={req} orginalUserID={data.custom_ID} />
              </div>
            ))}
            
        </div>
      )}
    </nav>
  );
}
