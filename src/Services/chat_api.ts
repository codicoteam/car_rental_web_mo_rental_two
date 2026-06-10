import axios from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem("car_rental_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface IUser {
  _id: string;
  full_name: string;
  email?: string;
  roles?: string[];
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string | Date;
}

export interface IParticipant {
  user_id: string;
  role_at_time?: string | null;
  joined_at?: string;
}

export interface IChatConversation {
  _id: string;
  title?: string;
  participants: IParticipant[];
  type: "direct" | "group";
  context_type?:
    | "general"
    | "reservation"
    | "driver_booking"
    | "support"
    | "other";
  context_id?: string | null;
  created_by: string;
  last_message_at?: string | null;
  last_message_preview?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IAttachment {
  type: "image" | "file";
  url: string;
  filename?: string;
}

export interface IChatMessage {
  _id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: IAttachment[];
  message_type: "user" | "system";
  read_by: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchAllUsers(): Promise<IUser[]> {
  const res = await axios.get(`${API_BASE}/users`, { headers: authHeaders() });
  const data = (res.data?.data ?? res.data?.users ?? res.data) as any;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  throw new Error("Unexpected users response");
}

export async function fetchMyConversations(): Promise<IChatConversation[]> {
  const res = await axios.get(`${API_BASE}/chats/conversations`, {
    headers: authHeaders(),
  });
  return (res.data?.data ?? []) as IChatConversation[];
}

export async function createDirectConversation(
  otherUserId: string
): Promise<IChatConversation> {
  const body = {
    title: "start",
    participant_ids: [otherUserId],
    type: "direct",
    context_type: "general",
  };
  console.log("Creating direct conversation with body:", JSON.stringify(body));
  const res = await axios.post(
    `${API_BASE}/chats/conversations`,
    JSON.stringify(body), // ensure raw JSON body
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json", // make intent explicit
        Accept: "application/json",
      },
    }
  );

  return res.data?.data as IChatConversation;
}

export async function fetchConversationById(
  conversationId: string
): Promise<IChatConversation> {
  const res = await axios.get(
    `${API_BASE}/chats/conversations/${conversationId}`,
    { headers: authHeaders() }
  );
  return res.data?.data as IChatConversation;
}

export async function fetchMessages(
  conversationId: string
): Promise<IChatMessage[]> {
  const res = await axios.get(
    `${API_BASE}/chats/conversations/${conversationId}/messages`,
    { headers: authHeaders() }
  );
  return (res.data?.data ?? []) as IChatMessage[];
}

export async function sendMessageRest(
  conversationId: string,
  content: string,
  attachments: IAttachment[] = []
): Promise<IChatMessage> {
  const body = { conversation_id: conversationId, content, attachments };
  const res = await axios.post(`${API_BASE}/chats/messages`, body, {
    headers: authHeaders(),
  });
  return res.data?.data as IChatMessage;
}

export async function markMessageRead(messageId: string): Promise<void> {
  await axios.post(
    `${API_BASE}/chats/messages/${messageId}/read`,
    {},
    { headers: authHeaders() }
  );
}

export async function deleteMessage(messageId: string): Promise<void> {
  await axios.delete(`${API_BASE}/chats/messages/${messageId}`, {
    headers: authHeaders(),
  });
}

export default {};
