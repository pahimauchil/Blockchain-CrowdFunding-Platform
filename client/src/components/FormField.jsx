import React from "react";

const FormField = ({
  labelName,
  placeholder,
  inputType,
  isTextArea,
  value,
  handleChange,
}) => {
  return (
    <label className="flex-1 w-full flex flex-col">
      {labelName && (
        <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#000000] dark:text-[#fff5f5] mb-[10px]">
          {labelName}
        </span>
      )}
      {isTextArea ? (
        <textarea
          required
          value={value}
          onChange={handleChange}
          rows={10}
          placeholder={placeholder}
          className="py-[15px] sm:px-[25px] px-[15px] outline-none border border-[#1a8b9d]/20 dark:border-[#1a8b9d]/20 
          bg-white dark:bg-[#000000] font-epilogue text-[#000000] dark:text-[#fff5f5] text-[14px] 
          placeholder:text-[#000000]/40 dark:placeholder:text-[#fff5f5]/40 rounded-[10px] sm:min-w-[300px]
          focus:ring-2 focus:ring-[#1a8b9d] dark:focus:ring-[#1a8b9d] focus:border-transparent
          transition-colors duration-200"
        />
      ) : (
        <input
          required
          value={value}
          onChange={handleChange}
          type={inputType}
          step="0.1"
          placeholder={placeholder}
          className="py-[15px] sm:px-[25px] px-[15px] outline-none border border-[#1a8b9d]/20 dark:border-[#1a8b9d]/20 
          bg-white dark:bg-[#000000] font-epilogue text-[#000000] dark:text-[#fff5f5] text-[14px] 
          placeholder:text-[#000000]/40 dark:placeholder:text-[#fff5f5]/40 rounded-[10px] sm:min-w-[300px]
          focus:ring-2 focus:ring-[#1a8b9d] dark:focus:ring-[#1a8b9d] focus:border-transparent
          transition-colors duration-200"
        ></input>
      )}
    </label>
  );
};

export default FormField;
