import React from "react";
import { createPortal } from "react-dom";

import { loader } from "../assets";

const Loader = () => {
  return createPortal(
    <div className="fixed inset-0 z-[9998] h-screen bg-[rgba(0,0,0,0.7)] flex items-center justify-center flex-col">
      <img
        src={loader}
        alt="loader"
        className="w-[100px] h-[100px] object-contain"
      />
      <p className="mt-[20px] font-epilogue font-bold text-[20px] text-white text-center">
        Transaction is in progress <br /> Please wait...
      </p>
    </div>,
    document.body
  );
};

export default Loader;
