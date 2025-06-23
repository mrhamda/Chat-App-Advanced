"use cliet";

import React, { useEffect, useState } from "react";

import { getDatabase, ref, onValue } from "firebase/database";
import { setData } from "../firebase/config";

type AddUserType = {
  ID: string;
  name: string;
  imgUrl: string;
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

export function AddUser({ ID, name, imgUrl, orginalUserID }: AddUserType) {
  const [alldata, setAllData] = useState<DataType | undefined>();
  const [didISend, setdidISend] = useState<boolean>(false);
  const [areTheyFriend, setAreTheyFriend] = useState<boolean>(false);

  const [alldataOrginalUser, setAllDataOrginalUser] = useState<
    DataType | undefined
  >();

  const [didTheySend, setdidTheySend] = useState<boolean>(false);

  function handleAdd() {
    if (!alldata?.friendRequests.includes(orginalUserID)) {
      const newFriendsRequests = [...alldata!.friendRequests, orginalUserID];

      setData(`/users/${ID}`, {
        ...alldata,
        friendRequests: newFriendsRequests,
      });

      setdidISend(true);
    }
  }

  function handleCancel() {
    const friendRequests = alldata?.friendRequests || [];

    const filteredFriendsRequests = friendRequests.filter(
      (req) => req !== orginalUserID
    );

    setData(`/users/${ID}`, {
      ...alldata,
      friendRequests: filteredFriendsRequests,
    });

    setdidISend(false);
  }

  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${ID}`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        const usersData = snapshot.val();
        setAllData(usersData);
        setdidISend(usersData.friendRequests?.includes(orginalUserID));
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe();
  }, [ID, orginalUserID]);

  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${orginalUserID}`);
    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        const usersData = snapshot.val();
        setAreTheyFriend(usersData.friends?.includes(ID));

        setdidTheySend(usersData.friendRequests?.includes(ID));

        setAllDataOrginalUser(usersData);
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe();
  }, [ID, orginalUserID]);

  function Decline() {
    const newOrginalUserFriendRequests =
      alldataOrginalUser?.friendRequests.filter((req, index) => {
        return (index === 0 && req === "") || req !== ID;

      });

    setData(`/users/${orginalUserID}`, {
      ...alldataOrginalUser,
      friendRequests: newOrginalUserFriendRequests,
    });

    setdidTheySend(false);
  }

  function Accept() {
    const newOrginalUserFriendRequests =
      alldataOrginalUser?.friendRequests.filter((req, index) => {
        return (index === 0 && req === "") || req !== ID;

      });
    const friends = [...alldataOrginalUser!.friends, ID];
    const friendsSender = [...alldata!.friends, orginalUserID];

    setData(`/users/${orginalUserID}`, {
      ...alldataOrginalUser,
      friendRequests: newOrginalUserFriendRequests,
      friends: friends,
    });

    setData(`/users/${ID}`, {
      ...alldata,
      friends: friendsSender,
    });

    setdidTheySend(true);
  }

  return (
    <div className="flex justify-center items-center mb-8 max-w-full overflow-hidden">
      <div className="mr-2">
        <img
          className="w-12 h-12 rounded-full border border-gray-100 shadow-sm"
          src={imgUrl}
          alt="user image"
        />
      </div>
      <div className="w-4/5">
        <div>
          <span className="font-semibold text-gray-800">{name}</span>
          <span> </span>
          <span style={{ fontSize: "15px", wordBreak: "break-all" }}>{ID}</span>
        </div>
        <div className="font-semibold">
          {!didISend && !areTheyFriend && !didTheySend && (
            <div>
              <a
                className="text-blue-600 mr-2 cursor-pointer hover:text-blue-700"
                onClick={handleAdd}
              >
                Add
              </a>
            </div>
          )}
          {didISend && !areTheyFriend && !didTheySend && (
            <div>
              <a
                className="text-gray-400 mr-2 cursor-pointer hover:text-gray-500"
                onClick={handleCancel}
              >
                Cancel
              </a>
            </div>
          )}
        </div>
        {didTheySend && !areTheyFriend && (
          <div className="font-semibold">
            <div>
              <a
                className="text-blue-600 mr-2 cursor-pointer hover:text-blue-700"
                onClick={() => Accept()}
              >
                Accept
              </a>

              <a
                className="text-gray-400 mr-2 cursor-pointer hover:text-gray-500"
                onClick={() => Decline()}
              >
                Decline
              </a>
            </div>
          </div>
        )}

        {areTheyFriend && (
          <div className="font-semibold">
            <div>
              <a className="text-blue-600 mr-2 cursor-pointer hover:text-blue-700 opacity-60 pointer-events-none">
                Friends
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
