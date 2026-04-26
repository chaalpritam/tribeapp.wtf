import type { Poll } from "@/types";
import {
  currentUser,
  user1,
  user2,
  user4,
  user5,
  user6,
  user7,
  user8,
  user9,
  user10,
  user11,
  user12,
  user13,
} from "./users";

// Bangalore Polls
const bangalorePolls: Poll[] = [
  {
    id: "poll-blr-1",
    user: currentUser,
    question: "What should be our next community event in Koramangala?",
    options: [
      { id: "opt-1a", text: "Street food festival" },
      { id: "opt-1b", text: "Open mic night" },
      { id: "opt-1c", text: "Outdoor movie screening" },
      { id: "opt-1d", text: "Art workshop" },
    ],
    duration: 72,
    timestamp: "4 hours ago",
    votes: { "opt-1a": 45, "opt-1b": 32, "opt-1c": 28, "opt-1d": 19 },
    userVote: "opt-1a",
  },
  {
    id: "poll-blr-2",
    user: user1,
    question: "Best cycling route in Bangalore?",
    options: [
      { id: "opt-2a", text: "Cubbon Park Loop" },
      { id: "opt-2b", text: "Ulsoor Lake Circuit" },
      { id: "opt-2c", text: "Nandi Hills Climb" },
      { id: "opt-2d", text: "Sankey Tank Trail" },
    ],
    duration: 48,
    timestamp: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop",
    votes: { "opt-2a": 67, "opt-2b": 34, "opt-2c": 89, "opt-2d": 23 },
  },
  {
    id: "poll-blr-3",
    user: user2,
    question: "Should we start a community composting initiative in HSR Layout?",
    options: [
      { id: "opt-3a", text: "Yes, I'll participate!" },
      { id: "opt-3b", text: "Interested, need more info" },
      { id: "opt-3c", text: "Not for me" },
    ],
    duration: 96,
    timestamp: "2 days ago",
    votes: { "opt-3a": 112, "opt-3b": 45, "opt-3c": 8 },
  },
];

// Mumbai Polls
const mumbaiPolls: Poll[] = [
  {
    id: "poll-mum-1",
    user: user4,
    question: "Best street food spot in Mumbai?",
    options: [
      { id: "opt-4a", text: "Juhu Beach chaat" },
      { id: "opt-4b", text: "Mohammad Ali Road" },
      { id: "opt-4c", text: "Khau Galli, Ghatkopar" },
      { id: "opt-4d", text: "Carter Road stalls" },
    ],
    duration: 48,
    timestamp: "3 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=800&h=400&fit=crop",
    votes: { "opt-4a": 156, "opt-4b": 134, "opt-4c": 89, "opt-4d": 67 },
  },
  {
    id: "poll-mum-2",
    user: user5,
    question: "When should we schedule the weekend photography walk?",
    options: [
      { id: "opt-5a", text: "Saturday morning 6am" },
      { id: "opt-5b", text: "Saturday evening 5pm" },
      { id: "opt-5c", text: "Sunday morning 7am" },
    ],
    duration: 24,
    timestamp: "6 hours ago",
    votes: { "opt-5a": 23, "opt-5b": 45, "opt-5c": 31 },
  },
];

// Delhi Polls
const delhiPolls: Poll[] = [
  {
    id: "poll-del-1",
    user: user6,
    question: "Which heritage site should we explore next on our walk?",
    options: [
      { id: "opt-6a", text: "Humayun's Tomb" },
      { id: "opt-6b", text: "Qutub Minar complex" },
      { id: "opt-6c", text: "Red Fort" },
      { id: "opt-6d", text: "Lodhi Gardens" },
    ],
    duration: 72,
    timestamp: "5 hours ago",
    votes: { "opt-6a": 78, "opt-6b": 92, "opt-6c": 56, "opt-6d": 43 },
  },
  {
    id: "poll-del-2",
    user: user7,
    question: "Should we organize a neighborhood cleanup drive this weekend?",
    options: [
      { id: "opt-7a", text: "Saturday morning" },
      { id: "opt-7b", text: "Sunday morning" },
      { id: "opt-7c", text: "Next weekend instead" },
    ],
    duration: 48,
    timestamp: "1 day ago",
    votes: { "opt-7a": 34, "opt-7b": 56, "opt-7c": 12 },
  },
];

