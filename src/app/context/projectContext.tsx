import React, { createContext, useState, useContext, ReactNode } from "react";
import { MessageType } from "../components/Friends";


// Define a type for the context
type AlertType = {
  text: string;
  color: string;
  err: boolean;
};

type ContextType = {
  alert: AlertType;
  setAlert: React.Dispatch<React.SetStateAction<AlertType>>;

  currentComponent: string;
  setCurrentComponent: React.Dispatch<React.SetStateAction<string>>;

  setCurrentFriend: React.Dispatch<React.SetStateAction<string>>;
  currentFriend: string;

  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  messages: MessageType[];

  setVoiceCallingsState: React.Dispatch<React.SetStateAction<string>>;
  voiceCallingsState: string;

  setMiniScreenActive: React.Dispatch<React.SetStateAction<boolean>>;
  miniScreenActive: boolean;
};

// Create a Context with the correct type
const ProjectContext = createContext<ContextType | undefined>(undefined);

// Create a custom hook to use the ProjectContext
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a UserProvider");
  }
  return context;
};

// Create a provider component
type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [alert, setAlert] = useState<AlertType>({
    text: "",
    color: "red",
    err: false,
  });

  const [currentComponent, setCurrentComponent] = useState<string>("settings");

  const [currentFriend, setCurrentFriend] = useState<string>("");

  const [messages, setMessages] = useState<MessageType[]>([]);

  const [voiceCallingsState, setVoiceCallingsState] = useState<string>("");

  const [miniScreenActive, setMiniScreenActive] = useState<boolean>(false);


  return (
    <ProjectContext.Provider
      value={{
        alert,
        setAlert,
        currentComponent,
        setCurrentComponent,
        currentFriend,
        setCurrentFriend,
        messages,
        setMessages,
        voiceCallingsState,
        setVoiceCallingsState,
        miniScreenActive,
        setMiniScreenActive
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
