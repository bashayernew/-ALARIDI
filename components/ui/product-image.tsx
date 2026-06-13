"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "onError" | "alt"> & {
  /** Product name, shown as text when the image fails to load. */
  alt: string;
  /** Extra classes for the text-fallback container. */
  fallbackClassName?: string;
  /** Extra classes for the fallback text. */
  fallbackTextClassName?: string;
};

/**
 * next/image wrapper that renders the product name as styled text when the
 * image is missing or fails to load — matching the menu card behaviour.
 */
export function ProductImage({
  alt,
  fallbackClassName,
  fallbackTextClassName,
  ...imageProps
}: Props) {
  const [imgErr, setImgErr] = React.useState(false);

  if (imgErr || !imageProps.src) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-accent via-card to-background p-3 text-center",
          fallbackClassName
        )}
      >
        <span
          className={cn(
            "font-heading text-sm leading-tight text-primary/90 line-clamp-4",
            fallbackTextClassName
          )}
        >
          {alt}
        </span>
      </div>
    );
  }

  return <Image alt={alt} onError={() => setImgErr(true)} {...imageProps} />;
}
