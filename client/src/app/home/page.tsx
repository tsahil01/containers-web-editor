"use client";

import { containerState } from "@/atom/container";
import { LaunchCard } from "@/components/launch-card";
import { fetchNewContainer } from "@/lib/containerFetch";
import { useRouter } from "next/navigation";
import { useSetRecoilState } from "recoil";

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

  //   return (
  //     <div>
  //       <div className="p-9 mx-auto">
  //         <button
  //           className="p-2 rounded-md bg-slate-500"
  //           onClick={startNewContainer}
  //         >
  //           Start New Container
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="w-full h-full p-10">
        <div className="grid grid-cols-5 gap-4">
          <LaunchCard
            startNewContainer={startNewContainer}
            image="https://imageio.forbes.com/blogs-images/jasonevangelho/files/2018/07/ubuntu-logo.jpg?format=jpg&height=900&width=1600&fit=bounds"
            title="Ubuntu 24.0"
            description="An ubuntu Image"
          />
        </div>
      </div>
    </>
  );
}
