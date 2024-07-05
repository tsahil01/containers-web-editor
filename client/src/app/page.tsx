"use client";

import Terminal from "@/components/term";
import { useState } from "react";

interface Container {
  containerId: string;
  internalPort: number;
  externalPort: number;
}

export default function Page() {
  const [containerId, setContainerId] = useState<string | null>(null);
  const [container, setContainer] = useState<Container | null>(null);

  const startNewContainer = async () => {
    console.log("Starting New Container");
    const containerData = await fetchNewContainer();
    setContainer(containerData);
    console.log("Container:", containerData);
    const containerId = containerData.containerId;
    // console.log("Container ID:", containerId);
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
          {container && (
            <div>
              Exposed Port: {container.internalPort} {"->"}{" "}
              {container.externalPort}{" "}
            </div>
          )}
        </div>
      </div>
      <div className="m-10 border border-black p-10">
        <Terminal containerId={containerId} />
      </div>
    </div>
  );
}

async function fetchNewContainer(): Promise<Container> {
  const image = "node";

  const response = await fetch("http://localhost:4000/api/new-container", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image,
      cmd: "",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch new container");
  }

  const data: Container = await response.json();
  // console.log("Container Data:", data);
  return data;
}
