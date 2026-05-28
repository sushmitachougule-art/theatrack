"use client";

import { useChatThreads, useChatMessages } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { ChatThread } from "@/types";
import { BarkLoader } from "@/components/ui/BarkLoader";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ChatPanel() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);

  if (activeThreadId && activeThread) {
    return (
      <ChatConversation
        thread={activeThread}
        onBack={() => {
          setActiveThreadId(null);
          setActiveThread(null);
        }}
      />
    );
  }

  return (
    <ChatThreadList
      onSelectThread={(thread) => {
        setActiveThreadId(thread.id);
        setActiveThread(thread);
      }}
    />
  );
}

function ChatThreadList({
  onSelectThread,
}: {
  onSelectThread: (thread: ChatThread) => void;
}) {
  const { threads, loading } = useChatThreads();
  const { user } = useAuth();

  if (loading) {
    return <BarkLoader text="Loading messages..." size="sm" />;
  }

  if (threads.length === 0) {
    return (
      <div className="chat-panel__empty">
        <span className="chat-panel__empty-icon">💬</span>
        <p>No conversations yet</p>
        <p className="chat-panel__empty-sub">
          Tap the message icon on a community post to start chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="chat-panel__threads">
      {threads.map((thread) => {
        const otherId = thread.participants.find((p) => p !== user?.uid) ?? "";
        const otherName = thread.participantNames?.[otherId] ?? "User";
        const otherAvatar = thread.participantAvatars?.[otherId];
        const unread = thread.unreadCount?.[user?.uid ?? ""] || 0;

        return (
          <button
            key={thread.id}
            className="chat-thread-item"
            onClick={() => onSelectThread(thread)}
          >
            <div className="chat-thread-item__avatar">
              {otherAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherAvatar} alt="" />
              ) : (
                <span>{otherName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="chat-thread-item__content">
              <div className="chat-thread-item__top">
                <span className="chat-thread-item__name">{otherName}</span>
                {unread > 0 && (
                  <span className="chat-thread-item__badge">{unread}</span>
                )}
              </div>
              <p className="chat-thread-item__preview">
                {thread.lastMessage || "Start chatting!"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ChatConversation({
  thread,
  onBack,
}: {
  thread: ChatThread;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const otherId = thread.participants.find((p) => p !== user?.uid) ?? "";
  const otherName = thread.participantNames?.[otherId] ?? "User";
  const { messages, loading, sending, send } = useChatMessages(thread.id);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    await send(msg, otherId);
  };

  return (
    <div className="chat-conversation">
      <div className="chat-conversation__header">
        <button className="chat-conversation__back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="chat-conversation__name">{otherName}</span>
      </div>

      <div className="chat-conversation__messages" ref={scrollRef}>
        {loading ? (
          <BarkLoader text="Loading chat..." size="sm" />
        ) : messages.length === 0 ? (
          <div className="chat-conversation__empty">
            <p>🐶 Say hi! Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble ${msg.senderId === user?.uid ? "chat-bubble--mine" : "chat-bubble--theirs"}`}
            >
              <p>{msg.text}</p>
              <span className="chat-bubble__time">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="chat-conversation__input">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          maxLength={500}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="chat-conversation__send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
