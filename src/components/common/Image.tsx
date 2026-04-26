"use client";

import NextImage, { ImageProps as NextImageProps } from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/placeholder.png";

function getFileUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const endpoint = process.env.NEXT_PUBLIC_ERXES_ENDPOINT || "";
  const apiDomain = endpoint.replace(/\/gateway\/graphql$/, "");
  return apiDomain ? `${apiDomain}/read-file?key=${url}` : url;
}

type ImageProps = Omit<NextImageProps, "src"> & {
  src?: string | null;
  fallback?: string;
};

export default function Image({
  src,
  fallback = PLACEHOLDER,
  alt = "",
  ...props
}: ImageProps) {
  const resolved = getFileUrl(src || "") || fallback;
  const [imgSrc, setImgSrc] = useState(resolved);

  return (
    <NextImage
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallback)}
    />
  );
}
