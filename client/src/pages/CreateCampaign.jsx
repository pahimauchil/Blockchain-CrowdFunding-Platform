import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { money } from "../assets";
import { CustomButton, FormField, Loader } from "../components";
import { checkIfImage } from "../utils";
import { useStateContext } from "../context";
import { useNotification } from "../context/NotificationContext";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createCampaign, ensureBackendSession } = useStateContext();
  const { showError, showSuccess } = useNotification();
  const initialFormState = {
    name: "",
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  };
  const [form, setForm] = useState(initialFormState);
  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await ensureBackendSession();
    } catch (error) {
      showError(error.message || "Please reconnect your wallet to continue.");
      return;
    }

    checkIfImage(form.image, async (exists) => {
      if (!exists) {
        showError("Provide valid image URL");
        setForm({ ...form, image: "" });
        return;
      }

      try {
        setIsLoading(true);
        const response = await createCampaign(form);
        showSuccess(
          response?.message ||
            "Campaign submitted for review! Admins will review it shortly."
        );
        setForm(initialFormState);
        navigate("/profile");
      } catch (error) {
        showError(error.message || "Failed to submit campaign");
      } finally {
        setIsLoading(false);
      }
    });
  };
  return (
    <div className="bg-[#fff5f5] dark:bg-[#000000] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4 shadow-md">
      {isLoading && <Loader />}
      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-white/50 dark:bg-[#1a8b9d]/10 backdrop-blur-sm rounded-[10px] shadow-sm">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-[#000000] dark:text-[#fff5f5]">
          Start a Campaign
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full mt-[65px] flex flex-col gap-[30px]"
      >
        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Your Name *"
            placeholder="Jhon Doe"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange("name", e)}
          />
          <FormField
            labelName="Campaign Title *"
            placeholder="Write a Title"
            inputType="text"
            value={form.title}
            handleChange={(e) => handleFormFieldChange("title", e)}
          />
        </div>
        <FormField
          labelName="Story *"
          placeholder="Write you story"
          isTextArea
          value={form.description}
          handleChange={(e) => handleFormFieldChange("description", e)}
        />
        <div className="w-full flex justify-start items-center p-4 bg-[#1a8b9d] dark:bg-[#1a8b9d] h-[120px] rounded-[10px] shadow-md">
          <img
            src={money}
            alt="money"
            className="w-[40px] h-[40px] object-contain"
          />
          <h4 className="font-epilogue font-bold text-[25px] text-[#fff5f5] ml-[20px] dark:text-[#fff5f5]">
            You will get 100% of the raised amount
          </h4>
        </div>
        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Goal *"
            placeholder="Eth 0.50"
            inputType="text"
            value={form.target}
            handleChange={(e) => handleFormFieldChange("target", e)}
          />
          <FormField
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e) => handleFormFieldChange("deadline", e)}
          />
        </div>
        <FormField
          labelName="Campaign Image *"
          placeholder="Place image URL of your campaign"
          inputType="url"
          value={form.image}
          handleChange={(e) => handleFormFieldChange("image", e)}
        />

        <div className="flex justify-center items-center mt-[40px]">
          <CustomButton
            btnType="submit"
            title="Submit new campaign"
            styles="bg-[#b2d430] dark:bg-[#b2d430] text-[#000000] hover:bg-[#b2d430]/90 dark:hover:bg-[#b2d430]/90"
          />
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
