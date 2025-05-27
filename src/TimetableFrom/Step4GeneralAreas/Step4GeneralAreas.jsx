// Step4- 교양 영역 선택 단계
import "./Step4.css";

const Step4GeneralAreas = ({
  formData,
  updateFormData,
  goToPrevStep,
  handleSubmit,
  isLoading,
}) => {
  // 교양 영역 데이터
  const generalAreas = [
    { id: "literature", name: "문학과예술" },
    { id: "society", name: "사회와문화" },
    { id: "global", name: "글로벌리더십" },
    { id: "science", name: "과학과기술" },
    { id: "career", name: "진로탐색/자기계발/창업" },
    { id: "philosophy", name: "철학과역사" },
    { id: "remote", name: "원격 강의 희망" },
  ];

  // 교양학점에 따른 최대 선택 가능한 영역 수 계산
  const getMaxSelectableAreas = (credits) => {
    return Math.min(Math.floor(Number(credits) / 3), 6);
  };

  // 교양 영역 처리 함수
  const handleGeneralAreaToggle = (areaId) => {
    const maxAreas = getMaxSelectableAreas(formData.generalCredits);
    const isSelected = formData.generalAreas.includes(areaId);

    // 원격 강의 희망은 다른 영역과 독립적으로 선택 가능
    if (areaId === "remote") {
      updateFormData({
        generalAreas: isSelected
          ? formData.generalAreas.filter((id) => id !== "remote")
          : [
              ...formData.generalAreas.filter((id) => id !== "remote"),
              "remote",
            ],
      });
      return;
    }

    // 이미 선택된 경우는 항상 제거 가능
    if (isSelected) {
      updateFormData({
        generalAreas: formData.generalAreas.filter((id) => id !== areaId),
      });
      return;
    }

    // 새로 선택하는 경우, 최대 선택 가능 개수 확인
    if (
      formData.generalAreas.filter((id) => id !== "remote").length >= maxAreas
    ) {
      alert(
        `교양 ${formData.generalCredits}학점은 최대 ${maxAreas}개 영역까지 선택 가능합니다.`
      );
      return;
    }

    updateFormData({
      generalAreas: [...formData.generalAreas, areaId],
    });
  };

  // 교양 영역 선택 여부 확인 함수
  const isGeneralAreaSelected = (areaId) => {
    return formData.generalAreas.includes(areaId);
  };

  // 제출 전 유효성 검사
  const validateAndSubmit = () => {
    // 교양 학점이 있는데 영역을 선택하지 않은 경우
    if (formData.generalCredits !== "0" && formData.generalAreas.length === 0) {
      alert("교양 학점을 선택했다면 최소 1개 이상의 교양 영역을 선택해주세요.");
      return;
    }
    if (
      formData.generalAreas.length === 1 &&
      formData.generalAreas.includes("remote")
    ) {
      alert("원격으로 듣고 싶은 교양 분야를 선택해주세요.");
      return;
    }

    handleSubmit();
  };

  return (
    <div className="step-container">
      <h2 className="step-title">Step 4: 교양 영역 선택</h2>

      {/* 교양 영역 선택 */}
      <div className="step-section">
        <label className="step-label">
          교양 영역 선택 (선택된 교양학점: {formData.generalCredits}학점)
        </label>
        <p className="areas-info">
          최대 {getMaxSelectableAreas(formData.generalCredits)}개 영역을 선택할
          수 있습니다. (원격 강의 희망은 별도)
        </p>
        <div className="areas-grid">
          {generalAreas.map((area) => (
            <button
              key={area.id}
              type="button"
              className={`area-button ${
                isGeneralAreaSelected(area.id)
                  ? "area-button-selected"
                  : "area-button-unselected"
              }`}
              onClick={() => handleGeneralAreaToggle(area.id)}
            >
              <div
                className={`checkbox ${
                  isGeneralAreaSelected(area.id)
                    ? "checkbox-selected"
                    : "checkbox-unselected"
                }`}
              >
                {isGeneralAreaSelected(area.id) && (
                  <svg
                    className="checkbox-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="area-name">{area.name}</span>
              {area.id === "remote" && <span className="tag">별도 선택</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 이전/제출 버튼 */}
      <div className="navigation-buttons">
        <button
          type="button"
          onClick={goToPrevStep}
          className={`prev-button ${isLoading ? "loading-indicator" : ""}`}
          disabled={isLoading}
        >
          이전 단계
        </button>
        <button
          type="button"
          onClick={validateAndSubmit}
          className={`next-button submit-button ${
            isLoading ? "loading-indicator" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "처리 중..." : "시간표 추천"}
        </button>
      </div>
    </div>
  );
};

export default Step4GeneralAreas;
