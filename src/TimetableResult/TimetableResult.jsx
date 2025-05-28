import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { runIntro } from "../Tutorial/RunIntro";
import { resultSteps } from "../Tutorial/TutorialStep";
import "./TimetableResult.css";
import axios from "axios";

// API URL 설정
const API_URL = "https://kmutime.duckdns.org/api/timetable";

// 색상 배열을 전역으로 정의
const COLORS = [
  "#727497",
  "#83b6b3",
  "#e1a473",
  "#8dc7a5",
  "#b09adc",
  "#df8d8d",
  "#808ece",
  "#d8bf8d",
];

// 시간을 교시로 변환하는 함수
const convertTimeToPeroid = (timeString) => {
  // 원격 강의나 특수 시간 처리
  if (timeString === "00:00" || !timeString) {
    return 1; // 원격 강의는 교시가 의미 없음
  }

  const time = timeString.split(":").map(Number);
  const hour = time[0];
  const minute = time[1];
  const totalMinutes = hour * 60 + minute;

  // 교시 시간 범위 정의
  const periods = [
    { start: 540, end: 615, period: 1 }, // 09:00 ~ 10:15
    { start: 630, end: 705, period: 2 }, // 10:30 ~ 11:45
    { start: 720, end: 795, period: 3 }, // 12:00 ~ 13:15
    { start: 810, end: 885, period: 4 }, // 13:30 ~ 14:45
    { start: 900, end: 975, period: 5 }, // 15:00 ~ 16:15
    { start: 975, end: 1065, period: 6 }, // 16:15 ~ 17:45
  ];

  // 해당하는 교시 찾기
  const foundPeriod = periods.find(
    (p) => totalMinutes >= p.start && totalMinutes <= p.end
  );

  console.log("시간 변환:", {
    입력시간: timeString,
    분단위: totalMinutes,
    교시: foundPeriod?.period || 1,
  });

  return foundPeriod ? foundPeriod.period : 1;
};

// 서버 응답 데이터를 앱 형식으로 변환하는 함수
const transformServerData = (serverResponse) => {
  if (!serverResponse || !serverResponse.data) {
    console.warn("서버 응답에 데이터가 없습니다");
    return { schedule: [], remoteClasses: [] };
  }

  const { offline, online } = serverResponse.data;
  const schedule = [];
  const remoteClasses = [];

  // 강의 데이터 변환 공통 함수
  const transformCourse = (course, type, isRemote = false) => {
    if (isRemote) {
      return {
        id: `remote-${type}-${course.code}`,
        name: course.name,
        professor: course.professor,
        type: type,
        area: course.area,
        credits: course.credit,
        note: course.note || "",
        color: COLORS[remoteClasses.length % COLORS.length],
      };
    } else {
      return course.time_json.map((timeSlot) => ({
        id: `${type}-${course.code}-${timeSlot.day}`,
        name: course.name,
        professor: course.professor,
        type: type,
        area: course.area,
        day: timeSlot.day,
        startPeriod: convertTimeToPeroid(timeSlot.start),
        endPeriod: convertTimeToPeroid(timeSlot.end),
        location: timeSlot.room,
        credits: course.credit,
        color: COLORS[schedule.length % COLORS.length],
      }));
    }
  };

  // 원격 강의 판별 함수
  const isRemoteCourse = (course) => {
    return (
      course.time_json &&
      course.time_json.length > 0 &&
      (course.time_json[0].day === "원격" ||
        course.time_json[0].day.trim().toLowerCase() === "원격" ||
        course.time_json[0].day.includes("원격"))
    );
  };

  // 오프라인 전공 강의 변환
  if (offline?.major) {
    offline.major.forEach((course) => {
      schedule.push(...transformCourse(course, "major"));
    });
  }

  // 오프라인 교양 강의 변환
  if (offline?.liberal) {
    offline.liberal.forEach((course) => {
      schedule.push(...transformCourse(course, "general"));
    });
  }

  // 온라인 전공 강의 변환
  if (online?.major) {
    online.major.forEach((course) => {
      if (isRemoteCourse(course)) {
        remoteClasses.push(transformCourse(course, "major", true));
      }
    });
  }

  // 온라인 교양 강의 변환
  if (online?.liberal) {
    online.liberal.forEach((course) => {
      if (isRemoteCourse(course)) {
        remoteClasses.push(transformCourse(course, "general", true));
      }
    });
  }

  return { schedule, remoteClasses };
};

const TimetableResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state || {};
  const { serverResponse } = formData;

  useEffect(() => {
    if (location.state?.tutorialMode) {
      runIntro(resultSteps, {
        onComplete: () => {
          navigate("/");
        },
        onExit: () => {
          navigate("/");
        },
      });
    }
  }, []);

  const [schedule, setSchedule] = useState([]);
  const [remoteClasses, setRemoteClasses] = useState([]);
  const [alternatives, setAlternatives] = useState({});

  useEffect(() => {
    if (serverResponse) {
      console.log("받은 시간표 데이터:", serverResponse);

      // 데이터 구조 검증
      const {
        schedule = [],
        remoteClasses = [],
        alternatives = {},
      } = serverResponse;

      setSchedule(schedule);
      setRemoteClasses(remoteClasses);
      setAlternatives(alternatives);
    } else {
      console.log("서버 응답이 없어 더미 데이터를 사용합니다.");
      setSchedule(getFilteredSchedule());
      setRemoteClasses([]);
      setAlternatives({});
    }
  }, [serverResponse]);

  const days = ["월", "화", "수", "목", "금"];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 서버 응답 데이터를 사용하여 초기화
  const [isRemoteSelected, setIsRemoteSelected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 교양 영역 이름 가져오기
  const getAreaName = (areaId) => {
    const areaMap = {
      literature: "문학과예술",
      society: "사회와문화",
      global: "글로벌리더십",
      science: "과학과기술",
      career: "진로탐색/자기계발/창업",
      philosophy: "철학과역사",
      remote: "원격 강의 희망",
    };
    return areaMap[areaId] || areaId;
  };

  // 학과명 가져오기
  const getCurrentDepartmentLabel = () => {
    return formData.departmentLabel || "학과 정보 없음";
  };

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = () => {
      if (!serverResponse) {
        console.log("서버 응답이 없습니다.");
        setSchedule([]);
        setRemoteClasses([]);
        return;
      }

      try {
        const transformedData = transformServerData(serverResponse);

        setSchedule(transformedData.schedule || []);
        setRemoteClasses(transformedData.remoteClasses || []);
      } catch (error) {
        console.error("서버 응답 처리 중 오류 발생:", error);
        alert("서버 응답 처리 중 오류가 발생했습니다.");
        setSchedule([]);
        setRemoteClasses([]);
      }
    };

    loadData();
  }, [serverResponse]);

  // 강의 선택 처리
  const handleClassClick = async (cls) => {
    setSelectedClass(cls);
    setIsRemoteSelected(false);
    setIsLoading(true);

    try {
      // 과목 코드 추출 (예: major-12147-03-월 -> 12147-03)
      const codeMatch = cls.id.match(/[^-]+-([^-]+-[^-]+)/);
      const code = codeMatch ? codeMatch[1] : null;

      if (!code) {
        throw new Error("과목 코드를 추출할 수 없습니다.");
      }

      console.log("선택한 과목 코드:", code);

      // 대체 강의 조회 API 호출
      const response = await axios.get(
        `https://kmutime.duckdns.org/api/alternatives?code=${code}`
      );

      const responseData = response.data;
      console.log("대체 강의 응답:", responseData);

      // 서버 응답 구조에 맞게 수정
      if (!responseData.success || !responseData.data?.alternatives) {
        throw new Error("대체 강의 데이터가 없습니다.");
      }

      // 대체 강의 데이터 변환
      const alternativesData = responseData.data.alternatives.map(
        (alt, index) => ({
          id: `alt-${alt.code}`,
          code: alt.code,
          name: alt.name,
          professor: alt.professor,
          credit: alt.credit,
          day: alt.time_json[0].day,
          start_time: alt.time_json[0].start,
          end_time: alt.time_json[0].end,
          room: alt.time_json[0].room,
          color: COLORS[index % COLORS.length],
          time_json: alt.time_json,
        })
      );

      setAlternatives(alternativesData);
      setShowModal(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } catch (error) {
      console.error("대체 강의 조회 오류:", error);
      alert(`대체 강의 조회 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 원격 강의 선택 처리
  const handleRemoteClassClick = async (cls) => {
    setSelectedClass(cls);
    setIsRemoteSelected(true);
    setIsLoading(true);

    try {
      // 과목 코드 추출 (예: remote-general-25486-01 -> 25486-01)
      const codeMatch = cls.id.match(/remote-[a-z]+-([^-]+-[^-]+)/);
      const code = codeMatch ? codeMatch[1] : null;

      if (!code) {
        throw new Error("과목 코드를 추출할 수 없습니다.");
      }

      console.log("선택한 원격 과목 코드:", code);

      // 동일과목 다른교수 강의 조회 API 호출
      const response = await axios.get(
        `https://kmutime.duckdns.org/api/alternatives?code=${code}`
      );

      if (response.status !== 200) {
        throw new Error(
          `서버 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const data = response.data;
      console.log("대체 원격 강의 데이터:", data);

      // 대체 강의가 없는 경우
      if (!data.alternatives || data.alternatives.length === 0) {
        alert("이 과목에 대한 다른 교수의 강의가 없습니다.");
        return;
      }

      // 대체 강의 데이터 설정
      setAlternatives(data.alternatives || []);
      setShowModal(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } catch (error) {
      console.error("대체 원격 강의 조회 오류:", error);
      alert(`대체 원격 강의 조회 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간표 재생성 함수 (서버 API 연동)
  const regenerateTimetable = async () => {
    // 로딩 상태 시작
    setIsLoading(true);
    setSchedule([]);
    setRemoteClasses([]);

    try {
      // 현재 시간표에 있는 과목 코드 추출
      const extractCode = (id) => {
        const match = id.match(/[^-]+-([^-]+-[^-]+)/);
        return match ? match[1] : null;
      };

      // 오프라인 강의 코드 수집 (중복 제거)
      const offlineCodes = [
        ...new Set(schedule.map((cls) => extractCode(cls.id)).filter(Boolean)),
      ];

      // 원격 강의 코드 수집 (중복 제거)
      const remoteCodes = [
        ...new Set(
          remoteClasses
            .map((cls) => {
              const match = cls.id.match(/remote-[^-]+-([^-]+-[^-]+)/);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        ),
      ];

      // 모든 제외 코드 합치기
      const excludedCodes = [...offlineCodes, ...remoteCodes];

      console.log("제외할 과목 코드:", excludedCodes);

      if (excludedCodes.length === 0) {
        alert("현재 시간표에 과목이 없어 재생성할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // 시간표 재생성 API 호출
      const response = await axios.post(
        "https://kmutime.duckdns.org/api/alternatives/recommend",
        {
          excludedCodes,
        }
      );

      if (response.status !== 200) {
        throw new Error(
          `서버 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const data = response.data;
      console.log("재생성 응답 데이터:", data);

      if (!data.success) {
        throw new Error("서버에서 시간표 재생성에 실패했습니다.");
      }

      // 서버 응답 데이터를 앱 형식으로 변환
      const transformedData = transformServerData(data);

      // 시간표 데이터 업데이트
      setSchedule(transformedData.schedule || []);
      setRemoteClasses(transformedData.remoteClasses || []);
    } catch (error) {
      console.error("시간표 재생성 오류:", error);
      alert(`시간표 재생성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      // 로딩 상태 종료
      setIsLoading(false);
    }
  };

  // 시간대 설정
  const timeSlots = [
    { period: 1, time: "1" },
    { period: 2, time: "2" },
    { period: 3, time: "3" },
    { period: 4, time: "4" },
    { period: 5, time: "5" },
    { period: 6, time: "6" },
  ];

  // 모달 닫기
  const closeModal = () => {
    setIsAnimating(false);
    // 애니메이션이 완전히 끝난 후 모달을 닫기
    setTimeout(() => {
      setShowModal(false);
      setSelectedClass(null);
      setAlternatives([]);
      setIsRemoteSelected(false);
    }, 300);
  };

  // 다른 교수 강의로 교체
  const replaceClass = (newClass) => {
    try {
      console.log("대체할 강의 데이터:", newClass);

      if (isRemoteSelected) {
        // 원격 강의 교체
        const updatedRemoteClasses = remoteClasses.filter(
          (cls) => cls.id !== selectedClass.id
        );

        // 새 원격 강의 변환 및 추가
        const transformedClass = {
          id: `remote-${newClass.type || "general"}-${newClass.code}`,
          name: newClass.name,
          professor: newClass.professor,
          type: newClass.type || "general",
          area: newClass.area || selectedClass.area,
          credits: newClass.credit || 3,
          note: newClass.note || "",
          color: COLORS[updatedRemoteClasses.length % COLORS.length],
        };

        updatedRemoteClasses.push(transformedClass);
        setRemoteClasses(updatedRemoteClasses);
        console.log("원격 강의 교체 완료:", transformedClass);
      } else {
        // 같은 과목명, 같은 교수의 기존 강의 모두 제거
        const updatedSchedule = schedule.filter(
          (cls) =>
            !(
              cls.name === selectedClass.name &&
              cls.professor === selectedClass.professor
            )
        );

        // 새 강의 데이터가 있는지 확인
        if (!newClass.time_json || newClass.time_json.length === 0) {
          throw new Error("새 강의의 시간 정보가 없습니다.");
        }

        // 새 강의 변환
        const newClassColor = COLORS[updatedSchedule.length % COLORS.length];
        const newScheduleItems = newClass.time_json.map((timeSlot) => ({
          id: `${newClass.type || "major"}-${newClass.code}-${timeSlot.day}`,
          name: newClass.name,
          professor: newClass.professor,
          type: newClass.type || "major",
          day: timeSlot.day,
          startPeriod: convertTimeToPeroid(timeSlot.start),
          endPeriod: convertTimeToPeroid(timeSlot.end),
          location: timeSlot.room || "",
          credits: newClass.credit || 3,
          color: newClassColor, // 같은 강의의 여러 시간대는 같은 색상 사용
        }));

        // 새 강의 추가
        updatedSchedule.push(...newScheduleItems);
        setSchedule(updatedSchedule);
        console.log("일반 강의 교체 완료:", newScheduleItems);
      }

      closeModal();
    } catch (error) {
      console.error("강의 교체 중 오류:", error);
      alert("강의 교체 중 오류가 발생했습니다: " + error.message);
    }
  };

  // 특정 교시에 해당하는 수업 찾기
  const findClass = (day, period) => {
    return schedule.find(
      (cls) =>
        cls.day === day && period >= cls.startPeriod && period <= cls.endPeriod
    );
  };

  // 수업 셀 렌더링
  const renderClassCell = (cls, isStart) => {
    if (!cls) return null;

    if (isStart) {
      const rowSpan = cls.endPeriod - cls.startPeriod + 1;

      return (
        <div
          className="class-content"
          style={{
            backgroundColor: `${cls.color}15`,
            borderLeft: `2px solid ${cls.color}`,
            height: `60px`,
            cursor: "pointer",
          }}
          onClick={() => handleClassClick(cls)}
        >
          <div className="class-name">{cls.name}</div>
          <div className="class-professor">{cls.professor}</div>
          <div className="class-location">{cls.location}</div>
        </div>
      );
    }
    return null;
  };

  // 특정 교시에 해당하는 다른 수업이 있는지 확인
  const shouldRenderEmpty = (day, period) => {
    const cls = findClass(day, period);
    if (!cls) return true;
    return cls.startPeriod === period;
  };

  // 원격 강의 바 렌더링
  const renderRemoteClasses = () => {
    if (!remoteClasses?.length) {
      if (formData.generalAreas?.includes("remote")) {
        return (
          <div className="remote-classes-container">
            <h2 className="remote-classes-title">원격 강의</h2>
            <div className="no-remote-classes">
              선택한 교양 영역에 해당하는 원격 강의가 없습니다.
            </div>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="remote-classes-container">
        <h2 className="remote-classes-title">원격 강의</h2>
        <div className="remote-classes-list">
          {remoteClasses.map((course) => (
            <div
              key={course.id}
              className="remote-class-item"
              style={{
                backgroundColor: `${course.color}15`,
                borderLeft: `4px solid ${course.color}`,
                cursor: "pointer",
              }}
              onClick={() => handleRemoteClassClick(course)}
            >
              <div className="remote-class-name">{course.name}</div>
              <div className="remote-class-professor">{course.professor}</div>
              {course.area && (
                <div className="remote-class-area">{course.area}</div>
              )}
              {course.note && (
                <div className="remote-class-note">{course.note}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 대체 강의 모달 렌더링
  const renderAlternativesModal = () => {
    if (!showModal || !selectedClass) return null;

    // 시간 포맷 함수
    const formatTime = (timeString) => {
      if (!timeString || timeString === "00:00") return "원격";

      // 시간 변환 (예: "10:30" -> "10시 30분")
      const [hour, minute] = timeString.split(":");
      return `${hour}시 ${minute}분`;
    };

    return (
      <div className="timetable-modal-overlay" onClick={closeModal}>
        <div
          className={`timetable-modal-content ${isAnimating ? "slide-up" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="timetable-modal-header">
            <h3>대체 가능한 강의</h3>
            <button className="timetable-modal-close" onClick={closeModal}>
              ×
            </button>
          </div>
          <div className="timetable-modal-body">
            <div className="selected-class">
              <p>
                <strong>현재 선택된 강의:</strong>
              </p>
              <div
                className="alternative-item selected"
                style={{
                  backgroundColor: `${selectedClass.color}15`,
                  borderLeft: `4px solid ${selectedClass.color}`,
                }}
              >
                <div className="alternative-name">{selectedClass.name}</div>
                <div className="alternative-details">
                  <div>
                    <strong>교수:</strong> {selectedClass.professor}
                  </div>
                  {!isRemoteSelected ? (
                    <>
                      <div>
                        <strong>시간:</strong> {selectedClass.day}요일
                        {selectedClass.startPeriod && selectedClass.endPeriod
                          ? ` ${
                              timeSlots[selectedClass.startPeriod - 1]?.time ||
                              ""
                            }~${
                              timeSlots[selectedClass.endPeriod - 1]?.time || ""
                            }`
                          : "원격"}
                      </div>
                      {selectedClass.location && (
                        <div>
                          <strong>위치:</strong> {selectedClass.location}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {selectedClass.area && (
                        <div>
                          <strong>영역:</strong> {selectedClass.area}
                        </div>
                      )}
                      {selectedClass.note && (
                        <div>
                          <strong>비고:</strong> {selectedClass.note}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="alternatives-list">
              <p>
                <strong>대체 가능한 강의:</strong>
              </p>
              {alternatives.map((alt, index) => (
                <div
                  key={alt.id || `alt-${index}`}
                  className="alternative-item"
                  style={{
                    backgroundColor: `${
                      alt.color || COLORS[index % COLORS.length]
                    }15`,
                    borderLeft: `4px solid ${
                      alt.color || COLORS[index % COLORS.length]
                    }`,
                  }}
                  onClick={() => replaceClass(alt)}
                >
                  <div className="alternative-name">{alt.name}</div>
                  <div className="alternative-details">
                    <div>
                      <strong>교수:</strong> {alt.professor}
                    </div>
                    {!isRemoteSelected ? (
                      <>
                        <div>
                          <strong>시간:</strong> {alt.day}요일
                          {alt.start_time && alt.end_time
                            ? ` (${formatTime(alt.start_time)}~${formatTime(
                                alt.end_time
                              )})`
                            : alt.time || "원격"}
                        </div>
                        {alt.room && (
                          <div>
                            <strong>위치:</strong> {alt.room}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {alt.area && (
                          <div>
                            <strong>영역:</strong> {alt.area}
                          </div>
                        )}
                        {alt.note && (
                          <div>
                            <strong>비고:</strong> {alt.note}
                          </div>
                        )}
                      </>
                    )}
                    {alt.credit && (
                      <div>
                        <strong>학점:</strong> {alt.credit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!formData) {
    return (
      <div className="error-message">
        <h1>잘못된 접근입니다</h1>
        <p>시간표 생성 페이지에서 정상적으로 접근해주세요.</p>
      </div>
    );
  }

  return (
    <main className="timetable-result-main">
      <div className="result-container">
        {/* 타이틀 및 선택 정보 표시 */}
        <div className="result-header">
          <h1 className="result-title">시간표 추천 결과</h1>
          <div className="selected-options">
            <p>
              <strong>
                {formData.year}학년 {formData.semester}학기
              </strong>{" "}
              |<strong> {getCurrentDepartmentLabel()}</strong> | 전공{" "}
              <strong>{formData.majorCredits}학점</strong> | 교양{" "}
              <strong>{formData.generalCredits}학점</strong>
            </p>
            <p className="selected-areas">
              {formData.generalAreas && formData.generalAreas.length > 0
                ? `선택 영역: ${formData.generalAreas
                    .filter((area) => area !== "remote")
                    .map((area) => getAreaName(area))
                    .join(", ")}`
                : "선택된 교양 영역 없음"}
              {formData.generalAreas &&
                formData.generalAreas.includes("remote") &&
                " (원격 강의 희망)"}
            </p>
            {serverResponse ? (
              <p className="server-response-info">
                서버에서 생성된 시간표입니다.
              </p>
            ) : (
              <p className="dummy-data-info">서버 응답이 없습니다.</p>
            )}
            <p className="ex">
              강의를 누르면 대체 강의를 선택할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="timetable-container">
          <table className="timetable">
            <thead>
              <tr>
                <th className="time-header"></th>
                {days.map((day) => (
                  <th key={day} className="day-header">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(({ period, time }) => (
                <tr key={period}>
                  <td className="period-cell">{time}</td>
                  {days.map((day) => {
                    const cls = findClass(day, period);
                    const isStart = cls?.startPeriod === period;

                    // 이전 교시에서 시작한 수업이 여기까지 이어지는 경우 렌더링하지 않음
                    if (!shouldRenderEmpty(day, period) && !isStart) {
                      return (
                        <td
                          key={`${day}-${period}`}
                          className="class-cell occupied"
                        ></td>
                      );
                    }

                    return (
                      <td
                        key={`${day}-${period}`}
                        className={`class-cell ${cls ? "has-class" : ""}`}
                        style={{
                          padding: cls ? "0" : undefined,
                        }}
                      >
                        {renderClassCell(cls, isStart)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              
            </tbody>
          </table>
        </div>

        {renderRemoteClasses()}

        <div className="regenerate-button-container">
          <button
            className="regenerate-button"
            onClick={regenerateTimetable}
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "동일 조건으로 시간표 재생성"}
          </button>
        </div>

        {renderAlternativesModal()}
      </div>
    </main>
  );
};

export default TimetableResult;
