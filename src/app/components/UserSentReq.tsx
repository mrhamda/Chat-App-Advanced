import React, { useEffect, useState } from "react";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { setData } from "../firebase/config";

type UserSentReqType = {
  thisUserID: string;
  orginalUserID: string;
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

export default function UserSentReq({
  thisUserID,
  orginalUserID,
}: UserSentReqType) {
  const [allData, setAllData] = useState<DataType | undefined>();
  const [orginalData, setOrginalData] = useState<DataType | undefined>();

  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${thisUserID}`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        setAllData(snapshot.val());
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe(); //
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${orginalUserID}`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        setOrginalData(snapshot.val());
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe(); //
  }, []);

  function Decline() {
    const newOrginalUserFriendRequests = orginalData?.friendRequests.filter(
      (req, index) => {
        return (index === 0 && req === "") || (req !== thisUserID);
    }
    );

    setData(`/users/${orginalUserID}`, {
      ...orginalData,
      friendRequests: newOrginalUserFriendRequests,
    });
  }

  function Accept() {
    const newOrginalUserFriendRequests = orginalData?.friendRequests.filter(
      (req, index) => {
        return (index === 0 && req === "") || (req !== thisUserID);

      }
    );
    const friends = [...orginalData!.friends, thisUserID];
    const friendsSender = [...allData!.friends, orginalUserID];

    setData(`/users/${orginalUserID}`, {
      ...orginalData,
      friendRequests: newOrginalUserFriendRequests,
      friends: friends,
    });

    setData(`/users/${thisUserID}`, {
      ...allData,
      friends: friendsSender,
    });
  }

  return (
    <div className="flex justify-center items-center mb-8">
      <div className="w-1/5">
        <img
          className="w-12 h-12 rounded-full border border-gray-100 shadow-sm"
          src={allData?.imgUrl}
          alt="user image"
        />
      </div>
      <div className="w-4/5">
        <div>
          <span className="font-semibold text-gray-800">
            {allData?.userName}
          </span>
          <span> </span>
          <p style={{wordBreak: "break-all"}}>{thisUserID}</p>
        </div>
        <div className="font-semibold">
          <a onClick={() => Accept()} className="text-blue-600 mr-2 cursor-pointer hover:text-blue-700">
            Accept
          </a>
          <a onClick={() => Decline()} className="text-gray-400 cursor-pointer">
            Decline
          </a>
        </div>
      </div>
    </div>
  );
}
