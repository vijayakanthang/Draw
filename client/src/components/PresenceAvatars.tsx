import React from "react";

interface UserPresence {
  id: string;
  username: string;
  pageId: string;
}

interface PresenceAvatarsProps {
  users: Record<string, UserPresence>;
  currentPageId: string;
}

export default function PresenceAvatars({ users, currentPageId }: PresenceAvatarsProps) {
  const userList = Object.values(users);

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center -space-x-2">
      {userList.map((user, i) => (
        <div 
          key={user.id}
          className={`relative group flex items-center justify-center w-9 h-9 rounded-full border-2 border-slate-900 bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[10px] font-bold shadow-xl transition-all hover:scale-110 hover:z-10 cursor-help ${user.pageId === currentPageId ? "ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900" : "opacity-40"}`}
          title={`${user.username} ${user.pageId === currentPageId ? "(On this page)" : "(On another page)"}`}
        >
          {user.username.slice(0, 2).toUpperCase()}
          
          <div className="absolute top-12 right-0 px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             {user.username} {user.pageId === currentPageId ? "is here" : "is on another page"}
          </div>
        </div>
      ))}
      
      <div className="w-9 h-9 rounded-full border-2 border-slate-900 bg-slate-800 text-white/40 text-[9px] font-bold flex items-center justify-center shadow-xl">
        ME
      </div>
    </div>
  );
}
