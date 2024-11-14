import { useState } from "react";
import { BlendIcon, BlurIcon, ColorMatrixIcon, QuestionMark } from "./icons";
import Link from "next/link";

const mapFilterTypeToDescription: Record<
  string,
  {
    description: string;
    icon: React.ReactNode;
  }
> = {
  feGaussianBlur: {
    description: "Blur the image",
    icon: <BlurIcon />,
  },
  feColorMatrix: {
    description: "Change color",
    icon: <ColorMatrixIcon />,
  },
  feBlend: {
    description: "Mix two images",
    icon: <BlendIcon />,
  },
};

export function Filter({ filter }: { filter: any }) {
  const validKeys = Object.entries(filter.properties).filter(([key]) => {
    return !["in", "in2", "result"].includes(key);
  });
  const current = mapFilterTypeToDescription[filter.type];
  return (
    <li className="bg-gray1 border rounded-xl border-gray4 text-sm overflow-hidden divide-y divide-gray4 relative shadow-sm">
      <Link
        href={`/filters/${filter.type}`}
        className={`h-10 px-2.5 flex items-center w-full gap-2`}
      >
        {current?.icon}
        <span className="font-medium">{filter.type}</span>
        <span className="text-gray11">{current?.description}</span>
        <span className="ml-auto text-gray11">
          <QuestionMark />
        </span>
      </Link>
      {/* {validKeys.length > 0 && (
        <div className="p-4">
          <ul className="space-y-2">
            {validKeys.map(([key, value]) => {
              return (
                <li className="flex justify-between" key={key}>
                  <span className="font-medium capitalize">{key}</span>
                  <span>{value as string}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )} */}
    </li>
  );
}
