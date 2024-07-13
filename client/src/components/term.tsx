import "xterm/css/xterm.css";

export default function Terminal({
  terminalRef,
  containerId,
}: {
  terminalRef: any;
  containerId: string | null;
}) {
  return (
    <div className="m-10 border border-black p-5 bg-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Terminal</h1>
      <div className="border border-black p-2 bg-white rounded-lg overflow-hidden mb-4">
        <div className="mb-2 font-bold">
          Terminal for container: {containerId}
        </div>
        <div
          ref={terminalRef}
          className="border border-gray-300 p-2 w-full h-96 bg-black text-white"
        />
      </div>
    </div>
  );
}
