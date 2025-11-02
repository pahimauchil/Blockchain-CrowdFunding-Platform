import React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useStateContext } from "../context";
import { CustomButton, CountBox, Loader } from "../components";
import { calculateBarPercentage, daysLeft } from "../utils";
import { thirdweb } from "../assets";

const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { donate, getDonations, contract, address } = useStateContext();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [donators, setDonators] = useState([]);
  const remainingDays = daysLeft(state.deadline);

  const fetchDonators = async () => {
    const data = await getDonations(state.pId);
    setDonators(data);
  };
  useEffect(() => {
    if (contract) fetchDonators();
  }, [contract, address]);

  const handleDonate = async () => {
    setIsLoading(true);
    await donate(state.pId, amount);
    navigate("/");
    setIsLoading(false);
  };

  return (
    <div>
      {isLoading && <Loader />}
      <div className="w=full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={state.image}
            alt="campaign"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          <div className="relative w-full h-[5px] bg-secondary-light dark:bg-secondary-dark mt-2">
            <div
              className="absolute h-full bg-accent-primary dark:bg-accent-secondary"
              style={{
                width: `${calculateBarPercentage(
                  state.target,
                  state.amountCollected
                )}%`,
                maxWidth: "100%",
              }}
            ></div>
          </div>
        </div>
        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox
            title={`Raised of ${state.target}`}
            value={state.amountCollected}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>
      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Creator
            </h4>
            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-secondary-light dark:bg-secondary-dark cursor-pointer transition-colors duration-200">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-text-light dark:text-text-dark break-all transition-colors duration-200">
                  {state.owner}
                </h4>
                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  10 Campaigns
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-text-light dark:text-text-dark uppercase transition-colors duration-200">
              Story
            </h4>
            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-gray-600 dark:text-gray-400 leading-[26px] text-justify transition-colors duration-200">
                {state.description}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Donators
            </h4>
            <div className="mt-[20px] flex flex-col gap-4">
              {donators.length > 0 ? (
                donators.map((item, index) => (
                  <div
                    key={`${item.donator} - ${index}`}
                    className="flex justify-between items-center gap-4"
                  >
                    <p className="font-epilogue font-normal text-[16px] text-text-light dark:text-text-dark leading-[26px] break-ll transition-colors duration-200">
                      {index + 1}. {item.donator}
                    </p>
                    <p className="font-epilogue font-normal text-[16px] text-gray-600 dark:text-gray-400 leading-[26px] break-ll transition-colors duration-200">
                      {item.donation}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                  No donators yet. Be the first one!
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
            Fund
          </h4>
          <div className="mt-[20px] flex flex-col p-4 bg-secondary-light dark:bg-secondary-dark rounded-[10px] transition-colors duration-200">
            <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-text-light dark:text-text-dark transition-colors duration-200">
              Fund the Campaign
            </p>
            <div className="mt-[30px]">
              <input
                type="number"
                placeholder="ETH 0.1"
                step="0.01"
                className="w-full py-[10px] sm:px-[20px] px-[15px] outline-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-darkBg font-epilogue text-text-light dark:text-text-dark text-[18px] leading-[30px] placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-[10px] transition-colors duration-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="my-[20px] p-4 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-[10px] transition-colors duration-200">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-text-light dark:text-text-dark transition-colors duration-200">
                  Be part of something meaningful.
                </h4>
                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  Back campaigns that resonate with you, just because they
                  matter.
                </p>
              </div>
              <CustomButton
                btnType="button"
                title="Fund Campaign"
                styles="w-full bg-accent-primary hover:bg-accent-hover-primary dark:bg-accent-secondary dark:hover:bg-accent-hover-secondary transition-colors duration-200"
                handleClick={handleDonate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
