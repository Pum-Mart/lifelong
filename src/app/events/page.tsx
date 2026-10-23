'use client';

import React, { useState, useEffect } from 'react';
import { WorkshopEvent } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  Video, 
  Building2,
  Share2
} from 'lucide-react';

export default function EventsPage() {
  const { showNotification, requireLogin, currentUser } = useApp();
  const [events, setEvents] = useState<WorkshopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFormat, setFilterFormat] = useState<'all' | 'Online' | 'In-Person'>('all');
  const [rsvpdEventIds, setRsvpdEventIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
          setRsvpdEventIds(data.rsvpdEventIds || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [currentUser?.id]);

  const handleRSVP = async (event: WorkshopEvent) => {
    if (rsvpdEventIds.includes(event.id)) {
      showNotification('You have already reserved a seat for this session!', 'info');
      return;
    }
    if (!requireLogin()) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      });
      const data = await res.json();
      if (!data.success) {
        showNotification(data.error || 'Could not reserve a seat', 'warning');
        return;
      }
      setRsvpdEventIds(prev => [...prev, event.id]);
      setEvents(prev => prev.map(e => e.id === event.id ? data.event : e));
      showNotification(
        data.alreadyBooked
          ? 'You have already reserved a seat for this session!'
          : `Seat confirmed for "${event.title}"! We'll email you the link & reminders.`,
        data.alreadyBooked ? 'info' : undefined
      );
    } catch (err) {
      console.error(err);
      showNotification('Could not reach the server', 'warning');
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterFormat !== 'all' && e.format !== filterFormat) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5" />
          <span>Interactive Campus & Web Broadcasts</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Live Workshops, Masterclasses & Q&A Clinics
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Connect with faculty mentors and peer scholars in real-time. Ask questions, participate in hands-on workshops, and engage with our vibrant lifelong learning community.
        </p>
      </div>

      {/* Filter Format Pills */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterFormat('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            filterFormat === 'all'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Events
        </button>
        <button
          onClick={() => setFilterFormat('Online')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            filterFormat === 'Online'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Live Online Webinars</span>
        </button>
        <button
          onClick={() => setFilterFormat('In-Person')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            filterFormat === 'In-Person'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>In-Person Campus Workshops</span>
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map(event => {
            const isRSVPed = rsvpdEventIds.includes(event.id);
            const seatsRemaining = event.seatsTotal - event.seatsBooked;
            return (
              <div
                key={event.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm hover:shadow-lg transition flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Event Left Info */}
                <div className="space-y-4 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      event.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {event.isFree ? 'Free Community Session' : `$${event.price} Masterclass`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1">
                      {event.format === 'Online' ? <Video className="w-3 h-3 text-emerald-600" /> : <Building2 className="w-3 h-3 text-indigo-600" />}
                      <span>{event.format}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{event.category}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {event.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={event.instructorAvatar}
                      alt={event.instructorName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                    <div className="text-xs">
                      <span className="text-slate-400">Led by </span>
                      <strong className="text-slate-800">{event.instructorName}</strong>
                    </div>
                  </div>
                </div>

                {/* Event Right Action & Capacity */}
                <div className="shrink-0 flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 space-y-4">
                  <div className="text-left md:text-right space-y-1">
                    <div className="text-xs font-bold text-slate-500 flex items-center md:justify-end gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Capacity: {event.seatsBooked} / {event.seatsTotal} Seats</span>
                    </div>
                    <p className={`text-xs font-semibold ${seatsRemaining < 10 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {seatsRemaining > 0 ? `${seatsRemaining} seats remaining` : 'Session at full capacity'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRSVP(event)}
                    disabled={isRSVPed || seatsRemaining <= 0}
                    className={`w-full md:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition ${
                      isRSVPed
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : seatsRemaining <= 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isRSVPed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Seat Confirmed ✓</span>
                      </>
                    ) : (
                      <span>Reserve Your Seat</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
