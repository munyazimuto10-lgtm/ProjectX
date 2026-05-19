// Import React's createRoot method for mounting React applications to the DOM
import { createRoot } from "react-dom/client";
// Import the main App component
import App from "./app/App";
// Import global CSS styles
import "./styles/index.css";

// Get the root DOM element by ID and create a React root
createRoot(document.getElementById("root")!).render(
  // Render the main App component into the React root
  <App />,
);
