import React from "react";
import "./App.css";
import {Route, Routes} from "react-router-dom";
import {Home, Login} from "./components";

const App = () => { 
  return (
    <>
    <div className="bg-primary w-screen h-screen justify-center flex items-center">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
    
      <h1 class="text-3xl font-bold underline">Hello world!</h1>
    </>
  );
}

export default App;
