import type { Task } from "@/types";
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

const bangaloreTasks: Task[] = [
  {
    id: "task-blr-1",
    user: currentUser,
    title: "Help with Koramangala Park Cleanup",
    description: "Looking for volunteers to help clean up the neighborhood park this Saturday morning. We have gloves and bags provided.",
    icon: "leaf",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=400&fit=crop",
    location: "Koramangala 4th Block Park",
    helpers: 8,
    timeAgo: "2 hours ago",
    reward: "₹500 community credit",
    isUrgent: false,
  },
  {
    id: "task-blr-2",
    user: user1,
    title: "Dog Walker Needed This Weekend",
    description: "Going out of town for the weekend. Need someone to walk my golden retriever twice a day. He's very friendly!",
    icon: "paw",
    location: "Indiranagar, Bangalore",
    helpers: 3,
    timeAgo: "5 hours ago",
    reward: "₹300 per walk",
    isUrgent: true,
  },
];

const mumbaiTasks: Task[] = [
  {
    id: "task-mum-1",
    user: user4,
    title: "Beach Cleanup Drive - Juhu",
    description: "Organizing a massive beach cleanup at Juhu Beach. Need 50+ volunteers. Refreshments provided.",
    icon: "waves",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    location: "Juhu Beach, Mumbai",
    helpers: 34,
    timeAgo: "1 hour ago",
    reward: "Free lunch + eco tote bag",
    isUrgent: false,
  },
  {
    id: "task-mum-2",
    user: user5,
    title: "Photography Mentor for Kids",
    description: "Running a free photography workshop for underprivileged kids in Andheri. Need volunteer mentors who can teach basics.",
    icon: "camera",
    location: "Andheri Community Center",
    helpers: 5,
    timeAgo: "8 hours ago",
    isUrgent: false,
  },
];

const delhiTasks: Task[] = [
  {
    id: "task-del-1",
    user: user6,
    title: "Heritage Building Documentation",
    description: "Help document and photograph 10 heritage buildings in Old Delhi before restoration begins. Historical knowledge appreciated.",
    icon: "building",
    imageUrl: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=400&fit=crop",
    location: "Old Delhi, Chandni Chowk",
    helpers: 6,
    timeAgo: "3 hours ago",
    reward: "₹1000 + published credit",
    isUrgent: false,
  },
  {
    id: "task-del-2",
    user: user7,
    title: "Tree Plantation Volunteers Needed",
    description: "Planting 100 saplings in Saket public spaces this weekend. Need people with gardening experience.",
    icon: "tree",
    location: "Saket District Park",
    helpers: 12,
    timeAgo: "1 day ago",
    isUrgent: true,
  },
];

const sanFranciscoTasks: Task[] = [
  {
    id: "task-sf-1",
    user: user8,
    title: "Community Garden Volunteers",
    description: "Our Mission District community garden needs help with spring planting. All skill levels welcome!",
    icon: "sprout",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop",
    location: "Mission Community Garden, SF",
    helpers: 15,
    timeAgo: "4 hours ago",
    reward: "Fresh produce basket",
    isUrgent: false,
  },
  {
    id: "task-sf-2",
    user: user9,
    title: "Tech Workshop Setup Help",
    description: "Setting up equipment for a free coding bootcamp at the SoMa community center. Need help with AV and laptops.",
    icon: "laptop",
    location: "SoMa Community Center",
    helpers: 4,
    timeAgo: "6 hours ago",
    isUrgent: true,
  },
];

const londonTasks: Task[] = [
  {
    id: "task-ldn-1",
    user: user10,
    title: "Canal Path Litter Pick",
    description: "Monthly canal path cleanup along Regent's Canal. We provide all equipment. Just bring your enthusiasm!",
    icon: "trash",
    imageUrl: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=400&fit=crop",
    location: "Regent's Canal, Camden",
    helpers: 22,
    timeAgo: "2 hours ago",
    reward: "Free pint at The Lock Tavern",
    isUrgent: false,
  },
  {
    id: "task-ldn-2",
    user: user11,
    title: "Mural Painting Assistants",
    description: "Painting a community mural on the Shoreditch high street wall. Need artists and helpers for scaffolding.",
    icon: "paintbrush",
    location: "Shoreditch High Street",
    helpers: 7,
    timeAgo: "12 hours ago",
    isUrgent: false,
  },
];

const newYorkTasks: Task[] = [
  {
    id: "task-nyc-1",
    user: user12,
    title: "Community Garden Harvest Help",
    description: "Big harvest day at the Williamsburg community garden. Need help picking, sorting, and distributing produce to neighbors.",
    icon: "carrot",
    imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=400&fit=crop",
    location: "Williamsburg Community Garden",
    helpers: 18,
    timeAgo: "1 hour ago",
    reward: "Fresh vegetable box",
    isUrgent: false,
  },
  {
    id: "task-nyc-2",
    user: user13,
    title: "Dance Class Setup & Sound Check",
    description: "Need help setting up outdoor speakers and marking the dance floor for Saturday's free salsa class in the park.",
    icon: "music",
    location: "Tompkins Square Park, East Village",
    helpers: 4,
    timeAgo: "5 hours ago",
    isUrgent: true,
  },
];

export const tasks: Record<string, Task[]> = {
  bangalore: bangaloreTasks,
  mumbai: mumbaiTasks,
  delhi: delhiTasks,
  "san-francisco": sanFranciscoTasks,
  london: londonTasks,
  "new-york": newYorkTasks,
};

export function getAllTasks(): Task[] {
  return Object.values(tasks).flat();
}
