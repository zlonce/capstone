import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { runIntro } from "../Tutorial/RunIntro";
import { formSteps } from "../Tutorial/TutorialStep";
import { DUMMY_RESULT_DATA } from "../TimetableResult/Tutorial_Dummy";
import "./Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const startTutorial = () => {
    setIsMenuOpen(false);
    navigate("/");
    runIntro(formSteps, {
      onComplete: () => {
        navigate("/result", {
          state: {
            tutorialMode: true,
            serverResponse: DUMMY_RESULT_DATA,
          },
        });
      },
      onExit: () => {},
    });
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      setIsClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        setIsMenuOpen(false);
        setIsClosing(false);
      }, 300);
    } else {
      setIsMenuOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  const handleClick = () => {
    window.location.replace("/");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <div className="logo-section" onClick={handleClick}>
            <img
              src="/images/logo.png"
              alt="계명대학교"
              className="logo-image"
            />
            <div className="logo-text">
              <span className="university-name-ko">계명대학교</span>
              <span className="university-name-en">KEIMYUNG UNIVERSITY</span>
            </div>
          </div>

          <button
            className="mobile-menu-button"
            onClick={toggleMenu}
            aria-label="메뉴 열기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>

          <nav className="desktop-nav">
            <button className="nav-button" onClick={startTutorial}>
              설명
            </button>
            <Link to="/contact" className="nav-button">
              문의하기
            </Link>
          </nav>
        </div>

        {isMenuOpen && (
          <>
            <div
              className={`modal-overlay ${isClosing ? "closing" : ""}`}
              onClick={toggleMenu}
            />
            <div className={`modal-content ${isClosing ? "closing" : ""}`}>
              <div className="modal-header">
                <span className="menu-title">메뉴</span>
                <button onClick={toggleMenu} className="close-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <nav className="mobile-nav">
                <div className="mobile-nav-buttons">
                  <button className="mobile-nav-button" onClick={startTutorial}>
                    설명
                  </button>
                  <Link
                    to="/contact"
                    className="mobile-nav-button"
                    onClick={toggleMenu}
                  >
                    문의하기
                  </Link>
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
