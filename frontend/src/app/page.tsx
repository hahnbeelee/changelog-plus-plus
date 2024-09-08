"use client";

import { useState } from "react";
import { generateChangelogForGreptileDocs } from "./backendInFrontend";
import ReactMarkdown from "react-markdown";

const GithubUrlForm = () => {
  const [url, setUrl] = useState("");
  const [changelog, setChangelog] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setChangelog("");
    e.preventDefault();
    // Handle the submission logic here
    console.log("Submitted URL:", url);
    setIsLoading(true);
    const generatedChangelog = await generateChangelogForGreptileDocs(url);
    setChangelog(generatedChangelog || "Failed to generate changelog");
    console.log("Generated Changelog:", generatedChangelog);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <h1 className="text-3xl mb-4">changelog++</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter GitHub URL"
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit
        </button>
      </form>
      {isLoading && <p className="dark:text-white">Loading...</p>}
      {changelog && (
        <div className="dark:text-gray-400 prose prose-sm">
          <ReactMarkdown>{changelog}</ReactMarkdown>
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
