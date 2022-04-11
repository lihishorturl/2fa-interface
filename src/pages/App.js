import React from "react";
import { Route, Routes } from "react-router-dom";
import Service from './Service';
import Landing from './Landing';
import Main from './Main';

function App() {

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Service />} />
        <Route path="lp_ch" element={<Landing />} />
        <Route path="lp_en" element={<Main />} />
      </Routes>
    </div>
  );
}

export default App;
