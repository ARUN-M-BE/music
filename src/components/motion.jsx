import React from "react";
import { motion } from "motion/react";
import Motion from "./component/motion";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

const App = () => {
  const [isOpen, setOpen] = React.useState(false);

  const handleToggle = () => {
    setOpen(!isOpen);
  };
  return (
    <>
      <h1>welcome</h1>
      <div>
        <button onClick={handleToggle}>Toggle</button>
        {isOpen && <div>Content</div>}
      </div>
      <h1 className="text-7xl font-bold underline">welcome</h1>
      <Motion />
      <Stack spacing={2} direction="row">
        <Button variant="text">Text</Button>
        <Button variant="contained">Contained</Button>
        <Button variant="outlined">Outlined</Button>
      </Stack>
    </>
  );
};

export default App;