// San Francisco Polls
const sanFranciscoPolls: Poll[] = [
  {
    id: "poll-sf-1",
    user: user8,
    question: "What type of community workshop do you want next in the Mission?",
    options: [
      { id: "opt-8a", text: "Web3 & blockchain basics" },
      { id: "opt-8b", text: "Urban farming 101" },
      { id: "opt-8c", text: "Startup pitch practice" },
      { id: "opt-8d", text: "Meditation & wellness" },
    ],
    duration: 72,
    timestamp: "2 hours ago",
    votes: { "opt-8a": 89, "opt-8b": 67, "opt-8c": 112, "opt-8d": 45 },
    userVote: "opt-8a",
  },
  {
    id: "poll-sf-2",
    user: user9,
    question: "Favorite coffee shop for remote work in SoMa?",
    options: [
      { id: "opt-9a", text: "Blue Bottle Coffee" },
      { id: "opt-9b", text: "Sightglass" },
      { id: "opt-9c", text: "Ritual Coffee Roasters" },
      { id: "opt-9d", text: "Philz Coffee" },
    ],
    duration: 48,
    timestamp: "8 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=400&fit=crop",
    votes: { "opt-9a": 78, "opt-9b": 45, "opt-9c": 56, "opt-9d": 92 },
  },
];

// London Polls
const londonPolls: Poll[] = [
  {
    id: "poll-ldn-1",
    user: user10,
    question: "Best pub for our next community quiz night?",
    options: [
      { id: "opt-10a", text: "The Old Blue Last, Shoreditch" },
      { id: "opt-10b", text: "The Lamb, Islington" },
      { id: "opt-10c", text: "The Churchill Arms, Kensington" },
      { id: "opt-10d", text: "Ye Olde Cheshire Cheese, Fleet St" },
    ],
    duration: 72,
    timestamp: "3 hours ago",
    votes: { "opt-10a": 134, "opt-10b": 89, "opt-10c": 67, "opt-10d": 78 },
    userVote: "opt-10a",
  },
  {
    id: "poll-ldn-2",
    user: user11,
    question: "Which art exhibition should we visit as a group this month?",
    options: [
      { id: "opt-11a", text: "Tate Modern - New installations" },
      { id: "opt-11b", text: "Saatchi Gallery - Emerging artists" },
      { id: "opt-11c", text: "V&A - Design retrospective" },
    ],
    duration: 96,
    timestamp: "1 day ago",
    votes: { "opt-11a": 56, "opt-11b": 78, "opt-11c": 45 },
  },
];

// New York Polls
const newYorkPolls: Poll[] = [
  {
    id: "poll-nyc-1",
    user: user12,
    question: "What cuisine should our next community potluck feature?",
    options: [
      { id: "opt-12a", text: "Korean" },
      { id: "opt-12b", text: "Mexican" },
      { id: "opt-12c", text: "Ethiopian" },
      { id: "opt-12d", text: "Thai" },
    ],
    duration: 48,
    timestamp: "1 hour ago",
    votes: { "opt-12a": 89, "opt-12b": 112, "opt-12c": 67, "opt-12d": 78 },
  },
  {
    id: "poll-nyc-2",
    user: user13,
    question: "Best park for outdoor dance class in Manhattan?",
    options: [
      { id: "opt-13a", text: "Central Park (Bethesda Fountain)" },
      { id: "opt-13b", text: "Washington Square Park" },
      { id: "opt-13c", text: "Tompkins Square Park" },
      { id: "opt-13d", text: "Bryant Park" },
    ],
    duration: 72,
    timestamp: "5 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=400&fit=crop",
    votes: { "opt-13a": 145, "opt-13b": 98, "opt-13c": 56, "opt-13d": 67 },
  },
];

export const polls: Poll[] = [
  ...bangalorePolls,
  ...mumbaiPolls,
  ...delhiPolls,
  ...sanFranciscoPolls,
  ...londonPolls,
  ...newYorkPolls,
];
