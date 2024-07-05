import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Terminal as XTerminal } from "xterm";
import "xterm/css/xterm.css";

export default function Terminal({
  containerId,
}: {
  containerId: string | null;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerId && terminalRef.current) {
      const term = new XTerminal();
      term.open(terminalRef.current);

      let newSocket = io("http://localhost:4000");
      newSocket.on("connect", () => {
        newSocket.emit("containerId", containerId);
      });

      newSocket.on("output", (data: string) => {
        term.write(data);
      });

      term.onData((data) => {
        console.log("input sent: ", data);
        newSocket.emit("input", data);
      });

      return () => {
        term.dispose();
        newSocket.disconnect();
      };
    }
  }, [containerId]);

  if (!containerId) return <div>Please provide a container ID.</div>;

  return (
    <div className="m-10 border border-black p-10">
      <h1 className="text-2xl font-bold">Terminal</h1>
      <div className="border border-black p-2">
        <div>Terminal for container: {containerId}</div>
        <div ref={terminalRef} style={{ width: '100%', height: '400px' }} />
      </div>
    </div>
  );
}
