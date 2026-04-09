import React from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * SafeImage Component
 * 
 * A robust image delivery component that prioritizes modern WebP formats
 * but gracefully falls back to legacy formats (PNG/JPG).
 * 
 * It uses the <picture> tag to provide the browser with multiple options.
 */
export const SafeImage = ({
  src,
  alt,
  className,
  priority = false,
  ...props
}: SafeImageProps) => {
  // Determine the base path and possible formats
  const lastDotIndex = src.lastIndexOf(".");
  const basePath = lastDotIndex !== -1 ? src.substring(0, lastDotIndex) : src;
  
  // We assume a .webp version might exist or will be generated in the future
  const webpSrc = `${basePath}.webp`;

  return (
    <picture className={cn("inline-block", className)}>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full object-cover", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...props}
      />
    </picture>
  );
};
