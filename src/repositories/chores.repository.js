// src/repositories/chores.repository.js
// import { query } from '../config/db.js';

// Demo data cho Module 1
export const findTodayChoresSample = async (houseId) => {
  return [
    {
      memberName: "Minh",
      task: "Đổ rác",
      dueDate: new Date(),
      status: "PENDING",
    },
    {
      memberName: "Lan",
      task: "Lau nhà",
      dueDate: new Date(),
      status: "IN_PROGRESS",
    },
  ];
};

export const findChoreLeaderboardSample = async (houseId) => {
  return [
    { memberName: "Minh", points: 25 },
    { memberName: "Lan", points: 20 },
    { memberName: "Tuấn", points: 12 },
  ];
};
