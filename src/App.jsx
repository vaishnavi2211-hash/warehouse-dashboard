import { useState } from "react";
import Dashboard from "./Dashboard";

export default function App() {

  const [page, setPage] = useState("home");

  if (page === "dashboard") return <Dashboard />;

  return (
    <div className="h-screen bg-gradient-to-r from-purple-800 to-black text-white flex flex-col items-center justify-center">

      <h1 className="text-4xl font-bold mb-4">
        AI Warehouse Robot 🚀
      </h1>

      <p className="mb-6 text-center max-w-md">
        Autonomous robot system for smart warehouse management.
      </p>

      <button
        onClick={() => setPage("dashboard")}
        className="bg-green-500 px-6 py-3 rounded"
      >
        Enter Dashboard
      </button>

    </div>
  );
}