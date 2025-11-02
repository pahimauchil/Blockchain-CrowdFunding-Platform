import React from "react";
import { thirdweb } from "../assets";
import { daysLeft } from "../utils";

const FundCard = ({
  owner,
  title,
  description,
  target,
  deadline,
  amountCollected,
  image,
  handleClick,
}) => {
  const remainingDays = daysLeft(deadline);
  const isEnded = remainingDays === 0;
  return (
    <div
      className="sm:w-[288px] w-full rounded-[15px] bg-white dark:bg-secondary-dark cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 relative border border-[#1a8b9d]/10 hover:border-[#1a8b9d]/30"
      onClick={handleClick}
    >
      {isEnded && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded z-10 shadow">
          Campaign Ended
        </div>
      )}
      <img
        src={image}
        alt="fund"
        className="w-full h-[158px] object-cover rounded-t-[15px]"
      />
      <div className="flex flex-col p-4">
        <div className="block">
          <h3 className="font-epilogue font-semibold text-[16px] text-[#000000] dark:text-text-dark text-left leading-[26px] truncate">
            {title}
          </h3>
          <p className="mt-[5px] font-epilogue font-normal text-[#000000]/60 dark:text-gray-400 text-left leading-[18px] truncate">
            {description}
          </p>
        </div>
        <div className="flex justify-between flex-wrap mt-[15px] gap-[2]">
          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-text-light dark:text-text-dark leading-[22px]">
              {amountCollected}
            </h4>
            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-gray-600 dark:text-gray-400 sm:max-w-[120px] truncate">
              Raised of {target}
            </p>
          </div>
          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-text-light dark:text-text-dark leading-[22px]">
              {isEnded ? "--" : remainingDays}
            </h4>
            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-gray-600 dark:text-gray-400 sm:max-w-[120px] truncate">
              {isEnded ? "Ended" : "Days Left"}
            </p>
          </div>
        </div>
        <div className="flex items-center mt-[20px] gap-[12px]">
          <div className="w-[30px] h-[30px] rounded-full flex justify-center items-center bg-secondary-light dark:bg-secondary-dark">
            <img
              src={thirdweb}
              alt="user"
              className="w-1/2 h-1/2 object-contain"
            />
          </div>
          <p className="flex-1 font-epilogue font-normal text-[12px] text-gray-600 dark:text-gray-400 truncate">
            by{" "}
            <span className="text-text-light dark:text-text-dark">{owner}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FundCard;
