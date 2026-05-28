"use client";

import { PlaydateRequest } from "@/types";
import { usePlaydates } from "@/hooks/usePlaydates";
import { useCommunity } from "@/hooks/useCommunity";
import { useDogs } from "@/hooks/useDogs";
import { BarkLoader } from "@/components/ui/BarkLoader";
import { Calendar, MapPin, Clock, Check, X, Send } from "lucide-react";
import { useState } from "react";

export function PlaydatesTab() {
  const { incoming, outgoing, upcoming, loading, respond, sendRequest } =
    usePlaydates();
  const { posts } = useCommunity();
  const { dogs } = useDogs();
  const [showInvite, setShowInvite] = useState(false);

  // Get unique other users from community posts (people to invite)
  const otherUsers = posts
    .filter(
      (p, i, arr) => arr.findIndex((x) => x.authorId === p.authorId) === i,
    )
    .map((p) => ({
      userId: p.authorId,
      userName: p.authorName,
      dogName: p.dogName,
      dogBreed: p.dogBreed,
    }));

  if (loading) {
    return <BarkLoader text="Sniffing for playdates..." />;
  }

  return (
    <div className="playdates-tab">
      <div className="playdates-tab__header">
        <h3>Playdates</h3>
        <button
          className="playdates-tab__invite-btn"
          onClick={() => setShowInvite(true)}
        >
          <Send size={14} />
          Invite
        </button>
      </div>

      {showInvite && (
        <PlaydateInviteForm
          otherUsers={otherUsers}
          dogs={dogs ?? []}
          onSubmit={async (data) => {
            await sendRequest(data);
            setShowInvite(false);
          }}
          onCancel={() => setShowInvite(false)}
        />
      )}

      {incoming.length > 0 && (
        <section className="playdates-tab__section">
          <h4>📬 Incoming Invites</h4>
          {incoming.map((req) => (
            <PlaydateCard
              key={req.id}
              request={req}
              type="incoming"
              onRespond={respond}
            />
          ))}
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="playdates-tab__section">
          <h4>📤 Sent Invites</h4>
          {outgoing.map((req) => (
            <PlaydateCard
              key={req.id}
              request={req}
              type="outgoing"
              onRespond={respond}
            />
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="playdates-tab__section">
          <h4>🎉 Upcoming Playdates</h4>
          {upcoming.map((req) => (
            <PlaydateCard
              key={req.id}
              request={req}
              type="upcoming"
              onRespond={respond}
            />
          ))}
        </section>
      )}

      {incoming.length === 0 &&
        outgoing.length === 0 &&
        upcoming.length === 0 && (
          <div className="playdates-tab__empty">
            <span className="playdates-tab__empty-icon">🐕‍🦺</span>
            <p>No playdates yet!</p>
            <p className="playdates-tab__empty-sub">
              Invite someone from the community for a walk together.
            </p>
          </div>
        )}
    </div>
  );
}

function PlaydateCard({
  request,
  type,
  onRespond,
}: {
  request: PlaydateRequest;
  type: "incoming" | "outgoing" | "upcoming";
  onRespond: (id: string, status: "accepted" | "declined") => void;
}) {
  return (
    <div className={`playdate-card playdate-card--${type}`}>
      <div className="playdate-card__dogs">
        <span className="playdate-card__dog">{request.fromDogName}</span>
        <span className="playdate-card__x">×</span>
        <span className="playdate-card__dog">{request.toDogName}</span>
      </div>
      <div className="playdate-card__details">
        <div className="playdate-card__detail">
          <MapPin size={13} />
          <span>{request.location}</span>
        </div>
        <div className="playdate-card__detail">
          <Calendar size={13} />
          <span>{new Date(request.proposedDate).toLocaleDateString()}</span>
        </div>
        <div className="playdate-card__detail">
          <Clock size={13} />
          <span>{request.proposedTime}</span>
        </div>
      </div>
      {request.message && (
        <p className="playdate-card__message">
          &ldquo;{request.message}&rdquo;
        </p>
      )}
      {type === "incoming" && (
        <div className="playdate-card__actions">
          <button
            className="playdate-card__accept"
            onClick={() => onRespond(request.id, "accepted")}
          >
            <Check size={14} /> Accept
          </button>
          <button
            className="playdate-card__decline"
            onClick={() => onRespond(request.id, "declined")}
          >
            <X size={14} /> Decline
          </button>
        </div>
      )}
      {type === "outgoing" && (
        <span className="playdate-card__status">⏳ Waiting for reply...</span>
      )}
    </div>
  );
}

interface InviteFormProps {
  otherUsers: {
    userId: string;
    userName: string;
    dogName: string;
    dogBreed: string;
  }[];
  dogs: { id: string; name: string; breed: string }[];
  onSubmit: (data: {
    toUserId: string;
    toUserName: string;
    toDogName: string;
    toDogBreed: string;
    fromDogName: string;
    fromDogBreed: string;
    location: string;
    proposedDate: string;
    proposedTime: string;
    message: string;
  }) => Promise<void>;
  onCancel: () => void;
}

function PlaydateInviteForm({
  otherUsers,
  dogs,
  onSubmit,
  onCancel,
}: InviteFormProps) {
  const [selectedUser, setSelectedUser] = useState(otherUsers[0]?.userId ?? "");
  const [selectedDog, setSelectedDog] = useState(dogs[0]?.id ?? "");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUser || !location.trim()) return;
    const toUser = otherUsers.find((u) => u.userId === selectedUser);
    const fromDog = dogs.find((d) => d.id === selectedDog);
    if (!toUser || !fromDog) return;

    setSubmitting(true);
    await onSubmit({
      toUserId: toUser.userId,
      toUserName: toUser.userName,
      toDogName: toUser.dogName,
      toDogBreed: toUser.dogBreed,
      fromDogName: fromDog.name,
      fromDogBreed: fromDog.breed,
      location: location.trim(),
      proposedDate: date,
      proposedTime: time,
      message: message.trim(),
    });
    setSubmitting(false);
  };

  if (otherUsers.length === 0) {
    return (
      <div className="playdate-invite-form">
        <p className="playdate-invite-form__empty">
          No community members yet. Post in the community first to discover
          others! 🐶
        </p>
        <button className="playdate-invite-form__cancel" onClick={onCancel}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="playdate-invite-form">
      <h4>Invite to Walk 🐕</h4>

      <label>
        <span>Invite who?</span>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          {otherUsers.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.userName} ({u.dogName})
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Your dog</span>
        <select
          value={selectedDog}
          onChange={(e) => setSelectedDog(e.target.value)}
        >
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Where? (park/location)</span>
        <input
          type="text"
          placeholder="e.g. Central Park Dog Run"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
        />
      </label>

      <div className="playdate-invite-form__row">
        <label>
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          <span>Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>

      <label>
        <span>Message (optional)</span>
        <input
          type="text"
          placeholder="Let's walk together!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={140}
        />
      </label>

      <div className="playdate-invite-form__actions">
        <button onClick={onCancel} className="playdate-invite-form__cancel">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!location.trim() || submitting}
          className="playdate-invite-form__submit"
        >
          {submitting ? "Sending..." : "Send Invite 🐾"}
        </button>
      </div>
    </div>
  );
}
