import React, { ReactNode, useEffect, useState, memo } from "react";
import { v4 as uuidV4 } from "uuid";
import path from "path";
import { useProjectContext } from "../context/projectContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFileAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { MessageType } from "./Friends";

type DataType = {
  imgUrl: string;
  userName: string;
  gmail: string;
  custom_ID: string;
  friends: string[];
  friendRequests: string[];
  state: string;
};

type ChatCompProps = {
  currentUser: DataType;
  friendUser: DataType;
};

const ChatComponent: React.FC<ChatCompProps> = ({
  currentUser,
  friendUser,
}) => {
  const { messages, setMessages } = useProjectContext();
  const [msg, setMsg] = useState<ReactNode[]>([]);

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".svg",
    ".webp",
  ];
  const videoExtensions = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
  ];
  const documentExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
  ];

  const audioExtensions = [".mp3", ".wav", ".ogg"];

  useEffect(() => {
    const renderedMessages = messages.map((val) => {
      const trimmedTxt = val.txt.trim();
      let fileType: string | undefined;

      if (trimmedTxt.startsWith("/uploads/")) {
        const ext = path.extname(trimmedTxt);
        if (imageExtensions.includes(ext)) fileType = "image";
        else if (videoExtensions.includes(ext)) fileType = "video";
        else if (documentExtensions.includes(ext)) fileType = "document";
        else if (audioExtensions.includes(ext)) fileType = "audio";
        else fileType = "unknown";
      }

      return (
        <Message
          key={uuidV4()}
          val={val}
          currentUser={currentUser}
          friendUser={friendUser}
          fileType={fileType}
          trimmedTxt={trimmedTxt}
        />
      );
    });

    setMsg(renderedMessages);
  }, [messages, currentUser, friendUser]);

  return (
    <>
      <ul className="space-y-5 chatComp">{msg}</ul>
    </>
  );
};

