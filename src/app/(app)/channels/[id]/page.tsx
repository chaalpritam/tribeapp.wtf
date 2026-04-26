"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Hash, Users, Heart, MessageCircle, Share2 } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { formatNumber } from "@/lib/utils";

const tabs = ["Posts", "Subchannels", "About"];

const mockChannelPosts = [
  {
    id: "cp1",
    author: "Arjun K",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    content: "Just shared a great route for the weekend ride. Check it out in #routes! Perfect for intermediate riders.",
    time: "2h ago",
    likes: 12,
    replies: 3,
  },
  {
    id: "cp2",
    author: "Priya S",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    content: "Reminder: Community meetup this Saturday at 4 PM. We'll be discussing plans for the upcoming month. All members welcome!",
    time: "5h ago",
    likes: 24,
    replies: 8,
  },
  {
    id: "cp3",
    author: "Rahul M",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    content: "Found an amazing new spot in the city. Perfect for our next group activity. Sharing photos soon!",
    time: "1d ago",
    likes: 45,
    replies: 12,
  },
  {
    id: "cp4",
    author: "Lisa B",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
    content: "Welcome to all the new members who joined this week! Introduce yourselves here and let us know what you're interested in.",
    time: "2d ago",
    likes: 67,
    replies: 22,
  },
];

export default function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { tribes } = useTribeStore();
  const [activeTab, setActiveTab] = useState("Posts");

  const channel = tribes.find((t) => t.id === id);

  if (!channel) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Channel not found
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => router.back()} className="rounded-full p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{channel.name}</h1>
          <p className="text-xs text-muted-foreground">{formatNumber(channel.members)} members</p>
        </div>
      </div>

      <div className="border-b px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === "Posts" && (
          <div className="space-y-4">
            {mockChannelPosts.map((post) => (
              <div key={post.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full">
                    <Image src={post.avatar} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-5 text-muted-foreground">
                  <button className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                    <Heart className="h-4 w-4" />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    {post.replies}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Subchannels" && (
          <div className="space-y-2">
            {channel.subchannels.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 rounded-xl border p-3">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  <Users className="mr-1 inline h-3 w-3" />
                  {formatNumber(sub.members)}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "About" && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">{channel.description}</p>
            <h3 className="mb-2 text-sm font-semibold">Rules</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {channel.rules.map((rule, i) => (
                <li key={i}>&bull; {rule}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
