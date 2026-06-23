import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send, Menu, Search, Check, CheckCheck, ArrowLeft, MessageSquare,
  Users, User, ChevronDown, ChevronRight,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import {
  fetchChatContacts,
  fetchMyConversations,
  createDirectConversation,
  fetchMessages,
  sendMessageRest,
  markMessageRead,
  deleteMessage,
  type IChatConversation,
  type IChatMessage,
  type IUser,
} from "../../../Services/chat_api";
import { loadAuthFromStorage } from "../../../features/auth/authService";

const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || "http://13.61.185.238:5050";
const BRAND_BLUE = "#1EA2E4";
const BRAND_NAVY = "#0A1628";

// ── Role meta ──────────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  executive_admin:     { label: "Executive",     color: "text-violet-700", bg: "bg-violet-100" },
  admin:               { label: "Admin",          color: "text-indigo-700", bg: "bg-indigo-100" },
  manager:             { label: "Manager",        color: "text-blue-700",   bg: "bg-blue-100"   },
  branch_receptionist: { label: "Receptionist",  color: "text-cyan-700",   bg: "bg-cyan-100"   },
  agent:               { label: "Agent",          color: "text-teal-700",   bg: "bg-teal-100"   },
  driver:              { label: "Driver",         color: "text-amber-700",  bg: "bg-amber-100"  },
  customer:            { label: "Customer",       color: "text-green-700",  bg: "bg-green-100"  },
};

// Role display priority for grouping contacts
const STAFF_ROLE_ORDER = [
  "executive_admin", "admin", "manager", "branch_receptionist", "agent", "driver",
];

function getPrimaryRole(roles?: string[]): string {
  if (!roles || roles.length === 0) return "agent";
  for (const r of STAFF_ROLE_ORDER) {
    if (roles.includes(r)) return r;
  }
  return roles[0];
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? { label: role, color: "text-slate-600", bg: "bg-slate-100" };
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#1EA2E4", "#0A1628"], ["#A855F7", "#6366F1"], ["#22C55E", "#14B8A6"],
  ["#F59E0B", "#EF4444"], ["#EC4899", "#F97316"], ["#06B6D4", "#3B82F6"],
];

