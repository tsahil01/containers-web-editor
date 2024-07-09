"use client";

import { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import Terminal from "@/components/term";
import { Container } from "@/lib/containerFetch";
import { containerState } from "@/atom/container";
import { useRecoilValue } from "recoil";
import "xterm/css/xterm.css";


export default function Page() {
  const [containerId, setContainerId] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileTree, setFileTree] = useState<any>(null);
  const container = useRecoilValue(containerState);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const containerId = searchParams.get("containerId");
    setContainerId(containerId);

    if (containerId && terminalRef.current) {
      const term = new XTerminal({
        cursorBlink: true,
        fontSize: 16,
        fontWeightBold: "bold",
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      const resizeTerminal = () => {
        fitAddon.fit();
      };

      resizeTerminal();
      window.addEventListener("resize", resizeTerminal);

      const newSocket = io("http://localhost:4000");

      newSocket.on("connect", () => {
        newSocket.emit("containerId", containerId);
        newSocket.emit("getFileTree", "/home"); // Example: Request file tree for '/'
        setLoading(true); // Set loading state when fetching starts
      });

      newSocket.on("fileTree", (fileTreeData: any) => {
        console.log("Received file tree from server:", fileTreeData);
        setFileTree(fileTreeData);
        setLoading(false); // Turn off loading state when data received
      });

      newSocket.on("output", (data: string) => {
        term.write(data);
      });

      term.onData((data) => {
        newSocket.emit("input", data);
      });

      return () => {
        term.dispose();
        newSocket.disconnect();
        window.removeEventListener("resize", resizeTerminal);
      };
    }
  }, [containerId]);

  return (
    <div>
      <h1>Page</h1>
      <div>
        {containerId && <div>Container ID: {containerId}</div>}
        {container && (
          <div>
            Exposed Port: {container.internalPort} {"->"}{" "}
            {container.externalPort}{" "}
          </div>
        )}
      </div>
      <div className="m-10 border border-black p-10">
        <Terminal containerId={containerId} terminalRef={terminalRef} />
      </div>
    </div>
  );
}
