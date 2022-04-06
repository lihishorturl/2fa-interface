import React from "react";
import { Route, Routes } from "react-router-dom";
import Service from './Service';
import Landing from './Landing';
import Main from './Main';

function App() {

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="tc" element={<Landing />} />
        <Route path="app" element={<Service />} />
      </Routes>
    </div>
  );
}

export default App;
