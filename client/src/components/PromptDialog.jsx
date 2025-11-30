import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import FormField from "./FormField";
import CustomButton from "./CustomButton";

const PromptDialog = ({
  isOpen,
  title = "Enter Information",
  message,
  placeholder = "Enter value...",
  onSubmit,
  onCancel,
  submitText = "Submit",
  cancelText = "Cancel",
  required = true,
  minLength = 0,
  defaultValue = "",
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError("");
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (required && !value.trim()) {
      setError("This field is required");
      return;
    }

    if (value.trim().length < minLength) {
      setError(`Minimum length is ${minLength} characters`);
      return;
    }

    onSubmit(value.trim());
    setValue("");
    setError("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <h2 className="font-epilogue font-bold text-xl text-text-light dark:text-text-dark">
            {title}
          </h2>
          {message && (
            <p className="mt-2 font-epilogue font-normal text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          )}
        </div>
        <div>
          <FormField
            labelName=""
            placeholder={placeholder}
            inputType="text"
            value={value}
            handleChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-4 justify-end mt-4">
          <CustomButton
            btnType="button"
            title={cancelText}
            styles="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
            handleClick={onCancel}
          />
          <CustomButton
            btnType="submit"
            title={submitText}
            styles="bg-accent-primary dark:bg-accent-primary text-white hover:bg-accent-hover-primary"
          />
        </div>
      </form>
    </Modal>
  );
};

export default PromptDialog;

