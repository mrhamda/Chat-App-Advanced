import {
  faPhone,
  faPhoneSlash,
  faVolumeMute,
  faVolumeUp,
  faClose,
  faVolumeOff,
  faVolumeDown,
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DataType } from "./Friends";
import { useProjectContext } from "../context/projectContext";
import { getDatabase, ref, remove, set } from "firebase/database";
import { getDataPromise } from "../firebase/config";

type CallInterfaceProps = {
  status: string;
  disconnectFunction: () => void;
  friendUser: DataType;
  userData: DataType;
  peerList: any[];
  makeCallBtnPressed: () => void;
  toggleMuteFunc: (b: boolean) => void;
  toggleSpeakerphone: () => void
};

export function VoiceCalling({
  status,
  disconnectFunction,
  friendUser,
  userData,
  peerList,
  makeCallBtnPressed,
  toggleMuteFunc,
  toggleSpeakerphone
}: CallInterfaceProps): JSX.Element {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setSpeaker] = useState(false);

  const {
    voiceCallingsState,
    setVoiceCallingsState,
    miniScreenActive,
    setMiniScreenActive,
    setCurrentFriend,
    currentFriend,
  } = useProjectContext();

  let intervalID: NodeJS.Timeout;

  const toggleMute = () => {
    setIsMuted((prev) => {
      toggleMuteFunc(prev);
      return (prev = !prev);
    });
  };

  const [dataForCallingMe, setDataForCallingMe]: [
    DataType | undefined,
    Dispatch<SetStateAction<DataType | undefined>>
  ] = useState<DataType | undefined>(undefined);

  if (
    miniScreenActive === true &&
    userData !== null &&
    userData !== undefined
  ) {
    setAndGetDataForCallingMe();
  }

  async function setAndGetDataForCallingMe() {
    const dataPath = `voice/${userData.custom_ID}`;
    const theData = await getDataPromise(dataPath);

    try {
      setDataForCallingMe(theData[0]);
    } catch (e) {
      console.log(e);
    }
  }

  async function answerCall() {
    setVoiceCallingsState("");
    const db = getDatabase();
    const roomKey = `voice/${dataForCallingMe!.custom_ID}`;
    const roomKey2 = `voice/${userData.custom_ID}`;
    const answersKey = `voice/answers`;

    const pathForOther = `taken/${dataForCallingMe!.custom_ID}`;

    const takenDataHim = await getDataPromise(pathForOther);

    try {
      if (takenDataHim === userData.custom_ID) {
        await set(ref(db, `${answersKey}/${userData.custom_ID}`), true);
        console.log("Answering the call from friend.");
        console.log("ANSWERING CALL");

        // Remove the call data from the database
        await remove(ref(db, roomKey2));
        await remove(ref(db, roomKey));
        setVoiceCallingsState("connected");
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }
  function toggleSpeaker(): void {
    setSpeaker(prev => {
      toggleSpeakerphone()
      return prev = !prev
    })
  }
  // TOGGLE SPEAKER NOT WORKING YET!

  return (
    <div className="z-50 fixed inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 flex flex-col justify-center items-center animate-fadeIn">
      {/* Mini UI */}
      {miniScreenActive &&
        dataForCallingMe !== null &&
        dataForCallingMe !== undefined && (
          <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-purple-700 via-blue-600 to-indigo-700 flex items-center justify-between px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-4">
              <img
                src={dataForCallingMe.imgUrl}
                alt="User profile"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <p className="text-white font-semibold">
                {dataForCallingMe.userName}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                className="w-8 h-8 rounded-full bg-green-500 flex justify-center items-center shadow-md hover:bg-green-600 transition duration-200"
                onClick={async () => {
                  const db = getDatabase();
                  const roomKeyOneDisconnects = `disconnect/${currentFriend}`;

                  const path = `voice/${currentFriend}`;

                  const data: DataType[] = await getDataPromise(path);

                  console.log("THE DATA", data);

                  const filteredData = data?.filter((user: DataType) => {
                    if (user.custom_ID !== userData.custom_ID) {
                      return user;
                    }
                  });

                  console.log("THE DATA", filteredData);

                  if (filteredData === null || filteredData === undefined) {
                    await remove(ref(db, path));
                    console.log("Removing Data");
                  }

                  if (filteredData !== null || filteredData !== undefined) {
                    console.log("Setting Data");

                    await set(ref(db, path), filteredData);
                  }

                  await set(ref(db, roomKeyOneDisconnects), true);

                  setCurrentFriend(dataForCallingMe.custom_ID);

                  await answerCall();
                }}
              >
                <FontAwesomeIcon
                  icon={faPhone}
                  className="text-white text-sm"
                />
              </button>
              <button
                className="w-8 h-8 rounded-full bg-red-500 flex justify-center items-center shadow-md hover:bg-red-600 transition duration-200"
                onClick={async () => {
                  const db = getDatabase();
                  const roomKeyOneDisconnects = `disconnect/${dataForCallingMe.custom_ID}`;
                  const roomKey = `voice/${userData?.custom_ID}/0`;

                  console.log("CANCLEDD");
                  await set(ref(db, roomKeyOneDisconnects), true);
                  await remove(ref(db, `${roomKey}`));
                }}
              >
                <FontAwesomeIcon
                  icon={faClose}
                  className="text-white text-sm"
                />
              </button>
            </div>
          </div>
        )}

      {/* Main UI */}
      {status === "called" && (
        <>
          <div className="text-center mb-8">
            <p className="text-2xl font-semibold text-white">Incoming Call</p>
            <p className="text-lg text-gray-200">{friendUser.userName}</p>
          </div>
          <div className="mb-8">
            <img
              src={friendUser.imgUrl}
              alt="User profile"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          <div className="flex space-x-8">
            <button
              className="w-16 h-16 rounded-full bg-green-500 flex justify-center items-center shadow-lg hover:bg-green-600 transition duration-200"
              onClick={async () => {
                const db = getDatabase();
                makeCallBtnPressed();
              }}
            >
              <FontAwesomeIcon icon={faPhone} className="text-white text-xl" />
            </button>
            <button
              className="w-16 h-16 rounded-full bg-red-500 flex justify-center items-center shadow-lg hover:bg-red-600 transition duration-200"
              onClick={async () => {
                const db = getDatabase();
                const roomKeyOneDisconnects = `disconnect/${
                  userData!.custom_ID
                }`;
                await set(ref(db, roomKeyOneDisconnects), true);
                setVoiceCallingsState("closed");
              }}
            >
              <FontAwesomeIcon
                icon={faPhoneSlash}
                className="text-white text-xl"
              />
            </button>
          </div>
        </>
      )}

      {status === "closed" && (
        <>
          <div className="text-center mb-8">
            <p className="text-2xl font-semibold text-white">Call ended with</p>
            <p className="text-lg text-gray-200">{friendUser.userName}</p>
          </div>
          <div className="mb-8">
            <img
              src={friendUser.imgUrl}
              alt="User profile"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          <div className="flex space-x-8">
            <button
              className="w-16 h-16 rounded-full bg-red-500 flex justify-center items-center shadow-lg hover:bg-red-600 transition duration-200"
              onClick={async () => {
                setVoiceCallingsState("");
              }}
            >
              <FontAwesomeIcon icon={faClose} className="text-white text-xl" />
            </button>
          </div>
        </>
      )}

      {status === "calling" && (
        <>
          <div className="text-center mb-8">
            <p className="text-2xl font-semibold text-white">Calling</p>
            <p className="text-lg text-gray-200">{friendUser.userName}</p>
          </div>
          <div className="mb-8">
            <img
              src={friendUser.imgUrl}
              alt="User profile"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          <div className="flex space-x-8">
            <button
              className="w-16 h-16 rounded-full bg-red-500 flex justify-center items-center shadow-lg hover:bg-red-600 transition duration-200"
              onClick={async () => {
                disconnectFunction();
                const roomKeyOneDisconnects = `disconnect/${
                  userData!.custom_ID
                }`;
                const db = getDatabase();

                await set(ref(db, roomKeyOneDisconnects), true);

                await set(
                  ref(db, `disconnectCalling/${userData.custom_ID}`),
                  true
                );

                setVoiceCallingsState("closed");
              }}
            >
              <FontAwesomeIcon
                icon={faPhoneSlash}
                className="text-white text-xl"
              />
            </button>
          </div>
        </>
      )}

      {status === "connected" && (
        <>
          <div className="text-center mb-8">
            <p className="text-2xl font-semibold text-white">Connected With</p>
            <p className="text-lg text-gray-200">{friendUser.userName}</p>
          </div>
          <div className="mb-8">
            <img
              src={friendUser.imgUrl}
              alt="User profile"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg inline mr-4"
            />
            <img
              src={userData.imgUrl}
              alt="User profile"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg inline"
            />
          </div>
          <div className="flex space-x-8">
            <button
              className="w-16 h-16 rounded-full bg-red-500 flex justify-center items-center shadow-lg hover:bg-red-600 transition duration-200"
              onClick={async () => {
                disconnectFunction();
                setVoiceCallingsState("closed");
                const db = getDatabase();
                const roomKeyOneDisconnects = `disconnect/${
                  userData!.custom_ID
                }`;
                await set(ref(db, roomKeyOneDisconnects), true);
              }}
            >
              <FontAwesomeIcon
                icon={faPhoneSlash}
                className="text-white text-xl"
              />
            </button>
            <button
              className="w-16 h-16 rounded-full bg-green-500 flex justify-center items-center shadow-lg hover:bg-green-600  transition duration-200"
              onClick={toggleMute}
            >
              <FontAwesomeIcon
                icon={isMuted ? faMicrophoneSlash : faMicrophone}
                className="text-white text-xl"
              />
            </button>

            <button
              className="w-16 h-16 rounded-full bg-blue-500 flex justify-center items-center shadow-lg hover:bg-blue-600 transition duration-200"
              onClick={toggleSpeaker}
            >
              <FontAwesomeIcon
                icon={isSpeakerOn ? faVolumeUp : faVolumeDown}
                className="text-white text-xl"
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
