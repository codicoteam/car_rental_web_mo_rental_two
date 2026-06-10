// src/screens/chat/ChatScreen.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send, Menu, Search, MoreVertical, Check, CheckCheck, ArrowLeft, Paperclip, Image,
} from "lucide-react";
import Sidebar from "../../components/agentsidebar";
import {
  fetchAllUsers,
  fetchMyConversations,
  createDirectConversation,
  fetchMessages,
  sendMessageRest,
  markMessageRead,
  deleteMessage,
  type IChatConversation,
  type IChatMessage,
  type IUser,

} from "../../Services/chat_api";
import { loadAuthFromStorage } from "../../features/auth/authService";

const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || "http://13.61.185.238:5050";

// ---------------- UI Types ----------------
type Presence = "online" | "offline" | "away";

interface UIConversation {
  id: string;                 // conversation _id
  title?: string;
  user?: IUser;               // “other” user (for direct)
  avatarColor: string;
  unreadCount: number;
  lastMessage?: { content: string; createdAt: Date };
  status: Presence;
}

interface UIMessage {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  readBy: string[];
  isDeleted?: boolean;
}

// ---------- Utilities ----------
const gradientPool = [
  "from-blue-400 to-purple-500",
  "from-pink-400 to-rose-500",
  "from-green-400 to-emerald-500",
  "from-orange-400 to-red-500",
  "from-indigo-400 to-blue-500",
  "from-purple-400 to-pink-500",
  "from-teal-400 to-cyan-500",
  "from-yellow-400 to-orange-500",
  "from-red-400 to-pink-500",
  "from-blue-400 to-cyan-500",
];
const getAvatarColor = (seed: string) => {
  const i = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % gradientPool.length;
  return gradientPool[i];
};

const isDirect = (c: IChatConversation) => c.type === "direct";

// find “other” user id in a direct conversation
const getOtherParticipantId = (c: IChatConversation, myId: string) => {
  const others = c.participants.map(p => p.user_id).filter(uid => uid !== myId);
  return others[0] || myId;
};

// normalize backend message to UI
const toUIMessage = (m: IChatMessage): UIMessage => ({
  id: m._id,
  content: m.content || "",
  createdAt: new Date(m.created_at),
  senderId: m.sender_id,
  readBy: m.read_by ?? [],
  isDeleted: m.is_deleted,
});

