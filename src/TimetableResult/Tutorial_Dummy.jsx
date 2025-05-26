export const DUMMY_RESULT_DATA = {
  success: true,
  data: {
    offline: {
      major: [
        {
          name: "데이터베이스",
          professor: "홍동권",
          code: "20923-01",
          credit: 3,
          time_json: [
            { day: "월", start: "09:00", end: "10:15", room: "IT101" },
            { day: "수", start: "09:00", end: "10:15", room: "IT101" },
          ],
        },
        {
          name: "운영체제",
          professor: "이덕우",
          code: "21598-02",
          credit: 3,
          time_json: [
            { day: "화", start: "13:30", end: "14:45", room: "IT202" },
            { day: "목", start: "13:30", end: "14:45", room: "IT202" },
          ],
        },
        {
          name: "컴퓨터네트워크",
          professor: "주홍택",
          code: "17735-01",
          credit: 3,
          time_json: [
            { day: "금", start: "10:30", end: "11:45", room: "IT303" },
          ],
        },
      ],
      liberal: [],
    },
    online: {
      major: [],
      liberal: [],
    },
  },
  alternatives: {
    "CS101-01": [
      {
        code: "20923-02",
        name: "데이터베이스",
        professor: "이인규",
        credit: 3,
        time_json: [
          { day: "월", start: "10:30", end: "11:45", room: "IT102" },
          { day: "수", start: "10:30", end: "11:45", room: "IT102" },
        ],
      },
    ],
  },
};
