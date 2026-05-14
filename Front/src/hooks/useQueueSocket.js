import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

/**
 * useQueueSocket
 *
 * Connects to the Socket.io server and listens for live queue updates.
 * Also polls the REST API on mount to get initial data immediately.
 *
 * @param {object} params
 * @param {string} params.sessionToken  - Public session token from SMS link
 * @param {string} params.clinicId      - Clinic ID (from initial REST fetch)
 * @param {string} params.doctorId      - Doctor ID (from initial REST fetch)
 * @param {string} params.date          - Date string "YYYY-MM-DD"
 * @param {number} params.myToken       - Patient's own token number
 *
 * @returns {object} { queueData, connected, error }
 */
export function useQueueSocket({ sessionToken, clinicId, doctorId, date, myToken }) {
  const socketRef = useRef(null);

  const [connected,  setConnected]  = useState(false);
  const [error,      setError]      = useState(null);
  const [queueData,  setQueueData]  = useState(null);

  // Derive patient-specific fields from raw queue snapshot
  const enrichQueueData = useCallback((raw, token) => {
    if (!raw) return null;

    const myRecord   = raw.patients?.find((p) => p.token === token);
    const myStatus   = myRecord ? myRecord.status : 'waiting';
    const aheadCount = (raw.patients || []).filter(
      (p) => p.status === 'waiting' && p.token < token
    ).length;

    return {
      ...raw,
      myToken:      token,
      myStatus,
      aheadCount,
      estWaitMins:  aheadCount * 5,
    };
  }, []);

  useEffect(() => {
    if (!clinicId || !doctorId || !date || !myToken) return;

    // ── Connect to Socket.io ──────────────────────────────────────
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('🔌 Socket connected:', socket.id);

      // Join the room for this specific doctor's queue
      socket.emit('join_queue', { clinicId, doctorId, date });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError('Connection lost. Retrying…');
      console.error('Socket error:', err.message);
    });

    // ── Listen for queue updates broadcast by server ──────────────
    socket.on('queue_update', (raw) => {
      console.log('📡 queue_update received:', raw);
      setQueueData(enrichQueueData(raw, myToken));
    });

    return () => {
      socket.disconnect();
    };
  }, [clinicId, doctorId, date, myToken, enrichQueueData]);

  return { queueData, connected, error };
}