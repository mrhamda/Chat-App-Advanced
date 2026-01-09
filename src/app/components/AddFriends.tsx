"use client";

import React, { useEffect, useRef, useState } from "react";
import { AddUser } from "./AddUser";
import { getDatabase, ref, onValue } from "firebase/database";
import { setData } from "../firebase/config";

export type DataType = {
  imgUrl: string;
  userName: string;
  gmail: string;
  custom_ID: string;
  friends: string[]
  friendRequests: string[]
  state: string
};

type AddFriendsType = {
  userID: string;
};
export function AddFriends({ userID }: AddFriendsType) {
  const [alldata, setAllData] = useState<DataType[] | undefined>();

  const [visibleData, setVisibleData] = useState<DataType[] | undefined>();
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        const usersData = snapshot.val();

        const usersArray = Object.keys(usersData)
          .filter((key) => key !== userID) 
          .map((key) => usersData[key]); 

        setAllData(usersArray);
        setVisibleData(usersArray);
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe(); //
  }, [userID]);

  function handleSearch() {
    const getInputVal = searchRef.current?.value;

    if (getInputVal) {
      const getFilteredData = alldata?.filter((user) => {
        return user.custom_ID.toLocaleUpperCase().includes(getInputVal.toLocaleUpperCase());
      });

      setVisibleData(getFilteredData);
    }
  }

  return (
    <div
      className="bg-white shadow-md rounded-lg px-8 py-6 "
      style={{ width: "800px" }}
    >
      <div className="flex rounded-md border-2 border-blue-500 overflow-hidden max-w-md mx-auto font-[sans-serif]">
        <input
          type="text"
          placeholder="Search by user ID"
          className="w-full outline-none bg-white text-gray-600 text-sm px-4 py-3 focus:border-black focus:bg-blue-100"
          ref={searchRef}
          onChange={(e) => {
            if (e.currentTarget.value === "") {
              setVisibleData(alldata);
            }
          }}
        />
        <button
          type="button"
          className="flex items-center justify-center bg-[#007bff] px-5"
          onClick={() => handleSearch()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 192.904 192.904"
            width="16px"
            className="fill-white"
          >
            <path d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z"></path>
          </svg>
        </button>
      </div>

      <div className="p-4">
        {visibleData?.map((userData) => (
          <AddUser
            imgUrl={userData.imgUrl}
            ID={userData.custom_ID}
            name={userData.userName}
            key={userData.custom_ID}
            orginalUserID={userID}
          />
        ))}
      </div>
    </div>
  );
}
