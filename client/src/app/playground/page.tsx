"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Terminal as XTerminal } from "xterm";
import Terminal from "@/components/term";
import { useRecoilValue } from "recoil";
import { containerState } from "@/atom/container";
import { Loading } from "../loader";
import { Button } from "@/components/ui/button";
import { CodeIcon, PowerIcon, Settings2Icon, TerminalIcon } from "lucide-react";

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
        theme: {
          background: "#000",
          foreground: "#fff",
          // selection: "#f00",
          cursor: "#f00",
          black: "#000",
          red: "#f00",
          green: "#0f0",
          yellow: "#ff0",
          blue: "#00f",
          magenta: "#f0f",
          cyan: "#0ff",
          white: "#fff",
          brightBlack: "#555",
          brightRed: "#f55",
          brightGreen: "#5f5",
          brightYellow: "#ff5",
        },
      });
      term.open(terminalRef.current);

      const newSocket = io("http://localhost:4000");

      newSocket.on("connect", () => {
        console.log("Connected to the server");
        newSocket.emit("containerId", containerId);
        newSocket.emit("getFileTree", "/home"); // Example: Request file tree
        // setLoading(true);
      });

      newSocket.on("fileTree", (fileTreeData: any) => {
        console.log("Received file tree from server:", fileTreeData);
        setFileTree(fileTreeData);
        // setLoading(false);
      });

      newSocket.on("output", (data: any) => {
        term.write(data);
      });

      term.onData((data) => {
        newSocket.emit("input", data);
      });

      return () => {
        term.dispose();
        newSocket.disconnect();
      };
    }
  }, [containerId, container]);

  return (<>
  <div>
    {!loading && (
      <Terminal terminalRef={terminalRef} containerId={containerId} />
    )}
  </div>
    
    </>
  );
}



// // <div className="min-h-screen min-w-screen flex flex-col">
// {loading && <Loading />}
// {!loading && (
//   <div className="flex flex-col h-screen">
//     <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
//       <div>
//         <h1 className="text-xl font-bold">Virtual Machine</h1>
//         <p className="text-sm text-muted-foreground">ID: 12345678</p>
//       </div>
//       <div className="flex items-center gap-4">
//         <Button variant="ghost" size="icon">
//           <Settings2Icon className="w-5 h-5" />
//         </Button>
//         <Button variant="ghost" size="icon">
//           <PowerIcon className="w-5 h-5" />
//         </Button>
//       </div>
//     </header>
//     <div>
//       Exposed Port: {container.internalPort} {"->"} {container.externalPort}
//     </div>
//     <main className="flex-1 flex flex-wrap justify-center gap-6 p-6 my-auto h-full align-middle items-center">
//       <div
//         className="bg-zinc-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center w-full sm:w-auto sm:flex-1 h-48"
//         onClick={() => console.log("Opened Terminal")}
//       >
//         <TerminalIcon className="w-8 h-8 mb-2 text-white" />
//         <div>
//           <h2 className="text-2xl font-bold text-center">Terminal</h2>
//           <p className="text-sm text-muted-foreground text-center text-white">
//             Access your virtual machine's terminal
//           </p>
//         </div>
//       </div>
//       <div
//         className="bg-zinc-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center w-full sm:w-auto sm:flex-1 h-48"
//         onClick={() => console.log("Opened VS Code")}
//       >
//         <CodeIcon className="w-8 h-8 mb-2 text-white" />
//         <div>
//           <h2 className="text-2xl font-bold text-center">VS Code</h2>
//           <p className="text-sm text-muted-foreground text-center text-white">
//             Access your virtual machine's VS Code
//           </p>
//         </div>
//       </div>
//       {/* <Terminal terminalRef={terminalRef} containerId={containerId} /> */}
//     </main>
//   </div>
// )}
// </div>