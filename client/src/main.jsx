import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains";
import { StateContextProvider } from "./context";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ThirdwebProvider
    activeChain={Sepolia}
    clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
  >
    <BrowserRouter basename={import.meta.env.BASE_URL || "/"}>
      <StateContextProvider>
        <App />
      </StateContextProvider>
    </BrowserRouter>
  </ThirdwebProvider>
);