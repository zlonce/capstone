//Step2 - 학과 선택 단계
import React, { useState, useEffect } from "react";
import "./Step2.css";
import collegesAndDepartments from "./Department"; //학과 데이터

const Step2Department = ({
  formData,
  updateFormData,
  goToNextStep,
  goToPrevStep,
}) => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [step, setStep] = useState(0);

  // 현재 선택된 학과의 단과대학 찾기
  useEffect(() => {
    if (formData.department) {
      for (const college of collegesAndDepartments) {
        const dept = college.departments.find(
          (d) => d.value === formData.department
        );
        if (dept) {
          setSelectedCollege(college);
          setStep(1);
          return;
        }
      }
    }
  }, [formData.department]);

  const handleCollegeSelect = (college) => {
    setSelectedCollege(college);
    setStep(1);
  };

  const handleDepartmentSelect = (dept) => {
    updateFormData({
      department: dept.value,
      departmentLabel: dept.label,
    });
  };

  const handleBack = () => {
    setStep(0);
    setSelectedCollege(null);
  };

  // 다음 단계로 진행하기 전 유효성 검사
  const handleNext = () => {
    if (!formData.department) {
      alert("학과를 선택해주세요.");
      return;
    }
    goToNextStep();
  };

  return (
    <div className="step-container">
      <h2 className="step-title">Step 2: 학과 선택</h2>

      {/* 학과 선택기 직접 통합 */}
      <div className="step-section">
        <div className="department-container">
          {step === 0 ? (
            <div>
              <h3 className="department-section-title">단과대학 선택</h3>
              <div className="college-list">
                {collegesAndDepartments.map((college) => (
                  <button
                    key={college.id}
                    className="college-button"
                    onClick={() => handleCollegeSelect(college)}
                  >
                    <span>{college.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="college-icon"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                className="back-button"
                onClick={handleBack}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="back-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                단과대학 선택으로 돌아가기
              </button>

              <h3 className="department-section-title">
                {selectedCollege?.name} - 학과 선택
              </h3>

              <div className="department-list">
                {selectedCollege?.departments.map((dept) => (
                  <button
                    key={dept.value}
                    type="button"
                    className={`department-button ${
                      formData.department === dept.value
                        ? "department-button-selected"
                        : "department-button-unselected"
                    }`}
                    onClick={() => handleDepartmentSelect(dept)}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 이전/다음 단계 버튼 */}
      <div className="navigation-buttons">
        <button type="button" onClick={goToPrevStep} className="prev-button">
          이전 단계
        </button>
        <button type="button" onClick={handleNext} className="next-button">
          다음 단계
        </button>
      </div>
    </div>
  );
};

export default Step2Department;
