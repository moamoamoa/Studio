export const APP_NAME = "AI Automation";

export const COLORS = {
  primary: "bg-indigo-500",
  primaryHover: "hover:bg-indigo-600",
  secondary: "bg-pink-400",
  background: "bg-slate-50",
  chatBg: "bg-[#b2c7d9]", // Kakao-ish blue-grey for background
  myBubble: "bg-[#ffe01b]", // Kakao yellow
  otherBubble: "bg-white",
};

export const AVATARS = {
  // Using a reliable cute robot avatar URL to ensure it loads correctly
  admin: "https://api.dicebear.com/7.x/bottts/svg?seed=HappyAdminBot&backgroundColor=e0e7ff",
  user: "https://api.dicebear.com/7.x/micah/svg?seed=",
};

export const generateId = () => Math.random().toString(36).substr(2, 9);