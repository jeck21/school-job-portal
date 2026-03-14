import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a5c2e",
          borderRadius: "32px",
          color: "white",
          fontSize: "90px",
          fontWeight: 700,
          letterSpacing: "-2px",
        }}
      >
        PA
      </div>
    ),
    { ...size }
  );
}
