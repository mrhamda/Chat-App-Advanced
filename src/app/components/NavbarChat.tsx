import { useState } from "react";
import { FaPhone, FaVideo, FaBars, FaTimes } from "react-icons/fa";

import { DataType } from "./AddFriends";

type NavbarChatProps = {
  friendUser: DataType;
  connectFunction: (x: string) => void;
  callFunction: (x: string) => void;
  disconnectFunction: () => void;
  callBtnFunction: () => Promise<void>;
};
const NavbarChat: React.FC<NavbarChatProps> = ({
  friendUser,
  connectFunction,
  callFunction,
  disconnectFunction,
  callBtnFunction,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleVoicecall = async () => {
    try {
      await callBtnFunction();  // Ensure the async function is called properly
    } catch (error) {
      console.error("Error during button click:", error);
    }
  };
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={`${friendUser?.imgUrl}`}
                alt="User profile"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = friendUser?.imgUrl;
                }}
              />
            </div>
            <div className="ml-3">
              <span className="text-gray-800 font-medium text-lg" role="text">
                {friendUser?.userName}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              aria-label="Start voice call"
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleVoicecall}
            >
              <FaPhone className="h-5 w-5" />
            </button>
            <button
              aria-label="Start video call"
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaVideo className="h-5 w-5" />
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              aria-label="Start voice call"
              className="w-full flex items-center px-3 py-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleVoicecall}

            >
              <FaPhone className="h-5 w-5 mr-2" />
              <span>Voice Call</span>
            </button>
            <button
              aria-label="Start video call"
              className="w-full flex items-center px-3 py-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaVideo className="h-5 w-5 mr-2" />
              <span>Video Call</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarChat;