function avatarGradient(seed: string): [string, string] {
  const i = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[i];
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const [c1, c2] = avatarGradient(name);
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white`}
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface UIConversation {
  id: string;
  title?: string;
  user?: IUser;
  primaryRole: string;
  unreadCount: number;
  lastMessage?: { content: string; createdAt: Date };
  isOnline: boolean;
}

interface UIMessage {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  readBy: string[];
  isDeleted?: boolean;
}

const toUIMessage = (m: IChatMessage): UIMessage => ({
  id: m._id,
  content: m.content || "",
  createdAt: new Date(m.created_at),
  senderId: m.sender_id,
  readBy: m.read_by ?? [],
  isDeleted: m.is_deleted,
});

const getOtherParticipantId = (c: IChatConversation, myId: string) =>
  c.participants.find(p => p.user_id !== myId)?.user_id || myId;

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const formatAge = (date: Date) => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ChatAdminScreen() {
  const { token: authToken, user: me } = loadAuthFromStorage() || { token: null, user: null };
  const myId = me?._id ?? "";

  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "contacts">("chats");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [contacts, setContacts] = useState<IUser[]>([]);
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [messagesByConvo, setMessagesByConvo] = useState<Record<string, UIMessage[]>>({});
  const [selectedConvo, setSelectedConvo] = useState<UIConversation | null>(null);
  const [inputText, setInputText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [selfTyping, setSelfTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // ── responsive ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowChat(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByConvo, selectedConvo]);

  // ── initial load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authToken || !myId) { setLoading(false); setError("Not authenticated"); return; }
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the role-filtered contacts endpoint
        const [rawContacts, convos] = await Promise.all([
          fetchChatContacts(),
          fetchMyConversations(),
        ]);

        // Filter to staff roles only (exclude customers)
        const staffContacts = rawContacts.filter(u =>
          u.roles?.some(r => STAFF_ROLE_ORDER.includes(r))
        );
        setContacts(staffContacts);

        const contactMap = new Map(rawContacts.map(u => [u._id, u]));

        const uiConvos: UIConversation[] = convos.map(c => {
          const otherId = getOtherParticipantId(c, myId);
          // try enriched participant data first (populated by backend)
          const enrichedParticipant = c.participants.find(p => p.user_id === otherId);
          const user: IUser = contactMap.get(otherId) ?? {
            _id: otherId,
            full_name: enrichedParticipant?.full_name || "Unknown",
            roles: enrichedParticipant?.roles ?? [],
          };
          return {
            id: c._id,
            title: c.title,
            user,
            primaryRole: getPrimaryRole(user.roles),
            unreadCount: (c as any).unread_count ?? 0,
            lastMessage: c.last_message_at
              ? { content: c.last_message_preview || "", createdAt: new Date(c.last_message_at) }
              : undefined,
            isOnline: false,
          };
        });

        setConversations(uiConvos);
        const empty: Record<string, UIMessage[]> = {};
        uiConvos.forEach(c => (empty[c.id] = []));
        setMessagesByConvo(empty);
      } catch (e: unknown) {
        setError((e as Error)?.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    })();
  }, [authToken, myId]);

  // ── socket ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authToken) return;
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: `Bearer ${authToken}` },
    });
    socketRef.current = s;

    s.on("connect", () => {
      if (selectedConvo?.id) s.emit("chat:join_conversation", { conversationId: selectedConvo.id });
    });

    s.on("chat:message_created", ({ message }: { message: IChatMessage }) => {
      const ui = toUIMessage(message);
      setMessagesByConvo(prev => {
        const cid = message.conversation_id;
        const arr = prev[cid] || [];
        if (arr.some(m => m.id === ui.id)) return prev;
        const filtered = message.sender_id === myId
          ? arr.filter(m => {
              if (!m.id.startsWith("temp_")) return true;
              return !(m.content === ui.content && Math.abs(m.createdAt.getTime() - ui.createdAt.getTime()) < 30_000);
            })
          : arr;
        return { ...prev, [cid]: [...filtered, ui] };
      });
      setConversations(prev => prev.map(c =>
        c.id === message.conversation_id
          ? { ...c, lastMessage: { content: message.content || "", createdAt: new Date(message.created_at) },
              unreadCount: selectedConvo?.id === message.conversation_id ? 0 : c.unreadCount + 1 }
          : c
      ));
    });

    s.on("chat:message_read", ({ messageId, userId }: { messageId: string; userId: string }) => {
      setMessagesByConvo(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(cid => {
          next[cid] = next[cid].map(m => m.id === messageId ? { ...m, readBy: [...new Set([...m.readBy, userId])] } : m);
        });
        return next;
      });
    });

    s.on("chat:message_deleted", ({ messageId }: { messageId: string }) => {
      setMessagesByConvo(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(cid => {
          next[cid] = next[cid].map(m => m.id === messageId ? { ...m, content: "", isDeleted: true } : m);
        });
        return next;
      });
    });

    s.on("typing:started", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (conversationId === selectedConvo?.id && userId !== myId) setTyping(true);
    });
    s.on("typing:stopped", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (conversationId === selectedConvo?.id && userId !== myId) setTyping(false);
    });

    s.on("user:online", ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
      setConversations(prev => prev.map(c => c.user?._id === userId ? { ...c, isOnline: true } : c));
    });
    s.on("user:offline", ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => { const n = new Set(prev); n.delete(userId); return n; });
      setConversations(prev => prev.map(c => c.user?._id === userId ? { ...c, isOnline: false } : c));
    });
    s.on("user:online_status", ({ statuses }: { statuses: Record<string, boolean> }) => {
      const online = new Set(Object.entries(statuses).filter(([, v]) => v).map(([k]) => k));
      setOnlineUsers(online);
    });

    s.on("chat:error", (p: unknown) => console.warn("chat:error", p));

    return () => { s.disconnect(); socketRef.current = null; };
  }, [authToken, myId, selectedConvo?.id]);

  // ── typing events ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socketRef.current || !selectedConvo?.id) return;
    if (inputText.trim() && !selfTyping) {
      setSelfTyping(true);
      socketRef.current.emit("typing:start", { conversationId: selectedConvo.id });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (selfTyping) {
        socketRef.current?.emit("typing:stop", { conversationId: selectedConvo.id });
        setSelfTyping(false);
      }
    }, 1200);
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [inputText, selectedConvo?.id, selfTyping]);

  // ── helpers ───────────────────────────────────────────────────────────────────
  const openConversation = useCallback(async (c: UIConversation) => {
    setSelectedConvo(prev => {
      if (prev?.id && prev.id !== c.id) socketRef.current?.emit("chat:leave_conversation", { conversationId: prev.id });
      return c;
    });
    socketRef.current?.emit("chat:join_conversation", { conversationId: c.id });
    // check online status for the other user
    if (c.user?._id) socketRef.current?.emit("user:check_online", { userIds: [c.user._id] });
    setTyping(false);
    if (isMobile) setShowChat(true);
    setTimeout(() => inputRef.current?.focus(), 80);

    if (!messagesByConvo[c.id] || messagesByConvo[c.id].length === 0) {
      try {
        const list = await fetchMessages(c.id);
        setMessagesByConvo(prev => ({ ...prev, [c.id]: list.map(toUIMessage) }));
      } catch (e) { console.error("fetchMessages failed", e); }
    }
    setConversations(prev => prev.map(x => x.id === c.id ? { ...x, unreadCount: 0 } : x));
  }, [isMobile, messagesByConvo]);

  const startDirectWith = useCallback(async (user: IUser) => {
    const existing = conversations.find(c => c.user?._id === user._id);
    if (existing) { await openConversation(existing); setActiveTab("chats"); return; }
    try {
      const created = await createDirectConversation(user._id);
      const ui: UIConversation = {
        id: created._id,
        title: created.title,
        user,
        primaryRole: getPrimaryRole(user.roles),
        unreadCount: 0,
        lastMessage: created.last_message_at
          ? { content: created.last_message_preview || "", createdAt: new Date(created.last_message_at) }
          : undefined,
        isOnline: onlineUsers.has(user._id),
      };
      setConversations(prev => [ui, ...prev]);
      setMessagesByConvo(prev => ({ ...prev, [ui.id]: [] }));
      setActiveTab("chats");
      await openConversation(ui);
    } catch (e: unknown) {
      setError((e as Error)?.message || "Failed to start conversation");
    }
  }, [conversations, onlineUsers, openConversation]);

  const sendMessage = useCallback(async () => {
    if (!selectedConvo?.id || !inputText.trim()) return;
    const text = inputText.trim();
    const tempId = `temp_${Date.now()}`;

    setMessagesByConvo(prev => ({
      ...prev,
      [selectedConvo.id]: [...(prev[selectedConvo.id] || []), {
        id: tempId, content: text, createdAt: new Date(), senderId: myId, readBy: [myId],
      }],
    }));
    setConversations(prev => prev.map(c =>
      c.id === selectedConvo.id
        ? { ...c, lastMessage: { content: `You: ${text}`, createdAt: new Date() } }
        : c
    ));
    setInputText("");

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:send_message", { conversation_id: selectedConvo.id, content: text, attachments: [] });
      } else {
        const saved = await sendMessageRest(selectedConvo.id, text, []);
        const ui = toUIMessage(saved);
        setMessagesByConvo(prev => {
          const list = prev[selectedConvo.id] || [];
          const idx = list.findIndex(m => m.id === tempId);
          if (idx === -1) return prev;
          const next = [...list]; next[idx] = ui;
          return { ...prev, [selectedConvo.id]: next };
        });
      }
      if (selfTyping) {
        socketRef.current?.emit("typing:stop", { conversationId: selectedConvo.id });
        setSelfTyping(false);
      }
    } catch (e) {
      console.error("sendMessage failed", e);
      setMessagesByConvo(prev => ({
        ...prev,
        [selectedConvo.id]: (prev[selectedConvo.id] || []).filter(m => m.id !== tempId),
      }));
    }
  }, [inputText, myId, selectedConvo, selfTyping]);

  // auto mark last message read
  useEffect(() => {
    if (!selectedConvo) return;
    const arr = messagesByConvo[selectedConvo.id] || [];
    if (arr.length === 0) return;
    const last = arr[arr.length - 1];
    if (last.senderId !== myId) {
      markMessageRead(last.id).catch(() => null);
      socketRef.current?.emit("chat:mark_read", { messageId: last.id });
    }
  }, [messagesByConvo, selectedConvo, myId]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      socketRef.current?.emit("chat:delete_message", { messageId });
    } catch (e) { console.error("deleteMessage failed", e); }
  }, []);

  // ── derived data ──────────────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase();

  const filteredConversations = useMemo(() => conversations.filter(c => {
    const name = c.user?.full_name || c.title || "";
    return name.toLowerCase().includes(q) || (c.lastMessage?.content || "").toLowerCase().includes(q);
  }), [conversations, q]);

  const contactsByRole = useMemo(() => {
    const filtered = contacts.filter(u =>
      !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
    const groups: Record<string, IUser[]> = {};
    for (const u of filtered) {
      const role = getPrimaryRole(u.roles);
      if (!groups[role]) groups[role] = [];
      groups[role].push(u);
    }
    return groups;
  }, [contacts, q]);

  const displayMessages = selectedConvo ? (messagesByConvo[selectedConvo.id] || []) : [];
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const toggleGroup = (role: string) => setCollapsedGroups(p => ({ ...p, [role]: !p[role] }));

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main panel */}
      <div className="flex flex-1 lg:ml-72 h-screen overflow-hidden">

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className={`${isMobile ? (showChat ? "hidden" : "flex w-full") : "flex w-[340px]"} flex-col bg-white border-r border-slate-200`}>

          {/* header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200" style={{ background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, #132540 100%)` }}>
            <div className="flex items-center gap-3">
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-white text-[15px] font-bold leading-none">Team Chat</h1>
                <p className="text-white/50 text-xs mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: BRAND_BLUE }}>
                {totalUnread}
              </span>
            )}
          </div>

          {/* search */}
          <div className="px-3 py-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': BRAND_BLUE } as React.CSSProperties}
              />
            </div>
          </div>

          {/* tabs */}
          <div className="flex border-b border-slate-100">
            {(["chats", "contacts"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize flex items-center justify-center gap-1.5 ${activeTab === tab ? "text-white border-b-2" : "text-slate-500 hover:text-slate-700"}`}
                style={activeTab === tab ? { borderColor: BRAND_BLUE, color: BRAND_BLUE } : {}}>
                {tab === "chats" ? <MessageSquare className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                {tab}
              </button>
            ))}
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-52 gap-3">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND_BLUE, borderTopColor: "transparent" }} />
                <p className="text-xs text-slate-400">Loading…</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-500 mb-3">{error}</p>
                <button onClick={() => window.location.reload()} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg" style={{ background: BRAND_BLUE }}>Retry</button>
              </div>
            ) : activeTab === "chats" ? (
              /* ── Conversations list ── */
              filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                  <MessageSquare className="w-8 h-8 opacity-30" />
                  <p className="text-xs">{searchQuery ? "No results" : "No conversations yet"}</p>
                  {!searchQuery && (
                    <button onClick={() => setActiveTab("contacts")} className="text-xs font-semibold underline" style={{ color: BRAND_BLUE }}>Browse contacts</button>
                  )}
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const active = selectedConvo?.id === conv.id;
                  const name = conv.user?.full_name || conv.title || "Conversation";
                  return (
                    <button key={conv.id} onClick={async () => { setActiveTab("chats"); await openConversation(conv); }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-slate-50 transition-colors ${active ? "bg-[#1EA2E4]/8 border-l-2" : "hover:bg-slate-50"}`}
                      style={active ? { borderLeftColor: BRAND_BLUE } : {}}>
                      <div className="relative flex-shrink-0">
                        <Avatar name={name} size={10} />
                        {conv.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-sm font-semibold text-slate-800 truncate">{name}</span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {conv.lastMessage ? formatAge(conv.lastMessage.createdAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <RoleBadge role={conv.primaryRole} />
                            <p className="text-xs text-slate-500 truncate">{conv.lastMessage?.content || "No messages yet"}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: BRAND_BLUE }}>
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              /* ── Contacts list grouped by role ── */
              STAFF_ROLE_ORDER.filter(role => contactsByRole[role]?.length).map(role => {
                const meta = ROLE_META[role] ?? { label: role, color: "text-slate-600", bg: "bg-slate-100" };
                const group = contactsByRole[role];
                const collapsed = collapsedGroups[role];
                return (
                  <div key={role}>
                    <button onClick={() => toggleGroup(role)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${meta.color}`}>{meta.label}s</span>
                        <span className="text-[10px] text-slate-400">{group.length}</span>
                      </div>
                      {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    {!collapsed && group.map(u => {
                      const isOnline = onlineUsers.has(u._id);
                      const hasConvo = conversations.some(c => c.user?._id === u._id);
                      return (
                        <button key={u._id} onClick={() => startDirectWith(u)}
                          className="w-full text-left flex items-center gap-3 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <div className="relative flex-shrink-0">
                            <Avatar name={u.full_name || "?"} size={9} />
                            {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate leading-none">{u.full_name}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.email || ""}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasConvo && <div className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND_BLUE }} title="Active conversation" />}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat area ──────────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col ${isMobile ? (showChat ? "flex w-full" : "hidden") : "flex"}`}>
          {selectedConvo ? (
            <>
              {/* chat header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button onClick={() => { setShowChat(false); setSelectedConvo(null); }} className="p-1 rounded-lg hover:bg-slate-100">
                      <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                  )}
                  <div className="relative">
                    <Avatar name={selectedConvo.user?.full_name || selectedConvo.title || "C"} size={10} />
                    {selectedConvo.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 leading-none">
                        {selectedConvo.user?.full_name || selectedConvo.title || "Conversation"}
                      </h2>
                      <RoleBadge role={selectedConvo.primaryRole} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {typing ? <span className="text-emerald-600 animate-pulse">typing…</span>
                        : selectedConvo.isOnline ? "Active now" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
                <div className="max-w-3xl mx-auto space-y-2">
                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${BRAND_NAVY}20, ${BRAND_BLUE}20)` }}>
                        <Send className="w-7 h-7 -rotate-45" style={{ color: BRAND_BLUE }} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation below</p>
                    </div>
                  ) : displayMessages.map((msg, idx) => {
                    const mine = msg.senderId === myId;
                    const deleted = msg.isDeleted;
                    const showDateSep = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(displayMessages[idx - 1].createdAt).toDateString();
                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div className="flex justify-center my-3">
                            <span className="px-3 py-1 bg-white text-slate-400 text-[11px] rounded-full border border-slate-200 shadow-sm">
                              {msg.createdAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[72%] group">
                            <div className={`rounded-2xl px-4 py-2.5 ${mine ? "text-white rounded-br-sm" : "bg-white text-slate-900 rounded-bl-sm shadow-sm border border-slate-100"}`}
                              style={mine ? { background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #1891cd 100%)` } : {}}>
                              <p className={`text-sm leading-relaxed break-words ${deleted ? "italic opacity-50" : ""}`}>
                                {deleted ? "Message deleted" : msg.content}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 px-1 ${mine ? "justify-end" : "justify-start"}`}>
                              <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                              {mine && (msg.readBy?.length > 1
                                ? <CheckCheck className="w-3 h-3 text-emerald-500" />
                                : <Check className="w-3 h-3 text-slate-400" />
                              )}
                              {mine && !deleted && (
                                <button onClick={() => handleDeleteMessage(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-red-500 ml-1 transition-opacity">
                                  delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100">
                        <div className="flex gap-1">
                          {[0, 0.2, 0.4].map(d => (
                            <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* input */}
              <div className="bg-white border-t border-slate-200 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Message ${selectedConvo.user?.full_name || "contact"}…`}
                    className="flex-1 pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': BRAND_BLUE } as React.CSSProperties}
                  />
                  <button onClick={sendMessage} disabled={!inputText.trim()}
                    className="p-2.5 rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: inputText.trim() ? BRAND_BLUE : "#cbd5e1" }}>
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center px-6">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_BLUE} 100%)` }}>
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Admin Team Chat</h3>
                <p className="text-sm text-slate-500 mb-5 max-w-xs">
                  Communicate with your agents, drivers, receptionists, managers and executives.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-5">
                  {STAFF_ROLE_ORDER.map(role => {
                    const meta = ROLE_META[role];
                    if (!meta) return null;
                    const count = contacts.filter(u => u.roles?.includes(role)).length;
                    if (!count) return null;
                    return (
                      <span key={role} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                        {count} {meta.label}{count !== 1 ? "s" : ""}
                      </span>
                    );
                  })}
                </div>
                <button onClick={() => setActiveTab("contacts")}
                  className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90 flex items-center gap-2 mx-auto"
                  style={{ background: BRAND_BLUE }}>
                  <User className="w-4 h-4" /> Browse Contacts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
