import React from 'react';
import { NavLink } from "react-router-dom";

const DashboardSongs =() => {
  return (
    <div className="w-full h-[480px] p-4 flex flex-col items-center justify-center" >
      <div className="flex w-full items-center justify-center gap-20">
          <NavLink to={"dashboard/NewSong"}>
            <div className="card" style={{width: "18rem"}}>
              <img src="https://dummyimage.com/180x120/dbdbdb/787878.png&text=Image+cap" className="card-img-top" alt="..."/>
              <div className="card-body">
                <h5 className="card-title">Card title</h5>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" className="btn btn-primary">Go somewhere</a>
              </div>
            </div>
          </NavLink>
      </div>

    </div>
  )
}

export default DashboardSongs