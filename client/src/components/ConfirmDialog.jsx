import React from "react";
import Modal from "./Modal";
import CustomButton from "./CustomButton";

const ConfirmDialog = ({
  isOpen,
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  isDanger = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-epilogue font-bold text-xl text-text-light dark:text-text-dark">
            {title}
          </h2>
        </div>
        <div>
          <p className="font-epilogue font-normal text-base text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
        <div className="flex gap-4 justify-end mt-4">
          <CustomButton
            btnType="button"
            title={cancelText}
            styles="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500"
            handleClick={onCancel}
          />
          <CustomButton
            btnType="button"
            title={confirmText}
            styles={
              isDanger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-accent-primary dark:bg-accent-primary text-white hover:bg-accent-hover-primary"
            }
            handleClick={onConfirm}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

