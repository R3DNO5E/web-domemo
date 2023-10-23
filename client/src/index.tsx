import React from "react";
import {createRoot} from "react-dom/client";
import {App} from "./app";
import * as styles from "./main.css";

createRoot(document.getElementById("app-root")).render(<div>

        <App urlParams={Object.fromEntries((new URL(location.href)).searchParams.entries())}/>
    </div>
);

console.log(styles)