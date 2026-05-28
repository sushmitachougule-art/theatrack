"use client";

import AppLayout from "@/components/layout/AppLayout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <AppLayout>
      <div className="messages-page">
        <div className="messages-page__header">
          <div
            className="messages-page__icon"
            style={{ background: "var(--color-primary-bg)" }}
          >
            <MessageCircle
              size={20}
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div>
            <h1>Messages</h1>
            <p>Chat with other dog owners</p>
          </div>
        </div>
        <ChatPanel />
      </div>
    </AppLayout>
  );
}
