"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { setData } from "../firebase/config";
import { Alert } from "./Alert";
import { useProjectContext } from "../context/projectContext";

type NavbarType = {
  userID: string;
};

type DataType = {
  imgUrl: string;
  userName: string;
  gmail: string;
  custom_ID: string;
  friends: string[];
  friendRequests: string[];
  state: string
};

export default function Settings({ userID }: NavbarType) {
  const [username, setUsername] = useState<string>();
  const [data, setUserData] = useState<DataType | undefined>();
  const [imageUrl, setImageUrl] = useState<string>();
  const { alert, setAlert } = useProjectContext();
  useEffect(() => {
    setUsername(data?.userName);
  }, []);
  function handleCopy(data: DataType) {
    navigator.clipboard
      .writeText(data?.custom_ID || "")
      .then(() => {
        setAlert({
          text: "Successfully copied userID",
          color: "green",
          err: false,
        });
      })
      .catch((err) => {
        console.error("Failed to cospy: ", err);
        setAlert({
          text: "An error occured while trying to copy User ID",
          color: "red",
          err: true,
        });
      });
  }

  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${userID}`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        setUserData(snapshot.val());
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe(); //
  }, []);

  function handleOnSubmit(e: FormEvent) {
    e.preventDefault();
    console.log(username);
    try {
      if (
        username &&
        username.trim() !== "" &&
        data?.userName &&
        data?.userName.trim() !== ""
      ) {
        setData(`/users/${data?.custom_ID}`, {
          imgUrl: imageUrl || data?.imgUrl,
          userName: username || data?.userName,
          gmail: data?.gmail,
          custom_ID: data?.custom_ID,
          friends: data.friends,
          friendRequests: data.friendRequests,
        });
        setAlert({
          text: "Data changed successfully",
          color: "green",
          err: false,
        });
      } else {
        setAlert({
          text: "You can't write empty username try again",
          color: "red",
          err: true,
        });
      }
    } catch (e) {
      console.error(e);
      setAlert({ text: "An error occured", color: "red", err: true });
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      // Send the file to the server
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

  return (
    <div>
      {alert.text && <Alert text={alert.text} color={alert.color} />}

      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md">
        <form onSubmit={(e) => handleOnSubmit(e)}>
          <div className="mb-4 ">
            <div>
              <label
                htmlFor="user"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="user"
                className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="username..."
                required
                maxLength={30}
                pattern="[^ ]*"
                defaultValue={data?.userName || ""}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-gray-600 text-xs mt-1">
                No empty spaces is allowed!
              </p>
            </div>
            <div className="mt-5">
              <label
                htmlFor="userID"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                User ID
              </label>
              <input
                type="text"
                id="userID"
                className="shadow-sm rounded-md w-auto px-3 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 opacity-65"
                placeholder="username..."
                required
                value={data?.custom_ID || ""}
                disabled
                size={data?.custom_ID ? data.custom_ID.length + 1 : 10}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div
                className="inline ml-5 cursor-pointer hover:opacity-45"
                onClick={() => handleCopy(data!)}
              >
                <FontAwesomeIcon icon={faCopy} />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="user"
                className="block text-sm font-medium text-gray-600 mb-2 text-center"
              >
                Profile Image
              </label>
              <div className="flex w-full justify-center">
                <img
                  src={imageUrl || data?.imgUrl}
                  alt="Selected"
                  className="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-65"
                  onClick={handleImageClick}
                />
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  style={{ display: "none" }} // Hide the file input
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 flex justify-center w-full"
          >
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}
