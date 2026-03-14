import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "6px",
          color: "white",
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
        }}
      >
        PA
      </div>
    ),
    { ...size }
  );
}
