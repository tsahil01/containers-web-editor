import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import "xterm/css/xterm.css";

export default function Terminal({
  containerId,
}: {
  containerId: string | null;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      window.addEventListener('resize', resizeTerminal);

      let newSocket = io("http://localhost:4000");
      newSocket.on("connect", () => {
        newSocket.emit("containerId", containerId);
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
        window.removeEventListener('resize', resizeTerminal);
      };
    }
  }, [containerId]);

  if (!containerId) return <div>Please provide a container ID.</div>;

  return (
    <div className="m-10 border border-black p-10 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Terminal</h1>
      <div className="border border-black p-2 bg-white rounded-lg overflow-hidden">
        <div className="mb-2 font-bold">Terminal for container: {containerId}</div>
        <div ref={terminalRef} style={{color: "green"}} className="border border-gray-300 p-2 w-full h-96 bg-black text-green-500 text-bold rounded-md overflow-hidden" />
      </div>
    </div>
  );
}
