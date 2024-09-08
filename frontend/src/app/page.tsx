"use client";

import { useState } from "react";
import { generateChangelogForGreptileDocs } from "./backendInFrontend";
import ReactMarkdown from "react-markdown";

const GithubUrlForm = () => {
  const [url, setUrl] = useState("");
  const [days, setDays] = useState(7);
  const [changelog, setChangelog] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setChangelog("");
    e.preventDefault();
    // Handle the submission logic here
    console.log("Submitted URL:", url);
    setIsLoading(true);
    const generatedChangelog = await generateChangelogForGreptileDocs(
      url,
      days,
    );
    setChangelog(generatedChangelog || "Failed to generate changelog");
    console.log("Generated Changelog:", generatedChangelog);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg p-3">
      <img src="/logo.png" alt="changelog++" className="w-full" />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 w-full"
      >
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            I want a changelog for
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="GitHub link"
              className="px-4 py-2 w-48 mx-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
              required
            />
            from the last
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              placeholder="Enter days"
              className="px-4 py-2 border border-gray-300 rounded-md w-16 mx-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
              required
            />
            days.
          </p>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Generate Changelog
        </button>
      </form>
      {isLoading && <p className="dark:text-white">Loading...</p>}
      {changelog && (
        <div className="dark:text-gray-400 prose prose-sm dark:prose-invert">
          <ReactMarkdown
            components={{
              img: function (props) {
                return (
                  <img {...props} style={{ width: "50px", height: "50px" }} />
                );
              },
            }}
          >
            {changelog}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <GithubUrlForm />
    </div>
  );
}
