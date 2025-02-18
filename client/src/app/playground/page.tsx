"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Terminal as XTerminal } from "xterm";
import Terminal from "@/components/term";
import { Loading } from "../loader";
import { Button } from "@/components/ui/button";
import { CodeIcon, Globe, GlobeIcon, PowerIcon, Settings2Icon, TerminalIcon } from "lucide-react";
import { useRecoilValue } from "recoil";
import { containerState } from "@/atom/container";

export default function Page() {
  const [socket, setSocket] = useState<any>(null);
  const [containerId, setContainerId] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileTree, setFileTree] = useState<any>(null);
  const container = useRecoilValue(containerState)
  const [term, setTerm] = useState<XTerminal | null>(null);

  useEffect(() => {
    // console.log("Containerrrrrrr:", container);
    const searchParams = new URLSearchParams(window.location.search);
    const containerId = searchParams.get("containerId");
    setContainerId(containerId);

    if (containerId && terminalRef.current) {
      const newTerm = new XTerminal({
        cursorBlink: true,
        fontSize: 16,
        rows: 20,
        cols: 90,
      });

      // Set xterm.js instance to state
      setTerm(newTerm);

      const newSocket = io("http://localhost:4000");
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to the server");
        newSocket.emit("containerId", containerId);
        newSocket.emit("getFileTree", "/home");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from the server");
        window.location.href = "/";

      });

      newSocket.on("fileTree", (fileTreeData: any) => {
        console.log("Received file tree from server:", fileTreeData);
        setFileTree(fileTreeData);
      });

      newSocket.on("output", (data: any) => {
        if (term) {
          term.write(data); // Write output to terminal
        }
      });

      if (term && terminalRef.current) {
        term.open(terminalRef.current); // Open terminal if ref exists
      }

      term?.onData((data) => {
        newSocket.emit("input", data);
      });

      return () => {
        if (term) {
          term.dispose(); // Dispose xterm.js instance on cleanup
        }
        newSocket.disconnect();
      };
    }
  }, [containerId, container]);

  return (
    <div className="min-h-screen min-w-screen flex flex-col">
      {loading && <Loading />}
      {!loading && (
        <div className="flex flex-col h-screen">
          <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Virtual Machine</h1>
              <p className="text-sm text-muted-foreground">ID: 12345678</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings2Icon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  socket.disconnect();
                  window.location.href = "/";
                }}
              >
                <PowerIcon className="w-5 h-5" />
              </Button>
            </div>
          </header>
          <div>
            Exposed Port: {container.internalPort} {"->"}{" "}
            {container.externalPort}
          </div>
          <main className="flex-1 flex flex-wrap justify-center gap-6 p-6 my-auto h-full align-middle items-center">
            <div className="w-1/2 flex flex-row gap-3">
              <div
                className="bg-zinc-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center w-full sm:w-auto sm:flex-1 h-48"
                onClick={() => {
                  window.open(`http://localhost:${container.externalPort}`);
                }}
              >
                <CodeIcon className="w-8 h-8 mb-2 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-center">VS Code</h2>
                  <p className="text-sm text-muted-foreground text-center text-white">
                    Access your virtual machine's VS Code
                  </p>
                </div>
              </div>

              <div
                className="bg-zinc-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center w-full sm:w-auto sm:flex-1 h-48"
                onClick={() => {
                  window.open(`http://localhost:5800`);
                }}
              >
                <GlobeIcon className="w-8 h-8 mb-2 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-center">Browser</h2>
                  <p className="text-sm text-muted-foreground text-center text-white">
                    Access your virtual machine's browser
                  </p>
                </div>
              </div>
            </div>
            <Terminal terminalRef={terminalRef} containerId={containerId} />
          </main>
        </div>
      )}
    </div>
  );
}
