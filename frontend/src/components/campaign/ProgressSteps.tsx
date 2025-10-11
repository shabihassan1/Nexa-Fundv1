
import React from "react";

interface ProgressStepsProps {
  activeStep: number;
}

const ProgressSteps = ({ activeStep }: ProgressStepsProps) => {
  return (
    <div className="flex justify-between mb-8">
      <div className="flex items-center">
        <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
          activeStep >= 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
        } font-medium`}>1</div>
        <p className={`ml-2 ${activeStep >= 1 ? "text-gray-900" : "text-gray-500"}`}>
          Basics
        </p>
      </div>
      <div className="flex-1 mx-4 flex items-center">
        <div className="h-0.5 w-full bg-gray-200">
          <div className={`h-0.5 bg-green-500`} style={{width: `${activeStep > 1 ? 100 : 0}%`}}></div>
        </div>
      </div>
      <div className="flex items-center">
        <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
          activeStep >= 2 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
        } font-medium`}>2</div>
        <p className={`ml-2 ${activeStep >= 2 ? "text-gray-900" : "text-gray-500"}`}>
          Story
        </p>
      </div>
      <div className="flex-1 mx-4 flex items-center">
        <div className="h-0.5 w-full bg-gray-200">
          <div className={`h-0.5 bg-green-500`} style={{width: `${activeStep > 2 ? 100 : 0}%`}}></div>
        </div>
      </div>
      <div className="flex items-center">
        <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
          activeStep >= 3 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
        } font-medium`}>3</div>
        <p className={`ml-2 ${activeStep >= 3 ? "text-gray-900" : "text-gray-500"}`}>
          Funding
        </p>
      </div>
    </div>
  );
};

export default ProgressSteps;
