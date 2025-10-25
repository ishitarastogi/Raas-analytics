import React from "react";
export default function Footer(){
  return (
    <footer className="footer">
      <div className="container" style={{ fontSize: 13 }}>
        Powered by Blockscout APIs • © {new Date().getFullYear()} RollUpAndDown
      </div>
    </footer>
  );
}
