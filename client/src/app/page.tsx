"use client";

import Terminal from "@/components/term";
import { useState } from "react";

export default function Page() {
  const [containerId, setContainerId] = useState<string | null>(null);

  const startNewContainer = async () => {
    console.log("Starting New Container");
    const containerId = await fetchNewContainer();
    console.log("Container ID:", containerId);
    setContainerId(containerId);
  };

  return (
    <div>
      <div className="p-9 mx-auto">
        <button 
          className="p-2 rounded-md bg-slate-500" 
          onClick={startNewContainer}
        >
          Start New Container
        </button>
        <div>
          {containerId && <div>Container ID: {containerId}</div>}
        </div>
      </div>
      <div className="m-10 border border-black p-10">
        <Terminal containerId={containerId} />
      </div>
    </div>
  );
}

async function fetchNewContainer() {
  const image = "ubuntu";

  const response = await fetch("http://localhost:4000/api/new-container", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image,
      cmd: "/bin/bash",
    }),
  });
  const data = await response.json();
  return data.containerId;
}
