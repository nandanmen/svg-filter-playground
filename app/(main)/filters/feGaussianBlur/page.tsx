import { BlurIcon } from "@/app/components/icons";
import Link from "next/link";

export default function Page() {
  return (
    <div className="p-4 h-full">
      <article className="p-4 bg-gray1 rounded-xl border border-gray4 shadow-sm h-full space-y-4">
        <header className="flex items-center gap-2">
          <BlurIcon />
          <h1 className="font-medium">feGaussianBlur</h1>
          <Link className="ml-auto" href="/">
            x
          </Link>
        </header>
        <p>
          The feGaussianBlur SVG filter is used to apply a Gaussian blur effect
          to an input image or graphic element within SVG (Scalable Vector
          Graphics). This filter is part of the SVG filter effects suite, which
          provides various ways to manipulate and style SVG content.
        </p>
        <p>
          This specific filter uses a mathematical function called a Gaussian
          function to blur the image. The Gaussian function creates a smooth,
          bell-shaped curve that determines how the image will be blurred. The
          effect is similar to viewing the image through a translucent screen.
        </p>
        <p>
          This is the primary attribute of the feGaussianBlur filter. It defines
          the standard deviation for the Gaussian blur operation. Essentially,
          it determines the amount of blur. A higher value results in a more
          pronounced blur effect. You can specify one value for both the x and y
          directions or two values to blur differently along each axis (e.g.,
          stdDeviation="5 10").
        </p>
      </article>
    </div>
  );
}
