import React from "react";
import { useProjectContext } from "../context/projectContext";

type AlertProps = {
  text: string;
  color: string;
};

export function Alert({ text, color }: AlertProps) {
  const { alert, setAlert } = useProjectContext();

  const colorClass = color === "red"
    ? "text-red-800 bg-red-50 dark:text-red-400 dark:bg-gray-800"
    : color === "green"
    ? "text-green-800 bg-green-50 dark:text-green-400 dark:bg-gray-800"
    : "text-gray-800 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"; // Fallback

  return (
    <div
      id="alert-1"
      className={`flex items-center p-4 mb-4 rounded-lg ${colorClass}`}
      role="alert"
    >
      <svg
        className="flex-shrink-0 w-4 h-4"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
      </svg>
      <span className="sr-only">Info</span>
      <div className="ms-3 text-sm font-medium">{text}!</div>

      <button
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2"
        data-dismiss-target="#alert-1"
        aria-label="Close"
        onClick={() => {
          setAlert({ text: "", err: false, color: "" });
        }}
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-3 h-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  );
}
