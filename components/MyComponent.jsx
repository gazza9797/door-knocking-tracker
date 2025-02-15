import React, { useState } from "react";

function MyComponent(props) {
  console.log("MyComponent rendered with props:", props);
  const [count, setCount] = useState(0);

  if (props.showCount) {
    return <div>Count: {count}</div>;
  }
  return <div>No count</div>;
}

export default MyComponent;
