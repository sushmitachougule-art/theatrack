import { WeeklyChallenge } from "@/types";

// Rotating pool of weekly challenges. The app picks one each Monday.
export const challengePool: Omit<
  WeeklyChallenge,
  "id" | "startDate" | "endDate" | "isActive"
>[] = [
  {
    title: "Sit Master",
    description: "Practice 'Sit' in 5 different locations this week.",
    icon: "🪑",
    goal: "5 practice sessions in new locations",
    targetCount: 5,
  },
  {
    title: "Recall Champion",
    description:
      "Call your dog to come 10 times this week with a reward every time.",
    icon: "🏃",
    goal: "10 successful recalls",
    targetCount: 10,
  },
  {
    title: "Walk & Train",
    description: "Practice one command during each walk. Log 5 training walks.",
    icon: "🦮",
    goal: "5 training walks",
    targetCount: 5,
  },
  {
    title: "Trick Time",
    description: "Spend 3 minutes each day teaching or practicing a trick.",
    icon: "🎪",
    goal: "7 days of trick practice",
    targetCount: 7,
  },
  {
    title: "Patience Builder",
    description:
      "Practice 'Stay' with increasing duration — aim for 30 seconds by week end.",
    icon: "✋",
    goal: "7 stay practice sessions",
    targetCount: 7,
  },
  {
    title: "Socializer",
    description:
      "Let your dog meet 3 new dogs or people this week with calm greetings.",
    icon: "👋",
    goal: "3 calm social interactions",
    targetCount: 3,
  },
  {
    title: "Focus Week",
    description:
      "Practice eye contact: hold your dog's gaze for 5 seconds before rewards.",
    icon: "👁️",
    goal: "10 successful focus exercises",
    targetCount: 10,
  },
  {
    title: "Leave It Pro",
    description:
      "Practice 'Leave It' with increasing temptations 5 times this week.",
    icon: "🚫",
    goal: "5 leave-it exercises",
    targetCount: 5,
  },
];

/**
 * Get the current week's challenge based on the week number.
 * Rotates through the pool automatically.
 */
export function getCurrentWeekChallenge(): Omit<WeeklyChallenge, "id"> {
  const now = new Date();
  // Get Monday of current week
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Week number of the year determines which challenge
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7,
  );
  const index = weekNumber % challengePool.length;
  const challenge = challengePool[index];

  return {
    ...challenge,
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
    isActive: true,
  };
}
