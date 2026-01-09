import React, { useEffect, useRef, useState } from "react";
import { getDatabase, ref, onValue, set, off, remove } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faEllipsisV,
  faMicrophone,
  faPaperclip,
  faPaperPlane,
  faStop,
  faTimes,
  faUser,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { setData, getData, getDataPromise } from "../firebase/config";
import ChatComponent from "./MessagePage";
import { useProjectContext } from "../context/projectContext";
import { v4 as uuidV4 } from "uuid";
import NavbarChat from "./NavbarChat";
import Peer from "peerjs";
import { VoiceCalling } from "./VoiceCalling";
import { cookies } from "next/headers";

export type DataType = {
  imgUrl: string;
  userName: string;
  gmail: string;
  custom_ID: string;
  friends: string[];
  friendRequests: string[];
  state: string;
};

type FriendsType = {
  userID: string;
};

export type MessageType = {
  messageID: string;
  sender: DataType;
  txt: string;
};

type NewOrNotType = {
  friendID: string;
  new: boolean;
};

type TakenDataItem = {
  [key: string]: string;
};

export function Friends({ userID }: FriendsType) {
  const [alldata, setAllData] = useState<DataType[] | undefined>();
  const [userData, setAllUserdata] = useState<DataType | undefined>();
  const [friendList, setFriendsList] = useState<DataType[] | undefined>([]);

  const [filtredValue, setFiltredValue] = useState<DataType[] | undefined>([]);

  const msgRef = useRef<HTMLDivElement>(null);
  const [sortValue, setSortValue] = useState<string>("");

  const { messages, setMessages, setMiniScreenActive, miniScreenActive } =
    useProjectContext();

  const [message, setMessage] = useState("");

  const [newOrNot, setNewOrNot] = useState<NewOrNotType[]>([]);

  let monitoringIntervalId: NodeJS.Timeout | null = null;

  let monitoringIntervalIdCallEnd: NodeJS.Timeout | null = null;

  let monitoringIntervalIdIncomingCall: NodeJS.Timeout | null = null;

  let monitoringIntervalIdNewOrNot: NodeJS.Timeout | null = null;

  const maxFileSizeMB = 100;

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const {
    voiceCallingsState,
    setVoiceCallingsState,
    currentFriend,
    setCurrentFriend,
  } = useProjectContext();

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const toggleMenu = (customID: string, event: React.MouseEvent) => {
    event.stopPropagation(); 

    setMenuOpen((prev) => (prev === customID ? null : customID));
  };

  useEffect(() => {
    const getAllFriendSquares = document.querySelectorAll(".friendSquare");
    getAllFriendSquares.forEach((item) => {
      const element = item as HTMLElement;

      element.classList.remove("bg-gray-100");

      if (element.dataset.id === currentFriend) {
        element.classList.add("bg-gray-100");
      }
    });
  }, [currentFriend]);

  useEffect(() => {
    const db = getDatabase();
    const disReference = ref(db, `/users/${userID}`);

    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        const usersData = snapshot.val();

        setAllUserdata(usersData);
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => unsubscribe();
  }, [userID]);

  useEffect(() => {
    if (!userData) return;
    const db = getDatabase();
    const disReference = ref(db, `/users`);

    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        const usersData: { [key: string]: DataType } = snapshot.val();

        if (usersData) {
          const usersArray: DataType[] = Object.keys(usersData)
            .filter((key) => key !== userID && userData?.friends.includes(key))
            .map((key) => usersData[key]);

          setAllData(usersArray);
          const newFriendsList: DataType[] = [];

          Object.values(usersData).forEach((user: DataType) => {
            user.friends.forEach((friendID) => {
              if (friendID !== user.custom_ID) {
                const friend = usersArray.find((u) => u.custom_ID === friendID);

                if (friend) {
                  if (
                    !newFriendsList.some(
                      (f) => f.custom_ID === friend.custom_ID
                    )
                  ) {
                    newFriendsList.push(friend);
                  }
                }
              }
            });
          });

          setFriendsList(newFriendsList);
          setFiltredValue(newFriendsList);
        }
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userID, userData]);
  function handleSendMessage() {
    if (message.trim() === "") return;

    setMessages((prev) => [
      ...prev,
      { txt: message, sender: userData!, messageID: uuidV4() },
    ]);

    scrollDown();
    setMessage("");
  }

  const debounce = (fn: (...args: any[]) => void, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const debouncedSetData = debounce((roomPath: string, data: any) => {
    const db = getDatabase();
    set(ref(db, roomPath), data);
    console.log(`Data updated in Firebase at ${roomPath}`, data);
  }, 50);

  useEffect(() => {
    if (!userData?.custom_ID || !currentFriend) return;

    const db = getDatabase();
    const roomKey = [currentFriend, userData.custom_ID].sort().join("");
    const disReference = ref(db, roomKey);

    const unsubscribe = onValue(
      disReference,
      (snapshot) => {
        const data = snapshot.val();
        if (snapshot.exists() && data?.messages) {
          setMessages((prevMessages) =>
            JSON.stringify(prevMessages) !== JSON.stringify(data.messages)
              ? data.messages
              : prevMessages
          );
        } else {
          console.log("Creating new data as no room exists.");
          debouncedSetData(roomKey, { messages });
        }
      },
      (error) => console.error("Error fetching data:", error)
    );

    return () => unsubscribe();
  }, [currentFriend, userData?.custom_ID]);

  useEffect(() => {
    if (!userData?.custom_ID || messages.length === 0) return;

    const db = getDatabase();
    const roomKey = [currentFriend, userData.custom_ID].sort().join("");

    debouncedSetData(roomKey, { messages });

    const friendUser = friendList!.find(
      (friend) => friend.custom_ID === currentFriend
    )!;

    const friendMessages = messages.filter(
      (message: MessageType) =>
        message.sender.custom_ID === friendUser.custom_ID
    );
    console.log(friendMessages);

    const lastMessage = friendMessages[friendMessages.length - 1];

    if (lastMessage !== null && lastMessage !== undefined) {
      set(ref(db, `lastmessages/${roomKey}/${userID}`), lastMessage);
    }
  }, [messages, currentFriend, userData?.custom_ID]);

  function handleUnfriendUser(friendID: string) {
    const newCurrentUserFriendsList = userData?.friends.filter(
      (item) => item !== friendID || item === ""
    );

    console.log(userData);
    setData(`/users/${userID}`, {
      ...userData,
      friends: newCurrentUserFriendsList,
    });
    const db = getDatabase();
    const disReference = ref(db, `/users/${friendID}`);

    onValue(
      disReference,
      (snapshot) => {
        const otherUsersData: DataType = snapshot.val();

        const newOtherUserFriendsList = otherUsersData?.friends.filter(
          (item) => item !== userID
        );

        setData(`/users/${friendID}`, {
          ...otherUsersData,
          friends: newOtherUserFriendsList,
        });
      },
      (error) => {
        console.error("Error fetching data: ", error);
      }
    );
  }

  function selectedChat(
    friend: DataType,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    if (currentFriend !== friend.custom_ID) {
      const getAllFriendSquares = document.querySelectorAll(".friendSquare");
      getAllFriendSquares.forEach((item) => {
        item.classList.remove("bg-gray-100");
      });
      e.currentTarget.classList.add("bg-gray-100");

      scrollDown();

      setCurrentFriend(friend.custom_ID);
      setMessages([]);

      setNewOrNot((prev) =>
        prev.map((item) =>
          item.friendID === friend.custom_ID ? { ...item, new: false } : item
        )
      );
    }
  }

  useEffect(() => {
    const filtredList = friendList?.filter((fri) => {
      if (fri.userName.includes(sortValue)) {
        return fri;
      }

      if (sortValue.trim() === "") {
        console.log("Is empty");
        return friendList;
      }
    });

    setFiltredValue(filtredList);
  }, [sortValue]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024); 
      if (fileSizeMB > maxFileSizeMB) {
        alert(
          `File size exceeds ${maxFileSizeMB}MB limit. Please select a smaller file.`
        );
      } else {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          console.log("File uploaded:", data);

          setMessages((prev) => [
            ...prev,
            { sender: userData!, txt: data.filePath, messageID: uuidV4() },
          ]);
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }
    }
  };

  useEffect(() => {
    setCurrentFriend("");
  }, []);

  function scrollDown() {
    if (msgRef.current) {
      msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }
  }

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; 

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data); 
      };

      mediaRecorder.start();
      setRecording(true);
      console.log("Recording started...");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioURL = URL.createObjectURL(audioBlob);

        setAudioURL(audioURL); 
        sendAudioMessage(audioBlob);
        setRecording(false);
        console.log("Recording stopped.");
      };
    }
  };

  const sendAudioMessage = async (audioBlob: Blob): Promise<void> => {
    console.log("Sending audio message...", audioBlob);

    const audioFile = new File([audioBlob], "audio_message.mp3", {
      type: "audio/mp3",
    });

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("File uploaded:", data);

      setMessages((prev) => [
        ...prev,
        { sender: userData!, txt: data.filePath, messageID: uuidV4() },
      ]);
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  function newMessages(friendID: string) {
    return newOrNot.find((x) => x.friendID === friendID)?.new === true
      ? "!"
      : "";
  }

  let activeListeners: { ref: any; callback: any }[] = [];

  function checkIncomeNewOrNot() {
    if (monitoringIntervalIdNewOrNot === null) {
      monitoringIntervalIdNewOrNot = setInterval(() => {
        const db = getDatabase();

        friendList!.forEach((friend) => {
          const roomKey = [friend.custom_ID, userData!.custom_ID]
            .sort()
            .join("");
          const disReference = ref(
            db,
            `/lastmessages/${roomKey}/${userData?.custom_ID}`
          );
          const roomReference = ref(db, roomKey);

          let messages: MessageType[] = [];

          const roomCallback = (snapshot: any) => {
            const value = snapshot.val();
            if (value && value.messages) {
              messages = value.messages;
            }
          };
          onValue(roomReference, roomCallback, (error) => {
            console.error("Error fetching messages: ", error);
          });
          activeListeners.push({ ref: roomReference, callback: roomCallback });

          const disCallback = (snapshot: any) => {
            const thisFriendData: MessageType = snapshot.val();

            if (!thisFriendData || messages.length === 0) return;

            const friendMessages = messages.filter(
              (message) => message.sender.custom_ID === friend.custom_ID
            );

            const lastMessage = friendMessages[friendMessages.length - 1];

            setNewOrNot((prev) => {
              const existing = prev.find(
                (x) => x.friendID === friend.custom_ID
              );

              if (lastMessage?.txt !== thisFriendData?.txt) {
                if (!existing || existing.new === false) {
                  return [
                    ...prev.filter((x) => x.friendID !== friend.custom_ID),
                    { friendID: friend.custom_ID, new: true },
                  ];
                }
              } else {
                if (!existing || existing.new === true) {
                  return [
                    ...prev.filter((x) => x.friendID !== friend.custom_ID),
                    { friendID: friend.custom_ID, new: false },
                  ];
                }
              }
              return prev;
            });
          };
          onValue(disReference, disCallback, (error) => {
            console.error("Error fetching last message: ", error);
          });
          activeListeners.push({ ref: disReference, callback: disCallback });
        });
      }, 2400);
    }
  }

  checkIncomeNewOrNot();
  //THIS FUNCTION CAUSING ERRORS

  let peer: Peer | null = null;
  let peerList: any[] = [];


  function toggleMute(b: boolean) {
    if (!myStream) {
      console.warn("No active stream to mute/unmute.");
      return;
    }

    const audioTrack = myStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = b;
      console.log(b ? "Audio unmuted" : "Audio muted");
    } else {
      console.warn("No audio track found in the stream.");
    }
  }

  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  function init(userId: string) {
    if (peer) {
      console.warn("A peer is already connected. Disconnect first.");
      disconnect(); // Ensure proper cleanup before reinitializing
    }

    console.log("Initializing peer for user:", userId);
    peer = new Peer(userId, { host: "localhost", path: "/myapp", port: 9000 });

    peer.on("open", (id) => {
      console.log(`${id} connected`);
    });

    listenToCall();

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });
  }

  // Listen for incoming calls
  function listenToCall() {
    if (!peer) {
      console.error("Peer is not initialized. Cannot listen to calls.");
      return;
    }

    peer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: false, audio: true }) 
        .then((stream) => {
          setMyStream(stream); 
          console.log("myStream set in listenToCall:", stream); 

          call.answer(stream);
          call.on("stream", (remoteStream) => {
            if (!peerList.includes(call.peer)) {
              addRemoteAudio(remoteStream);
              peerList.push(call.peer);
            }
          });
        })
        .catch((err) => {
          console.error("Unable to get media devices: " + err);
        });
    });
  }

  // Make a call to another user
  function makeCall(receiverId: string) {
    if (!peer) {
      console.error("Peer is not initialized. Call init() first.");
      return;
    }

    console.log("Attempting to connect to peer:", receiverId);

    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true }) 
      .then((stream) => {
        setMyStream(stream);
        console.log("myStream set in makeCall:", stream); 
        console.log("Stream initialized:", stream);

        addLocalAudio(stream);

        const call = peer!.call(receiverId, stream); 

        call.on("stream", (remoteStream) => {
          if (!peerList.includes(call.peer)) {
            addRemoteAudio(remoteStream);
            peerList.push(call.peer);
          }
        });

        call.on("error", (err) => {
          console.error("Call error:", err);
        });
      })
      .catch((err) => {
        console.error("Unable to connect: " + err);
      });
  }

  function addRemoteAudio(stream: MediaStream) {
    const audio = document.createElement("audio");
    audio.srcObject = stream;
    audio.controls = true;
    audio.autoplay = true;

    const remoteDiv = document.getElementById("remoteVideo");
    if (remoteDiv) {
      remoteDiv.appendChild(audio);
    } else {
      console.warn("Remote video element not found.");
    }
  }

  function addLocalAudio(stream: MediaStream) {
    const audio = document.createElement("audio");
    audio.srcObject = stream;
    audio.controls = true;
    audio.muted = true; 
    audio.autoplay = true;

    const localDiv = document.getElementById("localVideo");
    if (localDiv) {
      localDiv.appendChild(audio);
    } else {
      console.warn("Local video element not found.");
    }
  }
  async function disconnect() {
    console.log("Disconnecting...");

    if (monitoringIntervalIdNewOrNot !== null) {
      clearInterval(monitoringIntervalIdNewOrNot);
      monitoringIntervalIdNewOrNot = null;
      console.log("Monitoring interval cleared.");
    }

    const db = getDatabase();
    activeListeners.forEach(({ ref, callback }) => {
      off(ref, "value", callback);
    });
    activeListeners = [];
    console.log("Firebase listeners removed.");

    friendList!.forEach((friend) => {
      const roomKey = [friend.custom_ID, userData!.custom_ID].sort().join("");
      const roomReference = ref(db, roomKey);
      const disReference = ref(
        db,
        `/lastmessages/${roomKey}/${userData?.custom_ID}`
      );
      off(roomReference);
      off(disReference);
    });

    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
      console.log("Local media stream stopped.");
    }

    if (peer) {
      Object.values(peer.connections).forEach((connections) => {
        connections.forEach((connection: any) => {
          if (connection.close) connection.close();
        });
      });

      peer.removeAllListeners();

      peer.disconnect();
      peer.destroy(); 
      peer = null;
      console.log("PeerJS instance destroyed.");
    }

    peerList = [];

    const remoteDiv = document.getElementById("remoteVideo");
    if (remoteDiv) remoteDiv.innerHTML = "";
    const localDiv = document.getElementById("localVideo");
    if (localDiv) localDiv.innerHTML = "";

    console.log("Disconnected successfully.");
  }

  navigator.permissions
    .query({ name: "microphone" as PermissionName })
    .then((result) => {
      if (result.state === "granted") {
        console.log("Microphone access granted.");
      } else {
        console.log("Microphone access denied.");
      }
    });

  function toggleSpeakerphone() {
    const audioElement = document.querySelector("audio");
    if (audioElement && myStream) {
      const audioTracks = myStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioElement
          .setSinkId(audioElement.sinkId === "default" ? "speaker" : "default")
          .then(() => {
            console.log("Speakerphone toggled");
          })
          .catch((err) => {
            console.error("Error toggling speakerphone:", err);
          });
      }
    }
  }

  async function makeCallBtnPressed() {
    if (!userData?.custom_ID || !currentFriend) {
      console.error("User data or current friend is missing.");
      return;
    }

    const friendUser = friendList?.find(
      (friend) => friend.custom_ID === currentFriend
    );

    if (!friendUser) {
      console.error("Friend not found.");
      return;
    }
    const db = getDatabase();
    const roomKey = `voice/${friendUser.custom_ID}`;
    const roomKey2 = `voice/${userData.custom_ID}`;
    const answersKey = `voice/answers`;

    const pathForOther = `taken/${currentFriend}`;

    const pathForMe = `taken/${userData.custom_ID}`;

    try {
      const dataFriend = await getDataPromise(roomKey);
      const dataUser = await getDataPromise(roomKey2);

      const takenDataMe = await getDataPromise(pathForMe);

      const takenDataHim = await getDataPromise(pathForOther);

      const friendExists = Array.isArray(dataFriend)
        ? dataFriend.some((user) => user.custom_ID === userData.custom_ID)
        : false;

      const userExists = Array.isArray(dataUser)
        ? dataUser.some((user) => user.custom_ID === friendUser.custom_ID)
        : false;

      monitoringCallEnd(friendUser.custom_ID);

      // WE NEED TO CHECK IF HE IS TAKEN IN DEPTH LIKE EVEN CHECK IF PEOPLE ARE CALLING HIM OR HE IS CALLING PEOPLE AND EVEN IF HE ISNT TAKEN! SOME TTHING LIKE DATTT
      if (userExists) {

        const pathForInACallForTheOther = `InACall/${currentFriend}`;

        const pathCallData = await getDataPromise(pathForInACallForTheOther);

        console.log(takenDataHim);

        if (takenDataHim === userData.custom_ID) {
          await set(ref(db, `${answersKey}/${userData.custom_ID}`), true);
          init(userData.custom_ID);
          console.log("Answering the call from friend.");
          console.log("ANSWERING CALL", userData.custom_ID);

          console.log("CONNECTED", userData.custom_ID);

          await remove(ref(db, roomKey2));
          await remove(ref(db, roomKey));
          setVoiceCallingsState("connected");
          return;
        } else if (pathCallData !== userData.custom_ID) {
          await set(ref(db, `${answersKey}/${userData.custom_ID}`), true);
          // init(userData.custom_ID);
          console.log("NOT ANSWERING");
          // // Remove the call data from the database
          // await remove(ref(db, roomKey2));
          // await remove(ref(db, roomKey));
          // setVoiceCallingsState("connected");
          return;
        }
      }

      if (!friendExists && !userExists) {
        const data = await getDataPromise(roomKey);
        // Initiate a new call

        console.log(data);
        await set(ref(db, roomKey), [userData]);

        console.log("CONNECTED", userData.custom_ID);

        init(userData.custom_ID);

        if (
          takenDataHim === null ||
          takenDataHim === undefined ||
          takenDataHim === ""
        ) {
          console.log("MADE A CALL TO", friendUser.custom_ID);
          makeCall(friendUser.custom_ID);
        }

        setVoiceCallingsState("calling");

        monitorAnswerStatus(friendUser.custom_ID);
        return;
      }

      if (!friendExists && !userExists)
        console.log(
          "No action taken: Either already in a call or invalid state."
        );
    } catch (error) {
      console.error("Error during call setup: ", error);
    }
  }

  function monitorAnswerStatus(userId: string) {
    const db = getDatabase();
    const friendUser = friendList?.find(
      (friend) => friend.custom_ID === currentFriend
    );

    const answersKey = `voice/answers/${userId}`;
    const roomKey = `voice/${friendUser!.custom_ID}`;

    monitoringIntervalId = setInterval(async () => {
      try {
        const answerStatus = await getDataPromise(answersKey);

        const friendVoiceReq = await getDataPromise(roomKey);

        if (!friendVoiceReq) {
          clearInterval(monitoringIntervalId!);
        }

        if (answerStatus) {
          console.log("User answered the call. Connecting...");
          setVoiceCallingsState("connected");

          clearInterval(monitoringIntervalId!);
          await remove(ref(db, answersKey));
        }
      } catch (error) {
        console.error("Error checking answer status: ", error);
      }
    }, 1000);
  }

  function monitoringCallEnd(userId: string) {
    const db = getDatabase();

    const roomKeyOneDisconnects = `disconnect/${userId}`;
    const roomKeyTwoDisconnects = `disconnect/${userData?.custom_ID}`;

    monitoringIntervalIdCallEnd = setInterval(async () => {
      try {
        const getData = await getDataPromise(roomKeyOneDisconnects);

        const getData2 = await getDataPromise(roomKeyTwoDisconnects);

        if (getData === true) {
          setVoiceCallingsState("closed");
          disconnect();
          await remove(ref(db, roomKeyOneDisconnects));
        }

        if (getData === true || getData2 === true) {
          clearInterval(monitoringIntervalIdCallEnd!);
        }
        let shouldItBeDeleted;

        setVoiceCallingsState((prev) => {
          if (prev === "calling") {
            shouldItBeDeleted = true;
          }
          return prev;
        });
        if (getData2 === true && shouldItBeDeleted) {
          setVoiceCallingsState("closed");
          disconnect();

          await remove(ref(db, roomKeyTwoDisconnects));
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  useEffect(() => {
    if (!friendList?.length) return;

    const removeRoomKey = async () => {
      const db = getDatabase();

      try {
        for (const friend of friendList) {
          const roomKeyFriend = `voice/${friend.custom_ID}`;
          const roomKeyFriendAnswer = `voice/answers/${userData!.custom_ID}`;

          const data = await getDataPromise(roomKeyFriend);

          if (data && Array.isArray(data)) {
            const filteredData = data.filter(
              (user: DataType) => user.custom_ID !== userData?.custom_ID
            );

            await set(ref(db, roomKeyFriend), filteredData);

            const pathForInACall = `InACall/${userData?.custom_ID}`;

            const pathTaken = `taken/${userData?.custom_ID}`;

            await remove(ref(db, pathForInACall));

            await remove(ref(db, pathTaken));

            await remove(ref(db, roomKeyFriendAnswer));
          } else {
            console.log(`No data found for ${roomKeyFriend}`);
          }
        }
      } catch (e) {
        console.error("Error removing room key:", e);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";

      removeRoomKey().catch((err) => console.error("Cleanup failed:", err));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [friendList, userData]);

  function checkForIncomingCalls() {
    const db = getDatabase();

    const roomKey = `voice/${userData?.custom_ID}`;

    monitoringIntervalIdIncomingCall = setInterval(async () => {
      try {
        let thisCurrentFriend;

        let roomKeyDisconnect;

        const data: DataType[] = await getDataPromise(roomKey);

        let disConnectData: any;

        if (data !== null) {
          let shouldExcute;
          setVoiceCallingsState((prev) => {
            if (prev === "") {
              shouldExcute = true;
            }
            return (prev = prev);
          });

          console.log(data);
          if (data.length > 0 && shouldExcute) {
            thisCurrentFriend = data[0].custom_ID;
            setCurrentFriend(thisCurrentFriend);
            setVoiceCallingsState("called");
          }
        }

        roomKeyDisconnect = `disconnectCalling/${currentFriend}`;

        disConnectData = await getDataPromise(roomKeyDisconnect);

        const pathForInACall = `InACall/${userData?.custom_ID}`;
        const pathForInACallForTheOther = `InACall/${currentFriend}`;

        let callData = await getDataPromise(pathForInACallForTheOther);

        const pathTaken = `taken/${userData?.custom_ID}`;

        const thooseWhoAreCallingMe = `voice/${userData?.custom_ID}`;

        let callingMeData = await getDataPromise(thooseWhoAreCallingMe);
        console.log(callingMeData);
        // Tihs line
        setVoiceCallingsState((prev) => {
          if (prev === "called" && disConnectData === true) {
            setVoiceCallingsState("closed");
          }

          if (prev === "closed" && disConnectData === true) {
            remove(ref(db, roomKeyDisconnect));
          }

          if (prev === "" || prev === "closed") {
            if (peerList.length !== 0) {
              disconnect();
            }

            remove(ref(db, pathForInACall));

            remove(ref(db, pathTaken));
          }

          if (prev === "connected") {
            if (
              userData?.custom_ID !== undefined ||
              userData?.custom_ID !== "undefined"
            ) {
              const pathForInACall = `InACall/${userData?.custom_ID}`;
              const takenCallPath = `taken/${userData?.custom_ID}`;

              setData(pathForInACall, currentFriend);
              setData(takenCallPath, currentFriend);

              callData = getDataPromise(pathForInACallForTheOther);
            }
          }

          if (prev === "calling") {
            setData(pathTaken, currentFriend);
          }

          if (
            (prev === "connected" && callData === null) ||
            callData === undefined
          ) {
            console.log("THIS IS GETTING REMOVED");
            setVoiceCallingsState("closed");
            remove(ref(db, pathForInACall));
            remove(ref(db, pathForInACallForTheOther));
          }

          if (
            prev !== "closed" &&
            prev !== "" &&
            userData !== null &&
            userData !== undefined &&
            prev !== "called"
          ) {
            if (callingMeData !== null) {
              if (callingMeData[0] !== currentFriend) {
                setMiniScreenActive(true);
              } else {
                setMiniScreenActive(false);
              }
            } else {
              setMiniScreenActive(false);
            }
          } else {
            setMiniScreenActive(false);
          }
          return (prev = prev);
        });
      } catch (e) {
        console.error(e);
      }
    }, 2500); 
  }

  checkForIncomingCalls();

  // WHEN U CALL OTHERS CAN ANSWERED BCZ THEY'RE CONNECTING TO SAME ID

  // SO RIGHT NOW FIX THE MINI SCREEN

  // checkForIncomingCalls();

  // function monoitorIfMiniScreenNeeded() {
  //   const db = getDatabase();

  //   const roomKey = `voice/${userData?.custom_ID}`;
  //   let intervalID = setInterval(async () => {
  //     const data = await getDataPromise(`${roomKey}/0`);
  //     console.log(data);

  //     if (data !== undefined && data !== null) {
  //       if (currentFriend !== data && voiceCallingsState !== "") {
  //         setMiniScreenActive(true);
  //       }
  //     } else {
  //       setMiniScreenActive(false);
  //     }
  //   }, 2800);
  // }

  // monoitorIfMiniScreenNeeded()
  return (
    // <div
    //   style={{
    //     display: "block",
    //     justifyContent: "space-around",
    //     margin: "0px",
    //   }}
    // >
    //   {/* <div className="primary-video" id="remoteVideo"></div>
    //   <div className="secondary-video" id="localVideo"></div> */}
    //   <div className="h-5 w-5 flex p-10 bg-red-600 relative top-0 text-white">
    //     <button className="h-5 w-5 mr-10" onClick={() => init("user1")}>
    //       CONNECT USER 1
    //     </button>
    //     <button className="h-5 w-5 ml-10" onClick={() => init("user2")}>
    //       CONNECT USER 2
    //     </button>

    //     <button className="h-5 w-5 ml-10" onClick={() => makeCall("user2")}>
    //       USER 1 CALL USER 2
    //     </button>

    //     <button className="h-5 w-5 ml-10" onClick={() => makeCall("user1")}>
    //       USER 2 CALL USER 1
    //     </button>

    //     <button className="h-5 w-5 ml-20" onClick={() => disconnect()}>
    //       DISCONNECT
    //     </button>
    //   </div>
    // </div>
    <div
      className="w-screen h-[calc(100vh-2cm)] sm:p-5"
      style={{ marginTop: "2.5cm" }}
    >
      <div className="primary-video" id="remoteVideo"></div>
      <div className="secondary-video" id="localVideo"></div>

      {currentFriend !== "" &&
        userData !== null &&
        voiceCallingsState !== "" && (
          <VoiceCalling
            friendUser={
              friendList!.find((friend) => friend.custom_ID === currentFriend)!
            }
            status={voiceCallingsState}
            disconnectFunction={() => disconnect()}
            userData={userData!}
            peerList={peerList}
            makeCallBtnPressed={makeCallBtnPressed}
            toggleMuteFunc={toggleMute}
            toggleSpeakerphone={toggleSpeakerphone}
          />
        )}

      <div className="bg-white border border-gray-200 rounded flex flex-col sm:flex-row h-full">
        {/* Left Panel */}
        <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-full flex flex-col left-panel">
          <div className="flex flex-col text-sm border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <button className="py-3 w-20 uppercase font-semibold select-none h-full focus:outline-none border-b border-black">
                  Friends
                </button>
                <button className="py-3 w-20 uppercase text-gray-400 select-none h-full focus:outline-none border-b border-transparent">
                  Groups
                </button>
              </div>
            </div>
            <div className="mt-2">
              <input
                type="text"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search username by name"
                onChange={(e) => setSortValue(e.currentTarget.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sm:h-[calc(100vh-2.5cm)] sm:overflow-y-auto friendsListContainer">
            <ul className="py-1 space-y-2">
              {filtredValue !== null &&
                filtredValue?.map((friend, index) => (
                  <li key={index} className="sm:w-full w-64 mx-auto sm:mx-0">
                    <div
                      className="flex items-center w-full px-4 py-2 select-none hover:bg-gray-100 focus:outline-none cursor-pointer friendSquare"
                      onClick={(e) => selectedChat(friend, e)}
                      data-id={friend.custom_ID} // Friend selection
                    >
                      <img
                        className="w-12 mr-3 rounded-full border object-cover aspect-square"
                        src={friend!.imgUrl}
                        alt={friend!.userName}
                      />
                      <div className="transform translate-y-0.5 text-left flex items-center space-x-2 flex-grow">
                        <h3 className="leading-4 m-0">{friend!.userName}</h3>{" "}
                        {newMessages(friend.custom_ID) === "!" && (
                          <div className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs">
                            {newMessages(friend.custom_ID)}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none"
                          onClick={(event) =>
                            toggleMenu(friend.custom_ID, event)
                          } // Pass event to prevent bubbling
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisV}
                            className="text-gray-600"
                          />
                        </button>

                        {menuOpen === friend.custom_ID && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <ul className="py-2 text-sm text-gray-700">
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                                onClick={() =>
                                  handleUnfriendUser(friend.custom_ID)
                                }
                              >
                                <FontAwesomeIcon
                                  icon={faUserSlash}
                                  className="text-red-500"
                                />
                                <span>Unfriend</span>
                              </li>
                              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2">
                                <FontAwesomeIcon
                                  icon={faUser}
                                  className="text-blue-500"
                                />
                                <span>View Profile</span>
                              </li>
                              <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2">
                                <FontAwesomeIcon
                                  icon={faBan}
                                  className="text-yellow-500"
                                />
                                <span>Block</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="mobileFriend sm:w-1/2 md:w-2/3 lg:w-3/4 border-l border-gray-200 sm:flex flex-col justify-between h-full right-panel">
          {currentFriend !== "" && (
            <div className=" w-full p-4 border-b border-gray-200 dark:border-neutral-700 fixed  sm:relative sm:p-4 sm:border-b-0 sm:h-auto sm:flex-row  sm:bg-transparent bg-white sm:shadow-none shadow-lg z-10 mt-5 mb-5">
              <NavbarChat
                friendUser={
                  friendList!.find(
                    (friend) => friend.custom_ID === currentFriend
                  )!
                }
                connectFunction={init}
                callFunction={makeCall}
                disconnectFunction={disconnect}
                callBtnFunction={makeCallBtnPressed}
              />
            </div>
          )}

          <div ref={msgRef} className="flex-1 overflow-y-auto p-4 pt-[4rem] ">
            {currentFriend === "" ? (
              <div className="flex justify-center items-center h-full text-center text-gray-700">
                Click on any friend to chat!
              </div>
            ) : (
              <ChatComponent
                currentUser={userData!}
                friendUser={
                  friendList!.find(
                    (friend) => friend.custom_ID === currentFriend
                  )!
                }
              />
            )}
          </div>

          {currentFriend !== "" && (
            <div className="flex items-center w-full p-4 border-t border-gray-200 dark:border-neutral-700 fixed bottom-0 sm:relative sm:p-4 sm:border-t-0 sm:h-auto sm:flex-row sm:justify-between sm:bg-transparent bg-white sm:shadow-none shadow-lg">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-2 rounded-l-lg border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />

              <div className="relative inline-flex items-center">
                <label className="p-2 bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-gray-300 rounded-l-none hover:bg-gray-300 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-center h-10 w-10">
                  <FontAwesomeIcon icon={faPaperclip} />
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    handleSendMessage();
                    if (message === "") {
                      setRecording((prev) => !prev);
                      if (recording === false) {
                        startRecording();
                      } else {
                        stopRecording();
                      }
                    }
                  }}
                  className="p-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center h-10 w-10"
                >
                  {!recording && (
                    <FontAwesomeIcon
                      icon={message === "" ? faMicrophone : faPaperPlane}
                    />
                  )}

                  {recording && <FontAwesomeIcon icon={faStop} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// NOW FIX THE ERROR SO THAT THE MENU IS DISPLAYED WHEN CALLING AND WHEN ANSWERED ALSO FIX WHEN U ANSWER U DELETE FROM DATABASE. THE PEERLIST DIDNT WORK SO IMMA ADD CALLS TO DATABASE TO FIX IT INSTEAD
