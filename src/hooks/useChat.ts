"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import {
  getOrCreateChatThread,
  subscribeToChatThreads,
  subscribeToChatMessages,
  sendChatMessage,
  markThreadAsRead,
} from "@/lib/repositories";
import { ChatThread, ChatMessage } from "@/types";
import toast from "react-hot-toast";

export function useChatThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  const threadsLoading = !user ? false : loading;

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChatThreads(user.uid, (data) => {
      setThreads(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const totalUnread = threads.reduce(
    (sum, t) => sum + (t.unreadCount?.[user?.uid ?? ""] || 0),
    0,
  );

  const startChat = useCallback(
    async (
      otherUserId: string,
      otherUserName: string,
      otherUserAvatar: string | null,
    ): Promise<string | null> => {
      if (!user) return null;
      try {
        const threadId = await getOrCreateChatThread(
          user.uid,
          user.displayName ?? "User",
          user.photoURL ?? null,
          otherUserId,
          otherUserName,
          otherUserAvatar,
        );
        return threadId;
      } catch (err) {
        console.error("Failed to start chat:", err);
        toast.error("Failed to start chat.");
        return null;
      }
    },
    [user],
  );

  return { threads, loading: threadsLoading, totalUnread, startChat };
}

export function useChatMessages(threadId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const markedRef = useRef(false);

  const messagesLoading = !threadId ? false : loading;

  useEffect(() => {
    if (!threadId) return;
    markedRef.current = false;
    const unsub = subscribeToChatMessages(threadId, (data) => {
      setMessages(data);
      setLoading(false);
      // Mark as read on first load
      if (!markedRef.current && user) {
        markedRef.current = true;
        markThreadAsRead(threadId, user.uid).catch(() => {});
      }
    });
    return () => unsub();
  }, [threadId, user]);

  const send = useCallback(
    async (text: string, otherUserId: string) => {
      if (!user || !threadId || !text.trim()) return;
      setSending(true);
      try {
        await sendChatMessage(
          threadId,
          user.uid,
          user.displayName ?? "User",
          text.trim(),
          otherUserId,
        );
      } catch (err) {
        console.error("Failed to send message:", err);
        toast.error("Failed to send.");
      } finally {
        setSending(false);
      }
    },
    [user, threadId],
  );

  return { messages, loading: messagesLoading, sending, send };
}
