import React, { useState } from "react";
import localSvgLogo from "../assets/amtmp-logo.svg";

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const PRIMARY_LOGO_URL = "https://i.postimg.cc/PxSyksdt/ATP-logo.jpg";

export const Logo: React.FC<LogoProps> = ({ size = 56, style }) => {
  const [imgSrc, setImgSrc] = useState<string>(PRIMARY_LOGO_URL);

  const handleError = () => {
    // If the remote URL fails or is blocked, switch seamlessly to the local vector crest
    if (imgSrc !== localSvgLogo) {
      setImgSrc(localSvgLogo);
    }
  };

  return (
    <img
      src={imgSrc}
      alt="Association of Medical and Traditional Medicine Practitioners (AMTMP)"
      onError={handleError}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        borderRadius: "6px",
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