const Message: React.FC<{
  val: MessageType;
  currentUser: DataType;
  friendUser: DataType;
  fileType: string | undefined;
  trimmedTxt: string;
}> = memo(({ val, currentUser, friendUser, fileType, trimmedTxt }) => {
  const { messages, setMessages } = useProjectContext();

  async function handleDelete(messageID: string, txt: string): Promise<void> {
    try {
      // Call the API to delete the file
      const response = await fetch("/api/deleteFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageID, txt }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(error.error);
        return;
      }

      // Update the messages state
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.messageID === messageID
            ? { ...message, txt: "Message Deleted" }
            : message
        )
      );
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  if (!currentUser || !friendUser) return null;

  return val.sender.custom_ID === currentUser.custom_ID ? (
    <li className="flex items-center gap-x-2 sm:gap-x-4" key={val.messageID}>
      <div className="grow text-end space-y-3">
        <div className="inline-block bg-blue-600 rounded-2xl p-4 shadow-sm relative">
          <p className="text-sm text-white">
            {!val.txt.trim().startsWith("/uploads/") && val.txt}
          </p>

          {val.txt.trim().startsWith("/uploads/") && fileType === "image" && (
            <div className="relative">
              <img
                src={trimmedTxt}
                alt="Uploaded image"
                className="w-[60%] h-auto object-cover rounded-md shadow-md transition-transform transform hover:scale-105 hover:shadow-lg mx-auto"
              />
              <a
                href={trimmedTxt}
                download
                className="absolute top-2 right-2 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:bg-gray-200 hover:text-blue-800 w-8 h-8 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faDownload} className="text-lg" />
              </a>
            </div>
          )}
          {val.txt.trim().startsWith("/uploads/") && fileType === "video" && (
            <>
              <video
                controls
                className="w-[60%] h-auto rounded-md shadow-md transition-transform transform hover:scale-105 hover:shadow-lg mx-auto"
              >
                <source src={trimmedTxt} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <a
                href={trimmedTxt}
                download
                className="absolute top-2 right-2 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:bg-gray-200 hover:text-blue-800 w-8 h-8 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faDownload} className="text-lg" />
              </a>
            </>
          )}
          {val.txt.trim().startsWith("/uploads/") &&
            (fileType === "unknown" || fileType === "document") && (
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon
                  icon={faFileAlt}
                  className="text-white bg-gray-800 p-2 rounded-full shadow-md"
                />
                <span className="text-white text-sm font-medium truncate max-w-[150px] sm:max-w-[250px] md:max-w-[300px]">
                  {trimmedTxt.split("/").pop()}
                </span>
                <a
                  href={trimmedTxt}
                  download
                  className="bg-white text-blue-600 rounded-full p-1.5 shadow-lg hover:bg-gray-200 hover:text-blue-800 w-8 h-8 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-base" />
                </a>
              </div>
            )}

          <div className="flex justify-center items-center">
            {val.txt.trim().startsWith("/uploads/") && fileType === "audio" && (
              <audio
                controls
                className="w-full max-w-[350px] min-w-[250px] rounded-md shadow-sm mx-auto"
              >
                <source src={trimmedTxt} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        </div>
      </div>

      {trimmedTxt !== "Message Deleted" && (
        <div
          className="ml-auto bg-gray-100 rounded-md shadow-lg p-3 hover:shadow-xl transition-all flex items-center justify-center"
          title="Delete"
        >
          <button
            className="text-red-600 hover:text-red-800 transition-all"
            onClick={() => handleDelete(val.messageID, val.txt)}
          >
            <FontAwesomeIcon icon={faTrash} className="text-lg" />
          </button>
        </div>
      )}
    </li>
  ) : (
    <li className="flex items-center gap-x-2 sm:gap-x-4" key={val.messageID}>
      <img
        className="inline-block size-9 rounded-full"
        src={friendUser.imgUrl}
        alt="Avatar"
      />

      <div className="bg-white border border-gray-200 rounded-2xl p-4  dark:bg-neutral-900 dark:border-neutral-700">
        <div className={""}>
          <div className={` text-sm text-gray-800 dark:text-white`}>
            {!val.txt.trim().startsWith("/uploads/") && val.txt}
            {val.txt.trim().startsWith("/uploads/") && fileType === "image" && (
              <div className="relative">
                <img
                  src={trimmedTxt}
                  alt="Uploaded image"
                  className="w-[60%] h-auto object-cover rounded-md shadow-md transition-transform transform hover:scale-105 hover:shadow-lg mx-auto"
                />
                <a
                  href={trimmedTxt}
                  download
                  className="absolute top-2 right-2 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:bg-gray-200 hover:text-blue-800 w-8 h-8 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-lg" />
                </a>
              </div>
            )}
            {val.txt.trim().startsWith("/uploads/") && fileType === "video" && (
              <div className="relative">
                <video
                  controls
                  className="w-[60%] h-auto rounded-md shadow-md transition-transform transform hover:scale-105 hover:shadow-lg mx-auto"
                >
                  <source src={trimmedTxt} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <a
                  href={trimmedTxt}
                  download
                  className="absolute top-2 right-2 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:bg-gray-200 hover:text-blue-800 w-8 h-8 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faDownload} className="text-lg" />
                </a>
              </div>
            )}
            {val.txt.trim().startsWith("/uploads/") &&
              (fileType === "unknown" || fileType === "document") && (
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={faFileAlt}
                    className="text-gray-800 dark:text-white bg-gray-100 p-2 rounded-full shadow-md"
                  />
                  <span className="text-gray-800 dark:text-white text-sm font-medium truncate max-w-[150px] sm:max-w-[250px] md:max-w-[300px]">
                    {trimmedTxt.split("/").pop()}
                  </span>
                  <a
                    href={trimmedTxt}
                    download
                    className="bg-white text-blue-600 rounded-full p-1.5 shadow-lg hover:bg-gray-200 hover:text-blue-800 w-8 h-8 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faDownload} className="text-base" />
                  </a>
                </div>
              )}
          </div>
        </div>

        <div className="flex justify-center items-center">
          {val.txt.trim().startsWith("/uploads/") && fileType === "audio" && (
            <audio
              controls
              className="w-full max-w-[300px] min-w-[150px] rounded-md shadow-sm mx-auto"
            >
              <source src={trimmedTxt} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </div>
    </li>
  );
});

export default ChatComponent;
