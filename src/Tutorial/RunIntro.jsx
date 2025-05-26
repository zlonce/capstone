import introJs from "intro.js";
import "intro.js/introjs.css";

export const runIntro = (steps, { onComplete, onExit } = {}) => {
  const intro = introJs();
  intro.setOptions({
    steps,
    disableInteraction: true,
    exitOnOverlayClick: false,
    hidePrev: true,
    nextLabel: "다음",
    prevLabel: "이전",
    doneLabel: "완료",
  });

  if (onComplete) intro.oncomplete(onComplete);
  if (onExit) intro.onexit(onExit);

  intro.start();
};
