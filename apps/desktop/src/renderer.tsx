import { createRoot } from "react-dom/client";

import { brandName } from "@vierify/ui";

function App() {
  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 32 }}>
      <h1>{brandName} Merchant</h1>
      <p>Desktop shell scaffold. Shared MerchantApp flows start in T08.</p>
    </main>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Desktop root element is missing.");
}

createRoot(root).render(<App />);
