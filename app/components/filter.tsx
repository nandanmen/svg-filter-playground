import { useState } from "react";

const mapFilterTypeToDescription: Record<string, string> = {
  feGaussianBlur: "Blur the image",
  feColorMatrix: "Change color",
  feBlend: "Mix two images",
};

export function Filter({ filter }: { filter: any }) {
  const [open, setOpen] = useState(false);

  const validKeys = Object.entries(filter.properties).filter(([key]) => {
    return !["in", "in2", "result"].includes(key);
  });
  const isClickable = validKeys.length > 0;

  return (
    <li className="border rounded-[20px] border-gray4 text-sm overflow-hidden divide-y divide-gray4">
      <button
        className={`h-10 pr-2.5 pl-1 flex items-center w-full ${isClickable ? "hover:bg-gray3" : "cursor-default"}`}
        onClick={() => isClickable && setOpen(!open)}
      >
        <div className="h-full p-1">
          <svg viewBox="0 0 100 100" height="100%">
            <g filter="url(#filter)" fill="green">
              <circle cx="35" cy="35" r="20" />
              <circle cx="65" cy="65" r="20" />
            </g>
          </svg>
        </div>
        <span className="font-medium mr-2">{filter.type}</span>
        <span className="text-gray11 text-xs">
          {mapFilterTypeToDescription[filter.type]}
        </span>
        <span className="ml-auto text-gray11">
          <svg
            width="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="8" fill="currentColor" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 9C11.6227 9 11.2926 9.2086 11.1215 9.52152C10.8565 10.0061 10.2488 10.184 9.76427 9.91899C9.27973 9.65396 9.10178 9.04632 9.3668 8.56178C9.87463 7.63331 10.8626 7 12 7C13.5148 7 14.5669 8.00643 14.8664 9.189C15.1676 10.3779 14.7101 11.763 13.3416 12.4472C13.1323 12.5519 13 12.7659 13 13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13C11 12.0084 11.5603 11.1018 12.4472 10.6584C12.902 10.431 13.0188 10.0397 12.9277 9.6801C12.835 9.31417 12.5283 9 12 9ZM12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z"
              className="fill-gray3 group-hover:fill-gray5"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="p-4 bg-gray2">
          <ul>
            {validKeys.map(([key, value]) => (
              <li key={key}>
                <span className="font-medium">{key}</span>
                <span className="text-gray11">{value as string}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