export default function AgentChatScreen() {
  // auth + session
  const { token: authToken, user: me } = loadAuthFromStorage() || { token: null, user: null };
  const myId = me?._id;

  // socket
  const socketRef = useRef<Socket | null>(null);

  // ui state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [typing, setTyping] = useState(false);
  const [selfTyping, setSelfTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [contacts, setContacts] = useState<IUser[]>([]);
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [messagesByConvo, setMessagesByConvo] = useState<Record<string, UIMessage[]>>({});
  const [selectedConvo, setSelectedConvo] = useState<UIConversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- effects: layout ----------
  useEffect(() => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    if (!mobile) setShowChat(true);
    const onResize = () => {
      const mobileNow = window.innerWidth < 1024;
      setIsMobile(mobileNow);
      if (!mobileNow) setShowChat(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByConvo, selectedConvo]);

  // ---------- initial load ----------
  useEffect(() => {
    (async () => {
      if (!authToken || !myId) {
        setLoading(false);
        setError("Not authenticated");
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // contacts (users)
        const allUsers = await fetchAllUsers();
        setContacts(allUsers);

        // conversations
        const convos = await fetchMyConversations();

        // map to UI
        const uiConvos: UIConversation[] = convos.map((c) => {
          const otherId = isDirect(c) ? getOtherParticipantId(c, myId) : myId;
          const user = allUsers.find(u => u._id === otherId);
          return {
            id: c._id,
            title: c.title,
            user,
            avatarColor: getAvatarColor(user?._id || c._id),
            unreadCount: 0,
            lastMessage: c.last_message_at
              ? { content: c.last_message_preview || "", createdAt: new Date(c.last_message_at) }
              : undefined,
            status: (user?.isOnline ? "online" : "offline") as Presence,
          };
        });

        setConversations(uiConvos);

        // preload empty message arrays
        const empty: Record<string, UIMessage[]> = {};
        uiConvos.forEach((c) => (empty[c.id] = []));
        setMessagesByConvo(empty);
      } catch (e: any) {
        setError(e?.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    })();
  }, [authToken, myId]);

  // ---------- socket setup ----------
  useEffect(() => {
    if (!authToken) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: `Bearer ${authToken}` },
    });

    socketRef.current = s;

    s.on("connect", () => {
      // (re)join current room on reconnect
      if (selectedConvo?.id) {
        s.emit("chat:join_conversation", { conversationId: selectedConvo.id });
      }
    });

    s.on("disconnect", () => {
      // nothing special
    });

    // message created (from anyone in the room)
// message created (from anyone in the room)
s.on("chat:message_created", ({ message }: { message: IChatMessage }) => {
  const ui = toUIMessage(message);

  setMessagesByConvo((prev) => {
    const cid = message.conversation_id;
    const arr = prev[cid] || [];

    // already have the real message id
    if (arr.some((m) => m.id === ui.id)) return prev;

    // if it's my own message, remove the optimistic temp one (same text, recent)
    const nextArr =
      message.sender_id === myId
        ? arr.filter((m) => {
            const isTemp = typeof m.id === "string" && m.id.startsWith("temp_");
            const sameText = (m.content || "") === (ui.content || "");
            const closeInTime =
              Math.abs(m.createdAt.getTime() - ui.createdAt.getTime()) < 30_000; // 30s window
            return !(isTemp && m.senderId === myId && sameText && closeInTime);
          })
        : arr;

    return { ...prev, [cid]: [...nextArr, ui] };
  });

  // bump convo preview
  setConversations((prev) =>
    prev.map((c) =>
      c.id === message.conversation_id
        ? {
            ...c,
            lastMessage: { content: message.content || "", createdAt: new Date(message.created_at) },
            unreadCount:
              selectedConvo?.id === message.conversation_id && message.sender_id === myId
                ? c.unreadCount
                : c.unreadCount + (selectedConvo?.id === message.conversation_id ? 0 : 1),
          }
        : c
    )
  );
});


    s.on("chat:message_read", ({ messageId, userId }: any) => {
      // reflect read receipt
      setMessagesByConvo((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((cid) => {
          next[cid] = next[cid].map((m) => (m.id === messageId ? { ...m, readBy: [...new Set([...m.readBy, userId])] } : m));
        });
        return next;
      });
    });

    s.on("chat:message_deleted", ({ messageId }: any) => {
      setMessagesByConvo((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((cid) => {
          next[cid] = next[cid].map((m) => (m.id === messageId ? { ...m, content: "", isDeleted: true } : m));
        });
        return next;
      });
    });

    s.on("typing:started", ({ conversationId, userId }) => {
      if (conversationId === selectedConvo?.id && userId !== myId) setTyping(true);
    });

    s.on("typing:stopped", ({ conversationId, userId }) => {
      if (conversationId === selectedConvo?.id && userId !== myId) setTyping(false);
    });

    s.on("chat:error", (payload) => {
      console.warn("chat:error", payload);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [authToken, myId, selectedConvo?.id]);

  // ---------- helpers ----------
  const joinRoom = useCallback((conversationId: string) => {
    socketRef.current?.emit("chat:join_conversation", { conversationId });
  }, []);

  const leaveRoom = useCallback((conversationId: string) => {
    socketRef.current?.emit("chat:leave_conversation", { conversationId });
  }, []);

  const openConversation = useCallback(async (c: UIConversation) => {
    setSelectedConvo((prev) => {
      if (prev?.id && prev.id !== c.id) leaveRoom(prev.id);
      return c;
    });

    joinRoom(c.id);
    setTyping(false);
    setTimeout(() => inputRef.current?.focus(), 80);

    // Load messages if not loaded yet
    if (!messagesByConvo[c.id] || messagesByConvo[c.id].length === 0) {
      try {
        const list = await fetchMessages(c.id);
        setMessagesByConvo((prev) => ({ ...prev, [c.id]: list.map(toUIMessage) }));
      } catch (e) {
        console.error("Failed to fetch messages", e);
      }
    }

    // reset unread
    setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));
  }, [joinRoom, leaveRoom, messagesByConvo]);

  // Create or reuse a direct conversation when clicking a contact
  const startDirectWith = useCallback(async (user: IUser) => {
    // look for an existing direct conversation with this user
    const existing = conversations.find((c) => c.user?._id === user._id);
    if (existing) {
      if (isMobile) setShowChat(true);
      await openConversation(existing);
      return;
    }
    // create then open
    try {
      const created = await createDirectConversation(user._id);
      const ui: UIConversation = {
        id: created._id,
        title: created.title,
        user,
        avatarColor: getAvatarColor(user._id),
        unreadCount: 0,
        lastMessage: created.last_message_at
          ? { content: created.last_message_preview || "", createdAt: new Date(created.last_message_at) }
          : undefined,
        status: (user.isOnline ? "online" : "offline") as Presence,
      };
      setConversations((prev) => [ui, ...prev]);
      setMessagesByConvo((prev) => ({ ...prev, [ui.id]: [] }));
      if (isMobile) setShowChat(true);
      await openConversation(ui);
    } catch (e: any) {
      console.error("createDirectConversation failed", e);
      setError(e?.message || "Failed to start conversation");
    }
  }, [conversations, isMobile, openConversation]);

  // typing events
  useEffect(() => {
    if (!socketRef.current || !selectedConvo?.id) return;

    if (inputText.trim() && !selfTyping) {
      setSelfTyping(true);
      socketRef.current.emit("typing:start", { conversationId: selectedConvo.id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (selfTyping) {
        socketRef.current?.emit("typing:stop", { conversationId: selectedConvo.id });
        setSelfTyping(false);
      }
    }, 1000);

    return () => clearTimeout(typingTimeoutRef.current);
  }, [inputText, selectedConvo?.id, selfTyping]);

  const sendMessage = useCallback(async () => {
    if (!selectedConvo?.id || !inputText.trim()) return;
    const text = inputText.trim();

    // optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimistic: UIMessage = {
      id: tempId,
      content: text,
      createdAt: new Date(),
      senderId: myId ?? "",
      readBy: [myId ?? ""],
    };

    setMessagesByConvo((prev) => ({
      ...prev,
      [selectedConvo.id]: [...(prev[selectedConvo.id] || []), optimistic],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvo.id
          ? { ...c, lastMessage: { content: `You: ${text}`, createdAt: new Date() } }
          : c
      )
    );

    setInputText("");

    // prefer socket
    const sentViaSocket = !!socketRef.current?.connected;
    try {
      if (sentViaSocket) {
        socketRef.current?.emit("chat:send_message", {
          conversation_id: selectedConvo.id,
          content: text,
          attachments: [],
        });
      } else {
        // REST fallback
        const saved = await sendMessageRest(selectedConvo.id, text, []);
        const ui = toUIMessage(saved);

        // replace optimistic temp with actual
        setMessagesByConvo((prev) => {
          const list = prev[selectedConvo.id] || [];
          const idx = list.findIndex((m) => m.id === tempId);
          if (idx === -1) return prev;
          const next = [...list];
          next[idx] = ui;
          return { ...prev, [selectedConvo.id]: next };
        });
      }

      // stop typing
      if (selfTyping) {
        socketRef.current?.emit("typing:stop", { conversationId: selectedConvo.id });
        setSelfTyping(false);
      }
    } catch (e) {
      console.error("sendMessage failed", e);
      // revert optimistic on error
      setMessagesByConvo((prev) => {
        const list = prev[selectedConvo.id] || [];
        return { ...prev, [selectedConvo.id]: list.filter((m) => m.id !== tempId) };
      });
    }
  }, [inputText, myId, selectedConvo, selfTyping]);

  // mark read (call on mount of convo or on scroll etc.)
  useEffect(() => {
    const markLastAsRead = async () => {
      if (!selectedConvo) return;
      const arr = messagesByConvo[selectedConvo.id] || [];
      if (arr.length === 0) return;
      const last = arr[arr.length - 1];

      // only mark if not mine
      if (last.senderId !== myId) {
        try {
          await markMessageRead(last.id);
          socketRef.current?.emit("chat:mark_read", { messageId: last.id });
        } catch (e) {
          console.warn("markMessageRead failed", e);
        }
      }
    };
    markLastAsRead();
  }, [messagesByConvo, selectedConvo, myId]);

  // delete message (example handler, wire to UI as you prefer)
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      socketRef.current?.emit("chat:delete_message", { messageId });
    } catch (e) {
      console.error("delete message failed", e);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const who = c.user?.full_name || c.title || "";
      const last = c.lastMessage?.content || "";
      return who.toLowerCase().includes(q) || last.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  const displayMessages: UIMessage[] = selectedConvo ? (messagesByConvo[selectedConvo.id] || []) : [];

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: Presence) =>
    status === "online" ? "bg-green-500" : status === "away" ? "bg-yellow-500" : "bg-gray-400";

  const isMyMessage = (m: UIMessage) => m.senderId === myId;

  // --------- RENDER ----------
  return (
    <div className="h-screen bg-white flex relative overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 lg:ml-72 h-screen">
        {/* Left column: Contacts/Conversations tabs (simple: show both stacked) */}
        <div className={`${isMobile ? (showChat ? "hidden" : "flex w-full") : "flex w-80"} lg:flex flex-col bg-white border-r border-gray-200`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                  <Menu className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search chats or contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-100 text-sm text-gray-800 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-60">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                <p className="mt-4 text-sm text-gray-500">Loading chats…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-60 text-center px-4">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="text-sm text-red-500">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600">
                  Retry
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={async () => {
                    if (isMobile) setShowChat(true);
                    await openConversation(conv);
                  }}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedConvo?.id === conv.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${conv.avatarColor} flex items-center justify-center`}>
                      <span className="text-white font-semibold text-sm">
                        {(conv.user?.full_name || conv.title || "C").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(conv.status)} rounded-full border-2 border-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {conv.user?.full_name || conv.title || "Conversation"}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {conv.lastMessage ? formatDate(conv.lastMessage.createdAt) : "New"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-600 truncate">{conv.lastMessage?.content || "No messages yet"}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-teal-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Contacts (quick start) */}
          <div className="border-t border-gray-200">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500">Start new chat</div>
            <div className="max-h-48 overflow-y-auto">
              {filteredContacts.slice(0, 12).map((u) => (
                <button
                  key={u._id}
                  onClick={() => startDirectWith(u)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(u._id)} flex items-center justify-center`}>
                    <span className="text-white text-xs font-semibold">{u.full_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="truncate">{u.full_name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${isMobile ? (showChat ? "flex w-full" : "hidden") : "flex"} lg:flex`}>
          {selectedConvo ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button
                      onClick={() => {
                        setShowChat(false);
                        setSelectedConvo(null);
                      }}
                      className="lg:hidden mr-1"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                  )}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedConvo.avatarColor} flex items-center justify-center`}>
                      <span className="text-white font-semibold text-sm">
                        {(selectedConvo.user?.full_name || selectedConvo.title || "C").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(selectedConvo.status)} rounded-full border-2 border-white`} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-gray-900">{selectedConvo.user?.full_name || selectedConvo.title || "Conversation"}</h2>
                    {typing ? (
                      <p className="text-xs text-teal-600 animate-pulse">typing…</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {selectedConvo.status === "online" ? "Active now" : selectedConvo.status === "away" ? "Away" : "Last seen recently"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-4">
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Today</span>
                  </div>

                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Send className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">
                        Start the conversation with {selectedConvo.user?.full_name || "this contact"}
                      </p>
                    </div>
                  ) : (
                    displayMessages.map((msg) => {
                      const mine = isMyMessage(msg);
                      const deleted = msg.isDeleted;
                      return (
                        <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[70%] group">
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${
                                mine
                                  ? "bg-teal-500 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100"
                              }`}
                            >
                              <p className={`text-sm leading-relaxed break-words ${deleted ? "italic opacity-60" : ""}`}>
                                {deleted ? "Message deleted" : msg.content}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 px-1 ${mine ? "justify-end" : "justify-start"}`}>
                              <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                              {mine && (
                                <span>
                                  {msg.readBy?.length > 1 ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-gray-400" />
                                  )}
                                </span>
                              )}
                              {/* Example delete button for own messages */}
                              {mine && !deleted && (
                                <button
                                  className="opacity-0 group-hover:opacity-100 transition text-xs text-gray-400 ml-2 underline"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Delete message"
                                >
                                  delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                        <div className="flex gap-1">
                          {[0, 0.2, 0.4].map((d) => (
                            <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-3">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={attachMenuRef}>
                      <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full"
                        title="Attach"
                      >
                        <Paperclip className="w-5 h-5 transform rotate-45" />
                      </button>
                      {showAttachMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-50">
                          <button
                            onClick={() => setShowAttachMenu(false)}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Image className="w-4 h-4 text-blue-600" />
                            </div>
                            <span>Photos &amp; Videos</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={`Message ${selectedConvo.user?.full_name || "contact"}`}
                        className="w-full pl-4 pr-12 py-2.5 bg-gray-100 text-sm text-gray-900 placeholder-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      />
                    </div>

                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim()}
                      className={`p-2.5 rounded-full transition-all duration-200 ${
                        inputText.trim()
                          ? "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      title="Send"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
              <div className="text-center px-4">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center shadow-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                    <Send className="w-8 h-8 text-white transform -rotate-45" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select or start a chat</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md">
                  {loading ? "Loading…" : error ? "Failed to load chats" : "Pick a conversation on the left or start a new one from contacts below."}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  {(["online", "offline", "away"] as Presence[]).map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-2 h-2 ${getStatusColor(s)} rounded-full`} />
                      <span className="capitalize">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
