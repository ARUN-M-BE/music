import React from 'react'
import Header from './Header'

function Dashboard() {
  return (
    <>
      <div className="w-full h-auto bg-primary flex flex-col items-center justify-center">
        <Header/>

        <div className="w-[60%] bg-blue-500 my-2 p-4 flex items-center justify-evenly"></div>
      </div>
    </>
  )
}

export default Dashboard