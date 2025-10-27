import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar from "./components/Navbar";
import Home from "./pages/Home.jsx"; // keep your existing Home page
import BattleOfChains from "./pages/BattleOfChains.jsx";
import RaasBingo from "./pages/RaasBingo.jsx"; // the fun page we added

export const ProviderFilterContext = React.createContext({
  selectedRaas: "all",
  setSelectedRaas: () => {},
});

export default function App() {
  const [selectedRaas, setSelectedRaas] = useState("all");

  return (
    <ProviderFilterContext.Provider value={{ selectedRaas, setSelectedRaas }}>
      <BrowserRouter>
        <NavBar selectedRaas={selectedRaas} onChange={setSelectedRaas} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/battle" element={<BattleOfChains />} />
          <Route path="/bingo" element={<RaasBingo />} />
        </Routes>
      </BrowserRouter>
    </ProviderFilterContext.Provider>
  );
}
