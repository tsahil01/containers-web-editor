"use client"

import { containerState } from "@/atom/container";
import Terminal from "@/components/term";
import { fetchNewContainer } from "@/lib/containerFetch";
import { useRouter } from "next/navigation";
import { RecoilRoot, useRecoilState, useSetRecoilState } from "recoil";


export default function Page() {
  const setContainer = useSetRecoilState(containerState);
  const router = useRouter();

  const startNewContainer = async () => {
    console.log("Starting New Container");

    const containerData = await fetchNewContainer();
    setContainer(containerData);
    console.log("Container:", containerData);
    
    const containerId = containerData.containerId;

    router.push(`/playground?containerId=${containerId}`);
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
      </div>
    </div>
  );
}

