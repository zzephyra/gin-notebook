/* eslint-disable react */
import ReactDOM from "react-dom/client";
import "@/styles/globals.css";
import App from "./App.tsx";
import { store } from "./store/index.ts";
import { Provider } from 'react-redux'

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
