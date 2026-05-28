"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  createPlaydateRequest,
  respondToPlaydate,
  subscribeToPlaydateRequests,
} from "@/lib/repositories";
import { PlaydateRequest, PlaydateStatus } from "@/types";
import toast from "react-hot-toast";

export function usePlaydates() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<PlaydateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const playdatesLoading = !user ? false : loading;

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToPlaydateRequests(user.uid, (data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const incoming = requests.filter(
    (r) => r.toUserId === user?.uid && r.status === "pending",
  );
  const outgoing = requests.filter(
    (r) => r.fromUserId === user?.uid && r.status === "pending",
  );
  const upcoming = requests.filter((r) => r.status === "accepted");

  const sendRequest = useCallback(
    async (data: {
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
    }) => {
      if (!user || !profile) return;
      try {
        await createPlaydateRequest({
          fromUserId: user.uid,
          fromUserName: profile.displayName,
          fromDogName: data.fromDogName,
          fromDogBreed: data.fromDogBreed,
          toUserId: data.toUserId,
          toUserName: data.toUserName,
          toDogName: data.toDogName,
          toDogBreed: data.toDogBreed,
          location: data.location,
          proposedDate: data.proposedDate,
          proposedTime: data.proposedTime,
          message: data.message,
        });
        toast.success("Playdate invite sent! 🐾");
      } catch (err) {
        console.error("Failed to send playdate request:", err);
        toast.error("Failed to send invite.");
      }
    },
    [user, profile],
  );

  const respond = useCallback(
    async (requestId: string, status: PlaydateStatus) => {
      try {
        await respondToPlaydate(requestId, status);
        toast.success(
          status === "accepted" ? "Playdate accepted! 🎉" : "Declined",
        );
      } catch (err) {
        console.error("Failed to respond:", err);
        toast.error("Failed to respond.");
      }
    },
    [],
  );

  return {
    requests,
    incoming,
    outgoing,
    upcoming,
    loading: playdatesLoading,
    sendRequest,
    respond,
  };
}
