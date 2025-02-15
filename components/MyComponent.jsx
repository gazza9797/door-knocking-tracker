"use client";

export default function MyComponent({ showCount }) {
  return (
    <div>
      <p style={{ color: "white" }}>
        {showCount ? "Component is loaded!" : ""}
      </p>
    </div>
  );
}
