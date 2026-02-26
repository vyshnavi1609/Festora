/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  User as UserIcon, 
  MessageCircle, 
  Bookmark, 
  Calendar,
  MapPin,
  Send,
  MoreHorizontal,
  ChevronLeft,
  Settings,
  ShieldCheck,
  Users,
  BarChart3,
  X,
  Bell,
  Edit3,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  CalendarPlus,
  Trash2,
  UserPlus,
  QrCode,
  Globe,
  Eye,
  EyeOff,
  Instagram,
  Twitter,
  Linkedin,
  BellRing,
  Share2,
  Github,
  Plus,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { QRCodeCanvas } from 'qrcode.react';
import { User, Event, Role, RoleRequest, Message, Comment, Analytics, Notification } from './types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const ImagePicker = ({ onImageSelected, currentImage }: { onImageSelected: (base64: string) => void, currentImage?: string }) => {
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelected(reader.result as string);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setShowOptions(true)}
        className="w-32 h-32 rounded-[40px] bg-zinc-100 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer group hover:border-indigo-400 transition-all overflow-hidden shadow-sm mx-auto"
      >
        {currentImage ? (
          <img src={currentImage} alt="selected" className="w-full h-full object-cover" />
        ) : (
          <>
            <Upload size={24} className="text-zinc-400 group-hover:text-indigo-500 mb-2" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Pick Image</span>
          </>
        )}
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-3xl shadow-2xl border border-zinc-100 p-2 flex gap-2 z-[100] min-w-[200px]"
          >
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 p-4 hover:bg-zinc-50 rounded-2xl transition-colors"
            >
              <PlusSquare size={20} className="text-indigo-600" />
              <span className="text-[9px] font-black uppercase tracking-widest">Gallery</span>
            </button>
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 p-4 hover:bg-zinc-50 rounded-2xl transition-colors"
            >
              <Upload size={20} className="text-emerald-600" />
              <span className="text-[9px] font-black uppercase tracking-widest">Camera</span>
            </button>
            <button 
              onClick={() => setShowOptions(false)}
              className="p-4 text-zinc-400 hover:text-zinc-900"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="user" 
        onChange={handleFileChange} 
      />
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (t: string) => void, user: User | null }) => {
  const tabs = [
    { id: 'home', icon: Home, color: 'text-indigo-600' },
    { id: 'discover', icon: Instagram, color: 'text-rose-500' },
    { id: 'promotions', icon: Search, color: 'text-rose-500' },
    { id: 'create', icon: PlusSquare, roles: ['admin', 'council_president', 'club_president', 'club_member'], color: 'text-emerald-500' },
    { id: 'messages', icon: MessageCircle, color: 'text-violet-500' },
    // activity moved into Settings (accessible from Settings -> Your Activity)
    { id: 'profile', icon: UserIcon, color: 'text-amber-500' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        if (tab.roles && (!user || !tab.roles.includes(user.role))) return null;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 transition-all relative group ${activeTab === tab.id ? `${tab.color} scale-125` : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <Icon size={24} strokeWidth={activeTab === tab.id ? 3 : 2} className="transition-transform group-active:scale-90" />
            {activeTab === tab.id && (
              <motion.div 
                layoutId="navDot"
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-lg ${tab.color.replace('text-', 'bg-')} shadow-current`} 
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

interface EventCardProps {
  event: Event;
  user: User;
  onRegister: (id: number) => void;
  onUnregister: (id: number) => void;
  onSave: (id: number) => void;
  onMessage: (id: number) => void;
  onEdit: (event: Event) => void;
  onRefresh: () => void;
  onViewProfile: (userId: number) => void;
  onShare: (event: Event) => void;
  onViewDetails: (event: Event) => void;
  isRegistered: boolean;
  isLiked: boolean;
  onLike: () => void;
}

const EventDetailsModal = ({ isOpen, onClose, event, user, onRegister, onSave, onMessage, onEdit, onRefresh, onViewProfile, onShare }: { isOpen: boolean, onClose: () => void, event: Event, user: User, onRegister: (id: number) => void, onSave: (id: number) => void, onMessage: (id: number) => void, onEdit: (event: Event) => void, onRefresh: () => void, onViewProfile: (userId: number) => void, onShare: (event: Event) => void }) => {
  const addToCalendar = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const date = new Date(event.date).toISOString().replace(/-|:|\.\d+/g, "");
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${date}/${date}`;
    window.open(googleUrl, '_blank');
  };

  const setReminder = async () => {
    const remindAt = new Date(event.date);
    remindAt.setHours(remindAt.getHours() - 1); // 1 hour before
    await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, event_id: event.id, remind_at: remindAt.toISOString() })
    });
    alert('Reminder set for 1 hour before the event!');
  };

  const getCategoryClass = (category?: string) => {
    switch (category) {
      case 'Workshop': return 'category-workshop';
      case 'Social': return 'category-social';
      case 'Academic': return 'category-academic';
      case 'Concert': return 'category-concert';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] overflow-y-auto no-scrollbar"
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 sm:p-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row">
              <div className="md:w-1/2 aspect-[4/5] md:aspect-auto relative">
                <img 
                  src={event.image_url || `https://picsum.photos/seed/${event.id}/800/1000`} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute top-8 left-8 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border shadow-2xl ${getCategoryClass(event.category)}`}>
                  {event.category || 'Social'}
                </div>
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="md:w-1/2 p-10 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div 
                    className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden border-2 border-zinc-100 shadow-sm cursor-pointer"
                    onClick={() => { onClose(); onViewProfile(event.created_by); }}
                  >
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.organizer_name}`} alt="organizer" />
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-950 tracking-tight">{event.organizer_name}</h4>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Event Organizer</p>
                  </div>
                </div>

                <h2 className="text-4xl font-black tracking-tighter text-zinc-950 mb-4 leading-none">{event.title}</h2>
                
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center gap-3 text-zinc-500">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</p>
                      <p className="text-xs font-bold text-zinc-950">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location</p>
                      <p className="text-xs font-bold text-zinc-950">{event.location}</p>
                    </div>
                  </div>
                </div>

                <p className="text-zinc-600 leading-relaxed mb-10 font-medium">{event.description}</p>

                <div className="bg-zinc-50 rounded-[32px] p-8 mb-10 flex items-center gap-8 border border-zinc-100">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100">
                    <QRCodeCanvas value={`campus-events://event/${event.id}`} size={100} />
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-zinc-950 mb-1">Event Pass</h5>
                    <p className="text-[10px] text-zinc-400 font-medium leading-tight">Scan this QR code at the entrance for quick check-in.</p>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => onRegister(event.id)}
                      className="btn-primary flex-1 py-5 text-xs"
                    >
                      Register Now
                    </button>
                    <button 
                      onClick={() => onSave(event.id)}
                      className="w-16 h-16 bg-zinc-50 text-zinc-400 hover:text-amber-600 rounded-2xl flex items-center justify-center transition-all border border-zinc-100 active:scale-90"
                    >
                      <Bookmark size={24} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => onMessage(event.created_by)}
                      className="w-16 h-16 bg-zinc-50 text-zinc-400 hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all border border-zinc-100 active:scale-90"
                    >
                      <Send size={24} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={addToCalendar}
                      className="bg-zinc-50 text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-100 flex items-center justify-center gap-2 border border-zinc-100"
                    >
                      <CalendarPlus size={18} strokeWidth={2.5} /> Add to Calendar
                    </button>
                    <button 
                      onClick={setReminder}
                      className="bg-zinc-50 text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-100 flex items-center justify-center gap-2 border border-zinc-100"
                    >
                      <BellRing size={18} strokeWidth={2.5} /> Set Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const EventCard: React.FC<EventCardProps> = ({ event, user, onRegister, onUnregister, onSave, onMessage, onEdit, onRefresh, onViewProfile, onShare, onViewDetails, isRegistered, isLiked, onLike }) => {
  const [showComments, setShowComments] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [organizerAvatar, setOrganizerAvatar] = useState<string | null>(null);
  const canEdit = user.role === 'admin' || user.role === 'council_president' || (user.role === 'club_president' && event.created_by === user.id);

  useEffect(() => {
    fetch(`/api/users/${event.created_by}?requester=${user.id}`)
      .then(res => res.json())
      .then(data => setOrganizerAvatar(data.avatar_url));
    
    fetch(`/api/likes/count/${event.id}`)
      .then(res => res.json())
      .then(data => setLikeCount(data.count));
  }, [event.created_by, event.id]);

  const handleLike = async () => {
    if (isLiked) {
      await fetch(`/api/likes/${user.id}/${event.id}`, { method: 'DELETE' });
      setLikeCount(Math.max(0, likeCount - 1));
    } else {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, event_id: event.id })
      });
      setLikeCount(likeCount + 1);
    }
    onLike?.();
  };

  const handleView = async () => {
    await fetch(`/api/events/${event.id}/view`, { method: 'POST' });
    onRefresh();
  };

  const addToCalendar = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const date = new Date(event.date).toISOString().replace(/-|:|\.\d+/g, "");
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${date}/${date}`;
    window.open(googleUrl, '_blank');
  };

  const setReminder = async () => {
    const remindAt = new Date(event.date);
    remindAt.setHours(remindAt.getHours() - 1); // 1 hour before
    await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, event_id: event.id, remind_at: remindAt.toISOString() })
    });
    alert('Reminder set for 1 hour before the event!');
  };

  const getCategoryClass = (category?: string) => {
    switch (category) {
      case 'Workshop': return 'category-workshop';
      case 'Social': return 'category-social';
      case 'Academic': return 'category-academic';
      case 'Concert': return 'category-concert';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="bg-white mb-10 rounded-[40px] overflow-hidden border border-zinc-100 card-shadow transition-all hover:translate-y-[-4px]" onMouseEnter={handleView}>
      <div className="flex items-center p-6">
        <div 
          className="w-12 h-12 rounded-[20px] vibrant-gradient p-0.5 shadow-xl shadow-indigo-100 cursor-pointer transition-transform active:scale-90"
          onClick={() => onViewProfile(event.created_by)}
        >
          <div className="w-full h-full rounded-[18px] bg-white overflow-hidden border-2 border-white">
            <img src={organizerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.organizer_name}`} alt="organizer" loading="lazy" />
          </div>
        </div>
        <div className="flex-1 ml-4 cursor-pointer" onClick={() => onViewProfile(event.created_by)}>
          <p className="text-sm font-black text-zinc-950 tracking-tight">{event.organizer_name}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{event.location}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowQR(true)} className="p-3 text-zinc-400 hover:text-indigo-600 transition-all rounded-2xl hover:bg-indigo-50 active:scale-90">
            <QrCode size={20} strokeWidth={2.5} />
          </button>
          {canEdit && (
            <button onClick={() => onEdit(event)} className="p-3 text-zinc-400 hover:text-indigo-600 transition-all rounded-2xl hover:bg-indigo-50 active:scale-90">
              <Edit3 size={20} strokeWidth={2.5} />
            </button>
          )}
          <button className="p-3 text-zinc-400 hover:bg-zinc-50 rounded-2xl transition-all active:scale-90">
            <MoreHorizontal size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="aspect-[4/5] w-full bg-zinc-50 relative group overflow-hidden cursor-pointer" onClick={() => onViewDetails(event)}>
        <img 
          src={event.image_url || `https://picsum.photos/seed/${event.id}/800/1000`} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className={`absolute top-6 right-6 bg-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-2xl ${getCategoryClass(event.category)}`}>
          {event.category || 'Social'}
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${getCategoryClass(event.category)}`}>
            {event.category || 'Social'}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-6">
              <button onClick={handleLike} className={`transition-all active:scale-90 hover:scale-125 ${isLiked ? 'text-rose-600' : 'text-zinc-950'}`}>
                <Heart size={30} strokeWidth={2.5} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => setShowComments(true)} className="text-zinc-950 hover:text-indigo-600 hover:scale-125 transition-all active:scale-90">
                <MessageCircle size={30} strokeWidth={2.5} />
              </button>
              <button onClick={() => onMessage(event.created_by)} className="text-zinc-950 hover:text-blue-600 hover:scale-125 transition-all active:scale-90">
                <Send size={30} strokeWidth={2.5} />
              </button>
              <button onClick={() => onShare(event)} className="text-zinc-950 hover:text-emerald-600 hover:scale-125 transition-all active:scale-90">
                <Share2 size={30} strokeWidth={2.5} />
              </button>
            </div>
            <button onClick={() => onSave(event.id)} className="text-zinc-950 hover:text-amber-600 hover:scale-125 transition-all active:scale-90">
              <Bookmark size={30} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="space-y-3 cursor-pointer" onClick={() => onViewDetails(event)}>
          <p className="text-sm font-black text-zinc-950 tracking-tight">
            <span className="text-rose-600">{likeCount}</span> likes • <span className="text-emerald-600">{event.registration_count || 0}</span> / <span className="text-zinc-500">{event.capacity || '∞'}</span> registered • <span className="text-zinc-500">{event.views || 0} views</span>
          </p>
          <div className="text-sm leading-relaxed cursor-pointer" onClick={() => onViewDetails(event)}>
            <span className="font-black mr-2 text-zinc-950">{event.organizer_name}</span>
            <span className="text-zinc-700 font-medium">{event.description}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 pt-3">
            <Calendar size={14} strokeWidth={3} />
            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <button 
            onClick={() => setShowComments(true)}
            className="text-[10px] font-black text-zinc-400 hover:text-indigo-600 transition-colors pt-4 block uppercase tracking-[0.2em]"
          >
            View all {event.comment_count || 0} comments
          </button>
        </div>

          <div className="grid grid-cols-1 gap-4 mt-10">
            {!isRegistered ? (
              <button 
                onClick={() => onRegister(event.id)}
                className="btn-primary w-full py-5 text-xs"
              >
                Register for Event
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onUnregister(event.id)}
                  className="bg-rose-50 text-rose-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-100 flex items-center justify-center gap-2 border border-rose-100"
                >
                  <X size={18} strokeWidth={2.5} /> Unregister
                </button>
                <button 
                  onClick={addToCalendar}
                  className="bg-zinc-50 text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-100 flex items-center justify-center gap-2 border border-zinc-100"
                >
                  <CalendarPlus size={18} strokeWidth={2.5} /> Calendar
                </button>
                <button 
                  onClick={setReminder}
                  className="bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <BellRing size={18} strokeWidth={2.5} /> Reminder
                </button>
              </div>
            )}
          </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <CommentModal 
            event={event} 
            user={user} 
            onClose={() => setShowComments(false)} 
            onCommentAdded={onRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CommentModal = ({ event, user, onClose, onCommentAdded }: { event: Event, user: User, onClose: () => void, onCommentAdded: () => void }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = () => {
    fetch(`/api/events/${event.id}/comments`)
      .then(res => res.json())
      .then(setComments);
  };

  useEffect(() => {
    fetchComments();
  }, [event.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id, user_id: user.id, content: newComment })
    });
    setNewComment('');
    fetchComments();
    onCommentAdded();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 bg-white z-[60] flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="mr-4"><ChevronLeft size={24} /></button>
        <h2 className="font-bold">Comments</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} alt="avatar" />
            </div>
            <div>
              <p className="text-sm">
                <span className="font-bold mr-2">{comment.username}</span>
                {comment.content}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(comment.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 flex gap-2">
        <input 
          type="text" 
          placeholder="Add a comment..." 
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none text-sm"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <button type="submit" className="text-blue-500 font-bold px-2 text-sm">Post</button>
      </form>
    </motion.div>
  );
};

// --- Main Views ---

const CalendarModal = ({ isOpen, onClose, events }: { isOpen: boolean, onClose: () => void, events: Event[] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const eventsOnDate = events.filter(e => e.date === selectedDate);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tighter">My Schedule</h3>
              <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-2 block">Select Date</label>
              <input 
                type="date" 
                className="input-field py-3"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
              {eventsOnDate.length > 0 ? (
                eventsOnDate.map(event => (
                  <div key={event.id} className="p-5 rounded-[24px] bg-zinc-50 border border-zinc-100 flex items-center gap-4 group hover:bg-white hover:shadow-xl hover:shadow-zinc-100 transition-all">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-zinc-950 truncate">{event.title}</p>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{event.location}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-zinc-200" size={48} />
                  <p className="text-zinc-400 text-sm font-bold">No events registered for this day</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FilterModal = ({ isOpen, onClose, filters, setFilters }: { isOpen: boolean, onClose: () => void, filters: any, setFilters: (f: any) => void }) => {
  const categories = ['Workshop', 'Social', 'Academic', 'Concert'];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tighter">Filter Events</h3>
              <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-4 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilters({ ...filters, category: '' })}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${!filters.category ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-zinc-400 border-zinc-100'}`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilters({ ...filters, category: cat })}
                      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${filters.category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-zinc-400 border-zinc-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-4 block">Location</label>
                <input 
                  type="text" 
                  placeholder="Enter location..." 
                  className="input-field py-3"
                  value={filters.location}
                  onChange={e => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-4 block">Date</label>
                <input 
                  type="date" 
                  className="input-field py-3"
                  value={filters.date}
                  onChange={e => setFilters({ ...filters, date: e.target.value })}
                />
              </div>

              <button 
                onClick={onClose}
                className="btn-primary w-full py-5 text-xs mt-4"
              >
                Show Results
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Stories = ({ user, onViewProfile, onSendMessage }: { user: User, onViewProfile: (id: number) => void, onSendMessage?: (receiverId: number, content: string) => void }) => {
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const colors = [
    '#0ea5e9', '#7c3aed', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#06b6d4', '#8b5cf6', '#a78bfa', '#fb7185', '#f43f5e', '#60a5fa', '#34d399', '#f472b6'
  ];

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const res = await fetch(`/api/stories?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setStories(data);
    }
  };

  const createStory = async () => {
    if (storyType === 'text' && !storyContent.trim()) return;
    if (storyType === 'image' && !selectedImage) return;

    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: storyType,
        content: storyType === 'image' ? selectedImage : storyContent,
        background_color: backgroundColor,
        text_color: textColor,
        font_size: fontSize
      })
    });

    if (res.ok) {
      setShowCreateStory(false);
      setStoryContent('');
      setSelectedImage(null);
      setStoryType('text');
      fetchStories();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setStoryType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const viewStory = async (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    const story = stories[storyIndex];
    
    // Mark as viewed
    await fetch(`/api/stories/${story.id}/view`, { method: 'POST' });
    
    // Update local state
    setStories(prev => prev.map((s, i) => 
      i === storyIndex ? { ...s, viewed_by_me: 1, view_count: s.view_count + 1 } : s
    ));
    setProgress(0);
    setPaused(false);
  };

  const nextStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      viewStory(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  // Auto-advance progress for story viewer
  useEffect(() => {
    if (selectedStoryIndex === null) return;
    setProgress(0);
    const duration = 5000; // 5s per story
    const start = Date.now();
    let raf: number | null = null;

    const tick = () => {
      if (paused) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        nextStory();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [selectedStoryIndex, paused]);

  const prevStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  const deleteStory = async (storyId: number) => {
    await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
    fetchStories();
    setSelectedStoryIndex(null);
  };

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = {
        user: { id: story.user_id, username: story.username, full_name: story.full_name, avatar_url: story.avatar_url },
        stories: []
      };
    }
    acc[story.user_id].stories.push(story);
    return acc;
  }, {} as any);

  return (
    <>
      {/* Stories Bar */}
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar bg-white border-b border-zinc-100">
        {/* Create Story */}
        <div className="flex flex-col items-center min-w-[80px]">
          <button
            onClick={() => setShowCreateStory(true)}
            className="w-16 h-16 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center hover:bg-zinc-200 transition-colors group"
          >
            <Plus size={24} className="text-zinc-400 group-hover:text-zinc-600" />
          </button>
          <p className="text-[10px] font-black text-zinc-500 mt-2 text-center">Your Story</p>
        </div>

        {/* User Stories */}
        {Object.values(storiesByUser).map((userStories: any) => (
          <div key={userStories.user.id} className="flex flex-col items-center min-w-[80px]">
            <button
              onClick={() => viewStory(stories.findIndex(s => s.user_id === userStories.user.id))}
              className={`w-16 h-16 rounded-2xl p-0.5 ${userStories.stories.some((s: any) => !s.viewed_by_me) ? 'bg-gradient-to-tr from-indigo-500 to-rose-500' : 'bg-zinc-200'}`}
            >
              <div className="w-full h-full rounded-xl bg-white p-0.5">
                <img 
                  src={userStories.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userStories.user.username}`}
                  alt="avatar"
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            </button>
            <p className="text-[10px] font-black text-zinc-700 mt-2 text-center truncate w-full">{userStories.user.username}</p>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
              onClick={() => setSelectedStoryIndex(null)}
          >
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 z-50">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-1 bg-white" style={{ width: `${progress}%` }} />
                </div>
              </div>
            <div className="relative w-full h-full flex items-center" onClick={e => e.stopPropagation()}>
                <div className="absolute inset-0" onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} />
              {selectedStoryIndex > 0 && (
                <button 
                  onClick={prevStory}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              {selectedStoryIndex < stories.length - 1 && (
                <button 
                  onClick={nextStory}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft size={24} className="rotate-180" />
                </button>
              )}

              {/* Story Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center">
                  <img 
                    src={stories[selectedStoryIndex].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stories[selectedStoryIndex].username}`}
                    alt="avatar"
                    className="w-12 h-12 rounded-full mx-auto mb-4 border-2 border-white"
                  />
                  <p className="text-white font-black text-sm mb-8">{stories[selectedStoryIndex].username}</p>
                  
                  {stories[selectedStoryIndex].content_type === 'text' ? (
                    <div 
                      className="max-w-sm mx-auto p-8 rounded-3xl text-center"
                      style={{ 
                        backgroundColor: stories[selectedStoryIndex].background_color,
                        color: stories[selectedStoryIndex].text_color,
                        fontSize: stories[selectedStoryIndex].font_size === 'large' ? '2rem' : stories[selectedStoryIndex].font_size === 'small' ? '1rem' : '1.5rem'
                      }}
                    >
                      {stories[selectedStoryIndex].content}
                    </div>
                  ) : (
                    <img 
                      src={stories[selectedStoryIndex].content} 
                      alt="story"
                      className="max-w-sm max-h-96 rounded-2xl mx-auto"
                    />
                  )}
                  
                  <div className="mt-8 text-white/70 text-xs">
                    {stories[selectedStoryIndex].view_count} views
                  </div>
                  {/* Reply input */}
                  <div className="mt-6">
                    <form onSubmit={async (e) => { e.preventDefault(); const content = (e.target as any).elements.reply.value; if (!content.trim()) return; if (onSendMessage) { await onSendMessage(stories[selectedStoryIndex].user_id, content); } else { await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: user.id, receiver_id: stories[selectedStoryIndex].user_id, content }) }); } (e.target as any).reset(); }} className="flex items-center gap-2 justify-center">
                      <input name="reply" placeholder="Send a message" className="flex-1 max-w-md px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-white/70 outline-none" />
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-2xl">Send</button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Delete button for own stories */}
              {stories[selectedStoryIndex].user_id === user.id && (
                <button 
                  onClick={() => deleteStory(stories[selectedStoryIndex].id)}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center text-white"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl">Create Story</h3>
                  <button onClick={() => setShowCreateStory(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X size={24} />
                  </button>
                </div>

                {/* Type Selection */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setStoryType('text')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${storyType === 'text' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setStoryType('image')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${storyType === 'image' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                  >
                    Image
                  </button>
                </div>

                {/* Story Preview */}
                <div className="mb-6">
                  {storyType === 'text' ? (
                    <div 
                      className="w-full h-48 rounded-2xl flex items-center justify-center text-center p-4"
                      style={{ backgroundColor: backgroundColor }}
                    >
                      <textarea
                        value={storyContent}
                        onChange={e => setStoryContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full bg-transparent text-center resize-none outline-none"
                        style={{ 
                          color: textColor,
                          fontSize: fontSize === 'large' ? '1.5rem' : fontSize === 'small' ? '1rem' : '1.25rem',
                          fontWeight: 'bold'
                        }}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center relative overflow-hidden">
                      {selectedImage ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={selectedImage} 
                            alt="story preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => {
                              setSelectedImage(null);
                              setStoryType('text');
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload size={32} className="text-zinc-400 mx-auto mb-2" />
                          <p className="text-zinc-500 text-sm font-medium mb-2">Upload an image</p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
                          >
                            Choose Image
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Color Picker - Only for text stories */}
                {storyType === 'text' && (
                  <div className="mb-6">
                    <p className="text-sm font-black text-zinc-700 mb-3">Background</p>
                    <div className="grid grid-cols-8 gap-2 items-center">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${backgroundColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : ''}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select background ${color}`}
                        />
                      ))}
                      <div className="col-span-8 mt-2 flex items-center gap-3">
                        <label className="text-sm font-black text-zinc-700">Custom</label>
                        <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-10 h-8 p-0 border-0" />
                        <div className="ml-auto flex items-center gap-2">
                          <label className="text-sm font-black text-zinc-700">Text color</label>
                          <button onClick={() => setTextColor('#ffffff')} className={`w-8 h-8 rounded-full bg-white border ${textColor === '#ffffff' ? 'ring-2 ring-indigo-500' : ''}`} />
                          <button onClick={() => setTextColor('#000000')} className={`w-8 h-8 rounded-full bg-black ${textColor === '#000000' ? 'ring-2 ring-indigo-500' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Options - Only for text stories */}
                {storyType === 'text' && (
                  <div className="mb-6">
                    <p className="text-sm font-black text-zinc-700 mb-3">Text Size</p>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`px-4 py-2 rounded-xl text-sm font-black ${fontSize === size ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={createStory}
                  disabled={(storyType === 'text' && !storyContent.trim()) || (storyType === 'image' && !selectedImage)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Story
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Discover / Trending view
const DiscoverView = ({ events, suggestions, user, onViewDetails, onFollowSuggestion }: { events: Event[], suggestions: User[], user: User, onViewDetails: (e: Event) => void, onFollowSuggestion: (id: number) => void }) => {
  const trending = [...events].sort((a,b) => (b.registration_count || 0) - (a.registration_count || 0)).slice(0, 12);
  return (
    <div className="pb-24 pt-24 px-4">
      <header className="fixed top-0 left-0 right-0 bg-white pt-6 pb-4 px-6 z-50 border-b border-zinc-100">
        <div className="flex items-center">
          <h1 className="text-2xl font-black">Discover</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto space-y-6 mt-6">
        <div>
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-3">Trending events</h3>
          <div className="grid grid-cols-2 gap-3">
            {trending.map(ev => (
              <div key={ev.id} onClick={() => onViewDetails(ev)} className="cursor-pointer rounded-xl overflow-hidden border border-zinc-100 bg-white">
                <img src={ev.image_url || `https://picsum.photos/seed/${ev.id}/400/400`} alt={ev.title} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <p className="text-sm font-black truncate">{ev.title}</p>
                  <p className="text-[11px] text-zinc-400">{ev.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {suggestions && suggestions.length > 0 && (
          <div className="bg-white rounded-[28px] p-4 border border-zinc-100">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Suggested people</h4>
            <div className="space-y-2">
              {suggestions.slice(0,5).map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3" onClick={() => { /* noop */ }}>
                    <img src={s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-sm font-black">{s.full_name}</p>
                      <p className="text-[10px] text-zinc-400">@{s.username}</p>
                    </div>
                  </div>
                  <button onClick={() => onFollowSuggestion(s.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black">Follow</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HomeView = ({ events, user, onRegister, onUnregister, onSave, onMessage, onEdit, onRefresh, setActiveTab, unreadCount, onViewProfile, onViewDetails, onSendMessage }: { events: Event[], user: User, onRegister: (id: number) => void, onUnregister: (id: number) => void, onSave: (id: number) => void, onMessage: (id: number) => void, onEdit: (event: Event) => void, onRefresh: () => void, setActiveTab: (t: string) => void, unreadCount: number, onViewProfile: (userId: number) => void, onViewDetails: (event: Event) => void, onSendMessage?: (receiverId: number, content: string) => void }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [likedEventIds, setLikedEventIds] = useState<number[]>([]);

  const fetchHomeData = async () => {
    const regRes = await fetch(`/api/registrations/user/${user.id}`);
    const likesRes = await fetch(`/api/likes/user/${user.id}`);
    if (regRes.ok) setRegisteredEventIds(await regRes.json());
    if (likesRes.ok) setLikedEventIds(await likesRes.json());
  };

  const fetchLikes = () => {
    fetch(`/api/likes/user/${user.id}`).then(res => res.json()).then(setLikedEventIds);
  };

  useEffect(() => {
    fetchHomeData();
  }, [user.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    await fetchHomeData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleShareEvent = async (event: Event) => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title} at ${event.location}!`,
      url: window.location.origin + `?event=${event.id}`
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Event link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="pb-24 pt-24 px-4">
      <header className="fixed top-0 left-0 right-0 bg-white pt-8 pb-6 px-6 z-50 border-b border-zinc-100 shadow-sm">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-rose-500">Festora</h1>
          <div className="ml-auto flex gap-6 text-zinc-950 items-center">
            <button 
              onClick={() => setShowCalendar(true)}
              className={`transition-all hover:text-indigo-600 active:scale-90`}
            >
              <Calendar size={26} strokeWidth={2.5} />
            </button>
            <button onClick={() => setActiveTab('notifications')} className="relative hover:text-rose-600 transition-all active:scale-90">
              <Bell size={28} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Stories Component */}
      <Stories user={user} onViewProfile={onViewProfile} onSendMessage={onSendMessage} />
      
      <div className="max-w-md mx-auto space-y-8">
        <div className="space-y-2">
          {events.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              user={user} 
              onRegister={onRegister} 
              onUnregister={onUnregister}
              onSave={onSave} 
              onMessage={onMessage} 
              onEdit={onEdit} 
              onRefresh={onRefresh} 
              onViewProfile={onViewProfile}
              onShare={handleShareEvent}
              onViewDetails={onViewDetails}
              isRegistered={registeredEventIds.includes(event.id)}
              isLiked={likedEventIds.includes(event.id)}
              onLike={fetchLikes}
            />
          ))}
          {events.length === 0 && (
            <div className="py-20 text-center text-zinc-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">No events found</p>
            </div>
          )}
        </div>
      </div>

      <CalendarModal 
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        events={events}
      />
    </div>
  );
};

const SearchView = ({ events, user, suggestions, onRegister, onUnregister, onSave, onMessage, onEdit, onRefresh, onViewProfile, onViewDetails, onFollowSuggestion, onBack }: { events: Event[], user: User, suggestions: User[], onRegister: (id: number) => void, onUnregister: (id: number) => void, onSave: (id: number) => void, onMessage: (id: number) => void, onEdit: (event: Event) => void, onRefresh: () => void, onViewProfile: (userId: number) => void, onViewDetails: (event: Event) => void, onFollowSuggestion: (id: number) => void, onBack?: () => void }) => {
  const [search, setSearch] = useState('');
  const [registeredEventIds, setRegisteredEventIds] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/registrations/user/${user.id}`).then(res => res.json()).then(setRegisteredEventIds);
  }, [user.id]);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['Workshop', 'Social', 'Academic', 'Concert'];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = !filterLocation || e.location.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesDate = !filterDate || e.date === filterDate;
    const matchesCategory = !filterCategory || e.category === filterCategory;
    return matchesSearch && matchesLocation && matchesDate && matchesCategory;
  });

  return (
    <div className="pb-24 pt-24 px-4">
      <header className="fixed top-0 left-0 right-0 bg-white pt-6 pb-4 px-6 z-50 border-b border-zinc-100">
        <div className="flex gap-2 items-center">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors mr-2">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search Festora..." 
              className="w-full bg-zinc-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-zinc-950 placeholder:text-zinc-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className={`p-2.5 rounded-2xl transition-colors shadow-sm ${filterCategory || filterDate || filterLocation ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center"
            onClick={() => setShowFilters(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 pb-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tighter">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {['', ...categories].map(c => (
                      <button 
                        key={c}
                        onClick={() => setFilterCategory(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCategory === c ? 'festora-gradient text-white shadow-lg shadow-indigo-100' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                      >
                        {c || 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Date</label>
                  <input 
                    type="date" 
                    className="input-field py-3"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="Enter location..."
                    className="input-field py-3"
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => { setFilterCategory(''); setFilterDate(''); setFilterLocation(''); }}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl text-sm font-black uppercase tracking-widest"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-4 festora-gradient text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Who to Follow Section */}
      {suggestions.length > 0 && (
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-[40px] p-6 border border-zinc-100 card-shadow overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Suggested For You</h3>
            <div className="space-y-3">
              {suggestions.slice(0, 5).map(sug => (
                <div key={sug.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl hover:bg-white transition-all border border-zinc-100">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => onViewProfile(sug.id)}
                  >
                    <img 
                      src={sug.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sug.username}`}
                      alt="avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-zinc-950 truncate">{sug.full_name}</p>
                      <p className="text-[9px] text-zinc-500">@{sug.username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onFollowSuggestion(sug.id)}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-xl hover:bg-indigo-700 transition-colors ml-2"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5 mt-6">
        {filteredEvents.map(event => (
          <div 
            key={event.id} 
            className="aspect-square bg-zinc-100 overflow-hidden relative group cursor-pointer rounded-xl border border-zinc-100/50 card-shadow"
            onClick={() => onViewDetails(event)}
          >
            <img 
              src={event.image_url || `https://picsum.photos/seed/${event.id}/400/400`} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
               <div className="flex flex-col items-center">
                 <Heart size={18} className="text-white fill-white mb-1" />
                 <span className="text-[10px] text-white font-black">{event.registration_count || 0}</span>
               </div>
               {registeredEventIds.includes(event.id) && (
                 <div className="flex flex-col items-center">
                   <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400 mb-1" />
                   <span className="text-[10px] text-emerald-400 font-black">Joined</span>
                 </div>
               )}
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            {search || filterCategory || filterLocation || filterDate ? (
              <div className="text-zinc-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">No results found</p>
                <p className="text-sm text-zinc-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="text-zinc-600">
                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg mb-2">Welcome to Festora! 🎉</p>
                <p className="text-sm text-zinc-500 mb-6">Your campus event hub</p>
                <div className="space-y-3 text-sm">
                  <p className="text-zinc-400">📅 Discover upcoming events</p>
                  <p className="text-zinc-400">👥 Connect with your college community</p>
                  <p className="text-zinc-400">📱 Share your story with Stories</p>
                  <p className="text-zinc-400">💬 Chat with friends and organizers</p>
                </div>
                <button 
                  onClick={onRefresh}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Refresh Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CreateEventView = ({ user, onCreated, editingEvent, onCancel }: { user: User, onCreated: () => void, editingEvent?: Event | null, onCancel?: () => void }) => {
  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    date: editingEvent?.date || '',
    location: editingEvent?.location || '',
    category: editingEvent?.category || 'Social',
    image_url: editingEvent?.image_url || '',
    qr_code: editingEvent?.qr_code || '',
    privacy: editingEvent?.privacy || 'social',
    college_code: editingEvent?.college_code || '',
    pass: editingEvent?.pass || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    const selectedDate = new Date(formData.date);
    if (isNaN(selectedDate.getTime())) newErrors.date = 'Invalid date format';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIImage = async () => {
    if (!formData.title) {
      alert('Please enter a title first to guide the AI.');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `A high-quality, vibrant event poster for a college event titled "${formData.title}". Description: ${formData.description}. Style: Modern, clean, professional.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setFormData({ ...formData, image_url: imageUrl });
          break;
        }
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('Failed to generate AI image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const method = editingEvent ? 'PUT' : 'POST';
    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, created_by: user.id })
    });
    
    if (res.ok) onCreated();
  };

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-4">
        {onCancel && (
          <button onClick={onCancel} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-zinc-950">
            {editingEvent ? 'Edit Event' : 'Create Event'}
          </h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em]">Share what's happening.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Select Category</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {['Workshop', 'Social', 'Academic', 'Concert'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${formData.category === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="relative aspect-video w-full bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-200 overflow-hidden flex flex-col items-center justify-center group hover:border-indigo-400 transition-all shadow-sm">
            {formData.image_url ? (
              <>
                <img src={formData.image_url} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button type="button" onClick={generateAIImage} className="bg-white p-3 rounded-2xl hover:scale-110 transition-transform shadow-xl">
                    <Sparkles size={20} className="text-indigo-600" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ImagePicker 
                  currentImage={formData.image_url} 
                  onImageSelected={(url) => setFormData({...formData, image_url: url})} 
                />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Upload Cover Image</span>
              </div>
            )}
            {(isUploading || isGenerating) && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 animate-pulse">
                  {isGenerating ? 'AI is creating...' : 'Uploading...'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={generateAIImage}
              disabled={isGenerating}
              className="flex-1 bg-indigo-50 text-indigo-700 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Sparkles size={16} strokeWidth={2.5} /> AI Magic
            </button>
            <label className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-200 transition-all active:scale-95 shadow-sm">
              <Upload size={16} strokeWidth={2.5} /> Upload
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Event Title</label>
            <input 
              type="text" 
              placeholder="What's happening?" 
              className={`input-field mt-1.5 ${errors.title ? 'border-red-500' : ''}`}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-2">{errors.title}</p>}
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Description</label>
            <textarea 
              placeholder="Tell us more..." 
              className={`input-field h-32 resize-none mt-1.5 py-4 ${errors.description ? 'border-red-500' : ''}`}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            {errors.description && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-2">{errors.description}</p>}
          </div>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Category</label>
              <div className="flex flex-wrap gap-2.5">
                {['Workshop', 'Social', 'Academic', 'Concert'].map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setFormData({...formData, category: c})}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.category === c ? 'vibrant-gradient text-white shadow-xl shadow-indigo-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Date</label>
                <input 
                  type="date" 
                  className={`input-field mt-1.5 ${errors.date ? 'border-red-500' : ''}`}
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
                {errors.date && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-2">{errors.date}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Location</label>
                <input 
                  type="text" 
                  placeholder="Where?" 
                  className={`input-field mt-1.5 ${errors.location ? 'border-red-500' : ''}`}
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
                {errors.location && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-2">{errors.location}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Privacy</label>
            <div className="flex gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setFormData({...formData, privacy: 'social'})}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.privacy === 'social' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, privacy: 'private'})}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.privacy === 'private' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                Private
              </button>
            </div>
          </div>

          {formData.privacy === 'private' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">College Code</label>
              <input
                type="text"
                placeholder="College identifier"
                className="input-field mt-1.5"
                value={formData.college_code}
                onChange={e => setFormData({...formData, college_code: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Registration Pass (Optional)</label>
            <input
              type="text"
              placeholder="Pass/ticket for entry"
              className="input-field mt-1.5"
              value={formData.pass}
              onChange={e => setFormData({...formData, pass: e.target.value})}
            />
          </div>
        </div>

          <div className="py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Organizer QR Code (Optional)</p>
            <div className="relative w-40 h-40 bg-zinc-50 rounded-[24px] border-2 border-dashed border-zinc-200 overflow-hidden flex flex-col items-center justify-center group hover:border-indigo-400 transition-all shadow-sm mx-auto mb-4">
              {formData.qr_code ? (
                <>
                  <img src={formData.qr_code} alt="qr-preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, qr_code: ''})}
                      className="bg-white p-2 rounded-xl hover:scale-110 transition-transform shadow-xl"
                    >
                      <X size={16} className="text-rose-600" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <QrCode size={28} className="text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 text-center px-2">Scan to register</span>
                </div>
              )}
            </div>
            <label className="w-full bg-zinc-100 text-zinc-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-200 transition-all active:scale-95 shadow-sm">
              <Upload size={14} strokeWidth={2.5} /> Upload QR
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setFormData({...formData, qr_code: reader.result as string});
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          </div>

        <button type="submit" className="btn-primary w-full py-5 shadow-2xl shadow-indigo-100 flex items-center justify-center gap-2">
          {editingEvent ? <><Edit3 size={18} strokeWidth={3} /> Update Event</> : <><PlusSquare size={18} strokeWidth={3} /> Post Event</>}
        </button>
      </form>
    </div>
  );
};

const NotificationsView = ({ user, onRead, onBack }: { user: User, onRead: () => void, onBack?: () => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = () => {
    fetch(`/api/notifications/${user.id}`)
      .then(res => res.json())
      .then(setNotifications);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

  const handleRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    fetchNotifications();
    onRead();
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button onClick={onBack} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        <h2 className="text-3xl font-black tracking-tighter text-zinc-950">Activity</h2>
      </div>
      <div className="space-y-4">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            onClick={() => handleRead(notif.id)}
            className={`p-5 rounded-[32px] flex items-start gap-4 transition-all cursor-pointer border ${notif.is_read ? 'bg-white border-zinc-100 opacity-60' : 'bg-white border-indigo-100 shadow-lg shadow-indigo-50'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === 'role_update' ? 'bg-emerald-50 text-emerald-600' : notif.type === 'reminder' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {notif.type === 'role_update' ? <ShieldCheck size={22} /> : notif.type === 'reminder' ? <BellRing size={22} /> : <Bell size={22} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-zinc-950 leading-tight mb-1">{notif.content}</p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {new Date(notif.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {!notif.is_read && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2 shadow-lg shadow-indigo-200" />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="py-20 text-center text-zinc-300">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserListModal = ({ title, users, onClose, onViewProfile }: { title: string, users: User[], onClose: () => void, onViewProfile: (id: number) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 bg-white z-[70] flex flex-col"
    >
      <header className="h-16 flex items-center px-6 border-b border-zinc-100 shrink-0">
        <button onClick={onClose} className="mr-4 text-zinc-400"><ChevronLeft size={28} /></button>
        <h2 className="font-black text-lg tracking-tighter">{title}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-[24px] border border-zinc-100">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => { onViewProfile(u.id); onClose(); }}>
              <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border border-zinc-200 shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="avatar" />
              </div>
              <div>
                <p className="font-black text-sm text-zinc-950">{u.full_name}</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">@{u.username}</p>
              </div>
            </div>
            <button 
              onClick={() => { onViewProfile(u.id); onClose(); }}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors shadow-sm"
            >
              View
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div className="py-20 text-center text-zinc-300">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No users found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ActivityView = ({ user, onViewProfile }: { user: User, onViewProfile: (id: number) => void }) => {
  const [activities, setActivities] = useState<any[]>([]);

  const fetchActivities = () => {
    fetch(`/api/activity/${user.id}`)
      .then(res => res.json())
      .then(setActivities);
  };

  useEffect(() => {
    fetchActivities();
  }, [user.id]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'follow': return <Heart size={20} className="text-rose-500" />;
      case 'like': return <Heart size={20} className="text-rose-600" />;
      case 'register': return <CheckCircle2 size={20} className="text-emerald-600" />;
      case 'comment': return <MessageCircle size={20} className="text-indigo-600" />;
      default: return <Activity size={20} className="text-zinc-400" />;
    }
  };

  const getActivityText = (act: any) => {
    switch (act.activity_type) {
      case 'follow': return `started following ${act.target_user?.full_name || 'someone'}`;
      case 'like': return `liked your event "${act.target_event?.title}"`;
      case 'register': return `registered for your event "${act.target_event?.title}"`;
      case 'comment': return `commented on your event "${act.target_event?.title}"`;
      default: return 'did something';
    }
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto">
      <h2 className="text-3xl font-black tracking-tighter text-zinc-950 mb-4">Your Activity</h2>
      <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-8">Recent actions from people you follow</p>
      <div className="space-y-4">
        {activities.map((act, i) => (
          <div 
            key={i}
            onClick={() => act.target_user_id && onViewProfile(act.target_user_id)}
            className="p-5 rounded-[32px] flex items-start gap-4 transition-all cursor-pointer bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
              {act.target_user?.avatar_url ? (
                <img src={act.target_user.avatar_url} alt="user" className="w-full h-full object-cover" />
              ) : (
                getActivityIcon(act.activity_type)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-zinc-950 leading-tight mb-1">
                <span className="text-indigo-600">{act.target_user?.full_name || 'Someone'}</span> {getActivityText(act)}
              </p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {new Date(act.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="py-20 text-center text-zinc-300">
            <Activity size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No activities yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileView = ({ user, targetUserId, onLogout, onUpdate, onBack, onViewProfile }: { user: User, targetUserId?: number, onLogout: () => void, onUpdate: (u: User) => void, onBack?: () => void, onViewProfile: (id: number) => void }) => {
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [userEventsCount, setUserEventsCount] = useState(0);
  const [editData, setEditData] = useState({
    bio: '',
    social_links: { instagram: '', twitter: '', linkedin: '', website: '' },
    avatar_url: '',
    college_name: '',
    roll_no: ''
  });

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  ];

  const isOwnProfile = !targetUserId || targetUserId === user.id;
  const effectiveUserId = targetUserId || user.id;

  const fetchProfileData = async () => {
    setProfileError(null);
    const res = await fetch(`/api/users/${effectiveUserId}?requester=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setTargetUser(data);
      setEditData({
        bio: data.bio || '',
        social_links: data.social_links ? JSON.parse(data.social_links) : { instagram: '', twitter: '', linkedin: '', website: '' },
        avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        college_name: data.college_name || '',
        roll_no: data.roll_no || ''
      });
    } else if (res.status === 403) {
      setProfileError('You cannot view this profile. Only the admin can view admin profiles.');
    } else {
      const errorData = await res.json();
      setProfileError(errorData.error || 'Failed to load profile');
    }
  };

  const fetchFollowData = () => {
    fetch(`/api/follows/counts/${effectiveUserId}`)
      .then(res => res.json())
      .then(setFollowCounts);
    
    if (!isOwnProfile) {
      fetch(`/api/follows/status/${user.id}/${effectiveUserId}`)
        .then(res => res.json())
        .then(data => setIsFollowing(data.isFollowing));
    }
  };

  const fetchFollowersList = () => {
    fetch(`/api/follows/followers/${effectiveUserId}`)
      .then(res => res.json())
      .then(setFollowersList);
  };

  const fetchFollowingList = () => {
    fetch(`/api/follows/following/${effectiveUserId}`)
      .then(res => res.json())
      .then(setFollowingList);
  };

  useEffect(() => {
    fetchProfileData();
    fetchFollowData();
    fetch(`/api/saved-events/${effectiveUserId}`)
      .then(res => res.json())
      .then(setSavedEvents);
    fetch(`/api/events/user/${effectiveUserId}/count`)
      .then(res => res.json())
      .then(data => setUserEventsCount(data.count));
  }, [effectiveUserId, user.id]);

  const handleFollow = async () => {
    if (isFollowing) {
      await fetch(`/api/follows/${user.id}/${effectiveUserId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: user.id, following_id: effectiveUserId })
      });
    }
    fetchFollowData();
  };

  const handleSaveProfile = async () => {
    await fetch(`/api/users/${user.id}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    onUpdate({ 
      ...user, 
      bio: editData.bio, 
      social_links: JSON.stringify(editData.social_links),
      avatar_url: editData.avatar_url,
      college_name: editData.college_name,
      roll_no: editData.roll_no
    });
    setIsEditing(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Festora Profile',
      text: `Check out ${targetUser?.full_name}'s profile on Festora!`,
      url: window.location.origin + `?profile=${targetUser?.id}`
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Profile link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (profileError) {
    return (
      <div className="p-20 text-center font-black text-zinc-600">
        <AlertCircle size={48} className="mx-auto mb-4 text-rose-500" />
        <h3 className="text-2xl font-black mb-2">Access Denied</h3>
        <p className="text-base mb-6">{profileError}</p>
        {onBack && <button onClick={onBack} className="btn-primary">Go Back</button>}
      </div>
    );
  }

  if (!targetUser) return <div className="p-20 text-center font-black text-zinc-300">Loading Profile...</div>;

  const socialLinks = targetUser.social_links ? JSON.parse(targetUser.social_links) : null;

  return (
    <div className="pb-20 bg-white min-h-screen">
      <header className="h-20 flex items-center px-6 border-b border-zinc-100 bg-white sticky top-0 z-40">
        {!isOwnProfile && <button onClick={onBack} className="mr-4 text-zinc-400 hover:text-zinc-950 transition-colors"><ChevronLeft size={28} /></button>}
        <h2 className="text-xl font-black tracking-tighter text-zinc-950">{targetUser.username}</h2>
        <div className="ml-auto flex gap-6 text-zinc-950">
          {isOwnProfile && (
            <>
              <PlusSquare size={26} strokeWidth={2.5} className="cursor-pointer hover:text-indigo-600 transition-all active:scale-90" />
              <button onClick={onLogout} className="hover:text-indigo-600 transition-all active:scale-90"><Settings size={26} strokeWidth={2.5} /></button>
            </>
          )}
        </div>
      </header>
      
      <div className="p-8">
        <div className="flex items-center mb-10">
          <div className="w-28 h-28 rounded-[40px] vibrant-gradient p-1 shadow-2xl shadow-indigo-100">
            <div className="w-full h-full rounded-[36px] bg-white overflow-hidden border-4 border-white">
              <img src={targetUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} alt="profile" loading="lazy" />
            </div>
          </div>
          <div className="flex-1 flex justify-around ml-8">
            <div className="text-center">
              <p className="text-2xl font-black tracking-tighter text-indigo-700">{userEventsCount}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Events</p>
            </div>
            <div className="text-center cursor-pointer group" onClick={() => { fetchFollowersList(); setShowFollowers(true); }}>
              <p className="text-2xl font-black tracking-tighter text-rose-600 group-hover:scale-110 transition-transform">{followCounts.followers}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Followers</p>
            </div>
            <div className="text-center cursor-pointer group" onClick={() => { fetchFollowingList(); setShowFollowing(true); }}>
              <p className="text-2xl font-black tracking-tighter text-blue-600 group-hover:scale-110 transition-transform">{followCounts.following}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Following</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <p className="font-black text-2xl tracking-tight text-zinc-950">{targetUser.full_name}</p>
            {targetUser.role === 'admin' && (
              <div className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-indigo-100">
                <ShieldCheck size={12} strokeWidth={3} /> Super Admin
              </div>
            )}
          </div>
          {targetUser.college_name && (
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <ShieldCheck size={12} className="text-indigo-400" /> {targetUser.college_name}
            </p>
          )}
          <p className="text-[11px] font-black text-indigo-700 uppercase tracking-[0.2em] mb-5">{targetUser.role.replace('_', ' ')}</p>
          
          {isEditing && isOwnProfile ? (
            <div className="space-y-6">
              <div className="py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Change Avatar</p>
                <div className="mb-6">
                  <ImagePicker 
                    currentImage={editData.avatar_url} 
                    onImageSelected={(url) => setEditData({...editData, avatar_url: url})} 
                  />
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {avatars.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setEditData({...editData, avatar_url: url})}
                      className={`w-12 h-12 rounded-2xl overflow-hidden border-4 transition-all shrink-0 ${editData.avatar_url === url ? 'border-indigo-600 scale-110 shadow-lg' : 'border-zinc-100 opacity-50 hover:opacity-100'}`}
                    >
                      <img src={url} alt="avatar" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="input-field text-sm" 
                  placeholder="College Name"
                  value={editData.college_name}
                  onChange={e => setEditData({ ...editData, college_name: e.target.value })}
                />
                <input 
                  className="input-field text-sm" 
                  placeholder="Roll Number"
                  value={editData.roll_no}
                  onChange={e => setEditData({ ...editData, roll_no: e.target.value })}
                />
              </div>
              <textarea 
                className="input-field h-28 text-sm py-4 text-zinc-950 font-medium" 
                placeholder="Write a bio..."
                value={editData.bio}
                onChange={e => setEditData({ ...editData, bio: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Instagram URL" 
                  className="input-field text-xs py-3"
                  value={editData.social_links.instagram}
                  onChange={e => setEditData({ ...editData, social_links: { ...editData.social_links, instagram: e.target.value } })}
                />
                <input 
                  type="text" 
                  placeholder="Twitter URL" 
                  className="input-field text-xs py-3"
                  value={editData.social_links.twitter}
                  onChange={e => setEditData({ ...editData, social_links: { ...editData.social_links, twitter: e.target.value } })}
                />
                <input 
                  type="text" 
                  placeholder="LinkedIn URL" 
                  className="input-field text-xs py-3"
                  value={editData.social_links.linkedin}
                  onChange={e => setEditData({ ...editData, social_links: { ...editData.social_links, linkedin: e.target.value } })}
                />
                <input 
                  type="text" 
                  placeholder="Website URL" 
                  className="input-field text-xs py-3"
                  value={editData.social_links.website}
                  onChange={e => setEditData({ ...editData, social_links: { ...editData.social_links, website: e.target.value } })}
                />
              </div>
              <button onClick={handleSaveProfile} className="btn-primary w-full py-4">Save Profile</button>
            </div>
          ) : (
            <>
              <p className="text-base text-zinc-800 leading-relaxed mb-6 font-medium">{targetUser.bio || (isOwnProfile ? 'No bio yet. Tap Edit Profile to add one!' : '')}</p>
              <div className="flex gap-6 mb-8">
                {socialLinks?.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-pink-500 transition-all hover:scale-110"><Instagram size={24} /></a>}
                {socialLinks?.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-400 transition-all hover:scale-110"><Twitter size={24} /></a>}
                {socialLinks?.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-600 transition-all hover:scale-110"><Linkedin size={24} /></a>}
                {socialLinks?.website && <a href={socialLinks.website} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-indigo-500 transition-all hover:scale-110"><Globe size={24} /></a>}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 mb-10">
          {isOwnProfile ? (
            <>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 bg-zinc-50 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all border border-zinc-100 active:scale-95"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 bg-zinc-50 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all border border-zinc-100 active:scale-95"
                >
                  Share Profile
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={handleFollow}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isFollowing ? 'bg-zinc-50 text-zinc-600 border border-zinc-100' : 'vibrant-gradient text-white shadow-indigo-100'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              {targetUser?.role && ['council_president', 'club_president'].includes(targetUser.role) && (
                <button 
                  onClick={() => fetch('/api/role-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requester_id: user.id, target_user_id: targetUser.id, requested_role: 'club_member' })
                  }).then(() => alert('Role request sent!'))}
                  className="flex-1 bg-rose-50 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 active:scale-95"
                >
                  Request Role
                </button>
              )}
              <button 
                onClick={handleShare}
                className="flex-1 bg-zinc-50 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all border border-zinc-100 active:scale-95"
              >
                Share Profile
              </button>
            </>
          )}
        </div>

        <div className="flex border-t border-zinc-100">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 flex justify-center relative ${activeTab === 'posts' ? 'text-zinc-900' : 'text-zinc-300'}`}
          >
            <Calendar size={22} strokeWidth={activeTab === 'posts' ? 2.5 : 2} />
            {activeTab === 'posts' && <motion.div layoutId="profileTab" className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-900" />}
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-4 flex justify-center relative ${activeTab === 'saved' ? 'text-zinc-900' : 'text-zinc-300'}`}
          >
            <Bookmark size={22} strokeWidth={activeTab === 'saved' ? 2.5 : 2} />
            {activeTab === 'saved' && <motion.div layoutId="profileTab" className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-900" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 mt-1">
          {(activeTab === 'posts' ? [] : savedEvents).map(event => (
            <div key={event.id} className="aspect-square bg-zinc-100 overflow-hidden relative group cursor-pointer" onClick={() => onViewProfile(event.created_by)}>
              <img 
                src={event.image_url || `https://picsum.photos/seed/${event.id}/400/400`} 
                alt="post" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
          {activeTab === 'posts' && (
            <div className="col-span-3 py-20 text-center text-zinc-300">
              <PlusSquare size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No posts yet</p>
            </div>
          )}
          {activeTab === 'saved' && savedEvents.length === 0 && (
            <div className="col-span-3 py-20 text-center text-zinc-300">
              <Bookmark size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No saved events</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFollowers && (
          <UserListModal 
            title="Followers" 
            users={followersList} 
            onClose={() => setShowFollowers(false)} 
            onViewProfile={onViewProfile} 
          />
        )}
        {showFollowing && (
          <UserListModal 
            title="Following" 
            users={followingList} 
            onClose={() => setShowFollowing(false)} 
            onViewProfile={onViewProfile} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AnalyticsView = ({ user }: { user: User }) => {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`/api/analytics/${user.id}`)
      .then(res => res.json())
      .then(setData);
  }, [user.id]);

  if (!data) return <div className="p-8 text-center">Loading analytics...</div>;

  return (
    <div className="pb-20 pt-4 px-4 max-w-md mx-auto font-mono">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-600">
        <BarChart3 size={20} className="text-indigo-700" /> ANALYTICS_v1.0
      </h2>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="vibrant-gradient text-white p-8 rounded-[40px] shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <p className="text-[10px] text-white/80 uppercase tracking-widest mb-1 font-black">Total Impact</p>
          <p className="text-5xl font-black tracking-tighter">{data.stats.total_views.toLocaleString()}</p>
          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-[10px] text-white/80 uppercase font-black">Events</p>
              <p className="text-2xl font-black">{data.stats.total_events}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/80 uppercase font-black">Registrations</p>
              <p className="text-2xl font-black">{data.stats.total_registrations}</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 ml-2">Event Breakdown</h3>
      <div className="space-y-3">
        {data.eventBreakdown.map((item, i) => (
          <div key={i} className="bg-white border border-zinc-100 p-5 rounded-3xl shadow-sm">
            <p className="font-black text-sm mb-3 truncate text-zinc-950">{item.title}</p>
            <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase mb-2">
              <span className="text-indigo-700">{item.views} views</span>
              <span className="text-emerald-700">{item.registrations} regs</span>
            </div>
            <div className="h-2 bg-zinc-50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (item.registrations / (item.views || 1)) * 100)}%` }}
                className="h-full vibrant-gradient" 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard = ({ user }: { user: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'requests' | 'users' | 'permissions'>(user.role === 'admin' ? 'stats' : 'requests');

  const fetchData = async () => {
    const [uRes, rRes] = await Promise.all([
      fetch(`/api/users?requester=${user.id}`),
      fetch(`/api/role-requests/${user.id}`)
    ]);
    setUsers(await uRes.json());
    setRequests(await rRes.json());
    
    if (user.role === 'admin') {
      const gRes = await fetch('/api/analytics/global');
      setGlobalStats(await gRes.json());
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRequestRole = async (targetId: number, role: Role) => {
    await fetch('/api/role-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_id: user.id, target_user_id: targetId, requested_role: role })
    });
    fetchData();
  };

  const handleApprove = async (requestId: number) => {
    await fetch('/api/role-requests/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
    fetchData();
  };

  const handleReject = async (requestId: number) => {
    await fetch('/api/role-requests/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
    fetchData();
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black tracking-tighter text-zinc-950">Admin</h2>
        <div className="bg-zinc-950 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-zinc-200">
          Root Access
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-100 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'stats', label: 'Stats', icon: BarChart3, adminOnly: true, color: 'text-indigo-600' },
          { id: 'requests', label: 'Requests', icon: Bell, color: 'text-rose-500' },
          { id: 'users', label: 'Users', icon: Users, color: 'text-blue-500' },
          { id: 'permissions', label: 'Roles', icon: ShieldCheck, color: 'text-emerald-500' },
        ].map(tab => {
          if (tab.adminOnly && user.role !== 'admin') return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? tab.color : 'text-zinc-400'}`}
            >
              <span className="flex items-center gap-2">
                <tab.icon size={14} /> {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div layoutId="adminTab" className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.color.replace('text-', 'bg-')}`} />
              )}
            </button>
          );
        })}
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'stats' && globalStats && (
          <motion.section
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 text-white p-5 rounded-3xl shadow-xl">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Total Users</p>
                <p className="text-3xl font-black">{globalStats.stats.total_users}</p>
              </div>
              <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl">
                <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest mb-1">Total Events</p>
                <p className="text-3xl font-black">{globalStats.stats.total_events}</p>
              </div>
              <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-xl">
                <p className="text-[10px] text-emerald-200 uppercase font-black tracking-widest mb-1">Registrations</p>
                <p className="text-3xl font-black">{globalStats.stats.total_registrations}</p>
              </div>
              <div className="bg-amber-500 text-white p-5 rounded-3xl shadow-xl">
                <p className="text-[10px] text-amber-100 uppercase font-black tracking-widest mb-1">Platform Views</p>
                <p className="text-3xl font-black">{globalStats.stats.total_views || 0}</p>
              </div>
            </div>

            <div className="bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Live Activity</h4>
              <div className="space-y-4">
                {globalStats.recentActivity.map((act: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.type === 'registration' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {act.type === 'registration' ? <CheckCircle2 size={16} /> : <MessageCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        <span className="text-indigo-600">{act.full_name}</span> {act.type === 'registration' ? 'registered for' : 'commented on'} <span className="text-zinc-500">{act.target}</span>
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">{new Date(act.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
        {activeTab === 'requests' && (
          <motion.section 
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {requests.filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border border-zinc-100 shadow-sm">
                <div>
                  <p className="text-sm font-black text-zinc-900">{req.target_name}</p>
                  <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest mt-1">
                    Request: {req.requested_role.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(req.id)}
                    className="festora-gradient text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-indigo-100"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(req.id)}
                    className="bg-zinc-100 text-zinc-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <div className="py-12 text-center text-zinc-300">
                <CheckCircle2 size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">All caught up</p>
              </div>
            )}
          </motion.section>
        )}

        {activeTab === 'users' && (
          <motion.section 
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {users.filter(u => u.id !== user.id).map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden mr-4 border border-zinc-200">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="avatar" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-950">{u.full_name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize font-black tracking-wider">{u.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.role === 'admin' && u.role === 'student' && (
                    <button onClick={() => handleRequestRole(u.id, 'council_president')} className="p-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm">
                      <UserPlus size={18} />
                    </button>
                  )}
                  {user.role === 'council_president' && u.role === 'student' && (
                    <button onClick={() => handleRequestRole(u.id, 'club_president')} className="p-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors shadow-sm">
                      <UserPlus size={18} />
                    </button>
                  )}
                  {user.role === 'club_president' && u.role === 'student' && (
                    <button onClick={() => handleRequestRole(u.id, 'club_member')} className="p-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                      <UserPlus size={18} />
                    </button>
                  )}
                  <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </motion.section>
        )}

        {activeTab === 'permissions' && (
          <motion.section 
            key="permissions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100">
              <h4 className="font-black text-lg mb-2">Role Hierarchy</h4>
              <p className="text-indigo-100 text-xs leading-relaxed">
                Admins manage Council. Council manages Club Presidents. Presidents manage Club Members.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['admin', 'council_president', 'club_president', 'club_member', 'student'].map(role => (
                <div key={role} className="p-4 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-900">{role.replace('_', ' ')}</span>
                  <ShieldCheck size={16} className={role === 'admin' ? 'text-indigo-600' : 'text-zinc-300'} />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

const MessagesView = ({ user, onBack }: { user: User, onBack?: () => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`/api/messages/contacts/${user.id}`).then(res => res.json()).then(setUsers);
  }, [user.id]);

  useEffect(() => {
    if (search.trim()) {
      fetch(`/api/users/search?q=${search}`)
        .then(res => res.json())
        .then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = () => {
        fetch(`/api/messages/${user.id}/${selectedUser.id}`)
          .then(res => res.json())
          .then(setMessages);
      };
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, user.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedUser) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: user.id, receiver_id: selectedUser.id, content })
    });
    setContent('');
  };

  if (selectedUser) {
    return (
      <div className="h-screen flex flex-col bg-white z-[60] fixed inset-0">
        <header className="h-16 flex items-center px-6 border-b border-zinc-100 shrink-0 bg-white">
          <button onClick={() => setSelectedUser(null)} className="mr-4 text-zinc-400 hover:text-zinc-900 transition-colors">
            <ChevronLeft size={28} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 overflow-hidden mr-3 border border-zinc-200 shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} alt="avatar" />
          </div>
          <div>
            <h2 className="font-black text-sm text-zinc-900 leading-tight">{selectedUser.full_name}</h2>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Now</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-4 rounded-[24px] text-sm shadow-sm ${msg.sender_id === user.id ? 'festora-gradient text-white rounded-tr-none' : 'bg-white border border-zinc-100 text-zinc-900 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-6 border-t border-zinc-100 flex gap-3 bg-white">
          <input 
            type="text" 
            placeholder="Write a message..." 
            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 outline-none text-sm focus:bg-white focus:border-indigo-500 transition-all"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <button type="submit" className="w-12 h-12 festora-gradient text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-all">
            <Send size={20} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button onClick={onBack} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        <h2 className="text-3xl font-black tracking-tighter text-zinc-950">Messages</h2>
      </div>
      
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Search users by username..." 
          className="w-full bg-zinc-50 border border-zinc-100 rounded-[24px] pl-14 pr-6 py-4 outline-none text-sm focus:bg-white focus:border-indigo-500 transition-all font-medium"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {(search.trim() ? searchResults : users).filter(u => u.id !== user.id).map(u => (
          <button 
            key={u.id} 
            onClick={() => setSelectedUser(u)}
            className="w-full flex items-center p-4 bg-white border border-zinc-100 rounded-[32px] hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden mr-4 border border-zinc-200 shadow-sm">
              <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="avatar" />
            </div>
            <div className="text-left flex-1">
              <p className="font-black text-zinc-950 text-sm">{u.full_name}</p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">@{u.username}</p>
            </div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200" />
          </button>
        ))}
        {((search.trim() ? searchResults : users).length === 0) && (
          <div className="py-20 text-center text-zinc-300">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">{search.trim() ? 'No users found' : 'No contacts yet'}</p>
            <p className="text-xs mt-2">{search.trim() ? 'Try a different username' : 'Follow people to start messaging!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ResetPasswordView = ({ token, onComplete }: { token: string, onComplete: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      // Remove auto-redirect, let user click "Go back to login"
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white overflow-hidden">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-[28px] vibrant-gradient mb-8 flex items-center justify-center shadow-2xl rotate-6 shadow-indigo-200"
      >
        <Calendar className="text-white" size={40} strokeWidth={2.5} />
      </motion.div>
      
      <h1 className="text-4xl font-black italic tracking-tighter mb-2 text-indigo-600">Festora</h1>
      <p className="text-zinc-400 text-[10px] mb-12 font-black uppercase tracking-[0.2em]">Reset Your Password</p>
      
      <div className="w-full max-w-sm">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-black text-green-600">Password Reset!</h3>
            <p className="text-zinc-600 text-sm">Your password has been successfully reset. You can now log in with your new password.</p>
            <button 
              onClick={onComplete}
              className="btn-primary w-full py-3 text-sm mt-4"
            >
              Go Back to Login
            </button>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="New Password" 
                className="input-field pr-10"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input 
              type="password" 
              placeholder="Confirm New Password" 
              className="input-field"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</p>}
            <button type="submit" className="btn-primary w-full py-5 text-xs">Reset Password</button>
          </motion.form>
        )}
      </div>
    </div>
  );
};

const AuthView = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    phone_number: '', 
    password: '', 
    full_name: '',
    avatar_url: '',
    college_name: '',
    roll_no: '',
    identifier: '' // For login
  });
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  // Sync college search with selected college
  useEffect(() => {
    if (formData.college_name && formData.college_name !== 'Others') {
      setCollegeSearch(formData.college_name);
    } else if (formData.college_name === 'Others') {
      setCollegeSearch('Others');
    }
  }, [formData.college_name]);

  const colleges = [
    'GNITS',
    'CBIT', 
    'MGIT',
    'KLU',
    'VNRVJIET',
    'IITH',
    'Others'
  ];

  const filteredColleges = colleges.filter(college => 
    college.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin
      ? { identifier: formData.identifier, password: formData.password }
      : {
          username: formData.username,
          email: formData.email,
          phone_number: formData.phone_number,
          password: formData.password,
          full_name: formData.full_name,
          avatar_url: formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
          college_name: formData.college_name === 'Others' ? customCollegeName : formData.college_name,
          roll_no: formData.roll_no
        };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      onLogin(data);
    } else {
      setError(data.error);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotPasswordEmail })
    });
    
    const data = await res.json();
    if (res.ok) {
      setForgotPasswordMessage('Password reset email sent! Check your inbox.');
    } else {
      setForgotPasswordMessage(data.error);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.username || !formData.password || !formData.full_name) {
        setError('Please fill all required fields');
        return;
      }
    } else if (step === 2) {
      if (!formData.email || !formData.phone_number || !formData.college_name || !formData.roll_no) {
        setError('Please fill all required fields');
        return;
      }
      if (formData.college_name === 'Others' && !customCollegeName.trim()) {
        setError('Please enter your college name');
        return;
      }
      
      // Check if roll number is already taken in this college
      const collegeToCheck = formData.college_name === 'Others' ? customCollegeName : formData.college_name;
      try {
        const res = await fetch(`/api/check-rollno?college=${encodeURIComponent(collegeToCheck)}&rollno=${encodeURIComponent(formData.roll_no)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setError('A student with this roll number already exists in your college');
            return;
          }
        }
      } catch (err) {
        // If check fails, continue (backend will validate anyway)
        console.log('Roll number check failed, continuing...');
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white overflow-hidden">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-[28px] vibrant-gradient mb-8 flex items-center justify-center shadow-2xl rotate-6 shadow-indigo-200"
      >
        <Calendar className="text-white" size={40} strokeWidth={2.5} />
      </motion.div>
      
      <h1 className="text-4xl font-black italic tracking-tighter mb-2 text-indigo-600">Festora</h1>
      <p className="text-zinc-400 text-[10px] mb-12 font-black uppercase tracking-[0.2em]">Experience More.</p>
      
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <input 
                type="text" 
                placeholder="Username, Email, or Phone" 
                className="input-field"
                value={formData.identifier}
                onChange={e => setFormData({...formData, identifier: e.target.value})}
                required
              />
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Password" 
                  className="input-field pr-10"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</p>}
              <button type="submit" className="btn-primary w-full py-5 text-xs">Log In</button>
              <div className="flex justify-center pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)} 
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="input-field"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Username" 
                    className="input-field"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required
                  />
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Password" 
                      className="input-field pr-10"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</p>}
                  <button onClick={nextStep} className="btn-primary w-full py-5 text-xs">Next Step</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="input-field"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="input-field"
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    required
                  />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select your college"
                      className="input-field"
                      value={collegeSearch}
                      onChange={e => {
                        setCollegeSearch(e.target.value);
                        setShowCollegeDropdown(true);
                        // Clear selection if user is typing something different
                        if (e.target.value !== formData.college_name) {
                          setFormData({...formData, college_name: ''});
                          setCustomCollegeName('');
                        }
                      }}
                      onFocus={() => setShowCollegeDropdown(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // If there's an exact match, select it
                          const exactMatch = colleges.find(college => 
                            college.toLowerCase() === collegeSearch.toLowerCase()
                          );
                          if (exactMatch) {
                            setFormData({...formData, college_name: exactMatch});
                            setCollegeSearch(exactMatch);
                            if (exactMatch !== 'Others') {
                              setCustomCollegeName('');
                            }
                          } else {
                            // If no exact match, suggest "Others"
                            setFormData({...formData, college_name: 'Others'});
                            setCollegeSearch('Others');
                          }
                          setShowCollegeDropdown(false);
                        } else if (e.key === 'Escape') {
                          setShowCollegeDropdown(false);
                        }
                      }}
                      required
                    />
                    {showCollegeDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-zinc-200 rounded-2xl shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                        {filteredColleges.length > 0 ? (
                          filteredColleges.map(college => (
                            <button
                              key={college}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur from firing
                                setFormData({...formData, college_name: college});
                                setCollegeSearch(college);
                                setShowCollegeDropdown(false);
                                if (college !== 'Others') {
                                  setCustomCollegeName('');
                                }
                              }}
                            >
                              {college}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-zinc-500 text-sm">
                            No colleges found. Try "Others" to enter manually.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.college_name === 'Others' && (
                    <input
                      type="text"
                      placeholder="Enter your college name"
                      className="input-field mt-2"
                      value={customCollegeName}
                      onChange={e => setCustomCollegeName(e.target.value)}
                      required
                    />
                  )}
                  <input 
                    type="text" 
                    placeholder="Roll Number" 
                    className="input-field"
                    value={formData.roll_no}
                    onChange={e => setFormData({...formData, roll_no: e.target.value})}
                    required
                  />
                  {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={prevStep} className="flex-1 bg-zinc-100 text-zinc-600 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Back</button>
                    <button onClick={nextStep} className="flex-[2] btn-primary py-5 text-xs">Final Step</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Choose your avatar</p>
                    <ImagePicker 
                      currentImage={formData.avatar_url} 
                      onImageSelected={(url) => setFormData({...formData, avatar_url: url})} 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Or select a preset</p>
                    <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar pb-2">
                      {avatars.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData({...formData, avatar_url: url})}
                          className={`w-12 h-12 rounded-2xl overflow-hidden border-4 transition-all shrink-0 ${formData.avatar_url === url ? 'border-indigo-600 scale-110 shadow-lg' : 'border-white opacity-50 hover:opacity-100'}`}
                        >
                          <img src={url} alt="avatar" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</p>}
                  
                  <div className="flex gap-3">
                    <button onClick={prevStep} className="flex-1 bg-zinc-100 text-zinc-600 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Back</button>
                    <button onClick={() => handleSubmit()} className="flex-[2] btn-primary py-5 text-xs">Complete Sign Up</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <button 
        onClick={() => {
          setIsLogin(!isLogin);
          setStep(1);
          setError('');
        }}
        className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-950 transition-colors"
      >
        {isLogin ? "New to Festora? Create Account" : "Have an account? Sign In"}
      </button>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-3xl w-full max-w-sm mx-4"
          >
            <h3 className="text-xl font-black text-center mb-6">Reset Password</h3>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="input-field"
                value={forgotPasswordEmail}
                onChange={e => setForgotPasswordEmail(e.target.value)}
                required
              />
              {forgotPasswordMessage && (
                <p className={`text-[10px] text-center font-black uppercase tracking-widest ${forgotPasswordMessage.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                  {forgotPasswordMessage}
                </p>
              )}
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordMessage('');
                  }}
                  className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-3 text-xs">Send Reset Email</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SettingsView = ({ user, onLogout, onBack, setActiveTab }: { user: User, onLogout: () => void, onBack?: () => void, setActiveTab?: (t: string) => void }) => {
  const [modal, setModal] = useState<string | null>(null);
  const [language, setLanguage] = useState('English (US)');
  const [replyPolicy, setReplyPolicy] = useState<string>(localStorage.getItem('reply_policy') || 'Followers');
  const [closeFriends, setCloseFriends] = useState<number[]>(JSON.parse(localStorage.getItem('close_friends') || '[]'));
  const [suggestedForClose, setSuggestedForClose] = useState<User[]>([]);
  const [deleteError, setDeleteError] = useState("");

  const items = [
    { icon: Bell, label: 'Notifications', key: 'notifications', color: 'text-indigo-700', desc: 'Manage your alerts' },
    { icon: ShieldCheck, label: 'Privacy & Security', key: 'privacy', color: 'text-emerald-700', desc: 'Secure your account' },
    { icon: Users, label: 'Accounts Center', key: 'account', color: 'text-blue-700', desc: 'Password, security, personal details' },
    { icon: Globe, label: 'Language', key: 'language', color: 'text-amber-700', desc: language },
    { icon: Heart, label: 'Your Activity', key: 'activity', color: 'text-pink-700', desc: 'Likes and registrations' },
    { icon: Bookmark, label: 'Saved', key: 'saved', color: 'text-zinc-700', desc: 'Events you bookmarked' },
    { icon: UserPlus, label: 'Close Friends', key: 'close_friends', color: 'text-emerald-500', desc: 'Manage close friends list' },
    { icon: QrCode, label: 'Story, live and location', key: 'story_settings', color: 'text-rose-500', desc: 'Who can see your story' },
    { icon: MessageCircle, label: 'Messages and story replies', key: 'reply_settings', color: 'text-violet-600', desc: 'Control replies and DMs' },
    { icon: Globe, label: 'Follow and invite friends', key: 'follow_invite', color: 'text-amber-700', desc: 'Invite people to Festora' }
  ];

  const handleClick = async (key: string) => {
    if (key === 'notifications') return setActiveTab?.('notifications');
    if (key === 'activity') return setActiveTab?.('activity');
    if (key === 'saved') return setActiveTab?.('profile');
    if (key === 'account') return setModal('account');
    if (key === 'privacy') return setModal('privacy');
    if (key === 'language') return setModal('language');
    if (key === 'close_friends') {
      // fetch suggestions to populate close friends list
      const res = await fetch(`/api/users/suggestions/${user.id}`);
      if (res.ok) setSuggestedForClose(await res.json());
      return setModal('close_friends');
    }
    if (key === 'reply_settings') return setModal('reply_settings');
    if (key === 'story_settings') return setModal('story_settings');
    if (key === 'follow_invite') return setModal('follow_invite');
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button onClick={onBack} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        <h2 className="text-3xl font-black tracking-tighter text-zinc-950">Settings</h2>
      </div>
      <div className="space-y-3">
        <div className="mb-4">
          <input placeholder="Search settings" className="w-full input-field" onChange={e => console.log('filter settings', e.target.value)} />
        </div>
        {items.map((item, i) => (
          <button key={i} onClick={() => handleClick(item.key)} className="w-full flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-[32px] hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center ${item.color}`}>
                <item.icon size={22} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-zinc-950">{item.label}</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{item.desc}</p>
              </div>
            </div>
            <ChevronLeft size={20} className="rotate-180 text-zinc-400" />
          </button>
        ))}
        <button 
          onClick={onLogout}
          className="w-full mt-8 p-6 bg-red-50 text-red-700 border border-red-100 rounded-[32px] font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all active:scale-[0.98] shadow-lg shadow-red-100"
        >
          Log Out
        </button>
      </div>

      <AnimatePresence>
        {modal === 'privacy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-lg font-black mb-4">Privacy & Security</h3>
              <p className="text-sm text-zinc-500 mb-4">Manage your account privacy settings and security options.</p>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <span className="text-sm font-medium">Private account</span>
                  <input type="checkbox" />
                </label>
                <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <span className="text-sm font-medium">Enable 2FA (placeholder)</span>
                  <input type="checkbox" />
                </label>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setModal(null)} className="btn-primary flex-1 py-3">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {modal === 'account' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-lg font-black mb-4">Accounts Center</h3>
              <p className="text-sm text-zinc-500 mb-4">Manage password, security, personal details and connected accounts across Festora.</p>
              <div className="mt-4">
                <button className="w-full p-4 rounded-2xl bg-zinc-50">Change Password</button>
                <button className="w-full p-4 rounded-2xl mt-3 bg-zinc-50">Connected Accounts</button>
                <button className="w-full p-4 rounded-2xl mt-3 bg-zinc-50">Ad preferences</button>
              </div>
              <div className="mt-8">
                <button
                  onClick={() => setModal('delete_account')}
                  className="w-full bg-rose-50 text-rose-600 border border-rose-100 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 mt-2"
                >
                  Delete Account
                </button>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setModal(null)} className="btn-primary flex-1 py-3">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Account Modal */}
        {modal === 'delete_account' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full text-center">
              <Trash2 size={32} className="mx-auto text-rose-500 mb-2" />
              <h3 className="text-lg font-black mb-1 text-rose-600">Delete Account?</h3>
              <p className="text-[13px] text-zinc-500 mb-4">Are you sure you want to permanently delete your Festora account? <span className='font-bold text-rose-600'>This cannot be undone.</span></p>
              {deleteError && (
                <div className="mb-3 text-xs text-rose-600 font-bold">{deleteError}</div>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={async () => {
                    try {
                      setDeleteError("");
                      const res = await fetch(`/api/users/${user.id}?requester=${user.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setModal(null);
                        if (typeof onLogout === 'function') onLogout();
                      } else {
                        const data = await res.json();
                        setDeleteError(data.error || 'Failed to delete account');
                      }
                    } catch (e) {
                      setDeleteError('Failed to delete account');
                    }
                  }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-all active:scale-95"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => { setModal(null); setDeleteError(""); }}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
// Add state for delete error in SettingsView
// ...existing code...
const [deleteError, setDeleteError] = useState("");

        {modal === 'close_friends' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-lg font-black mb-4">Close Friends</h3>
              <p className="text-sm text-zinc-500 mb-4">Add people to your Close Friends list so they see special stories.</p>
              <div className="space-y-2 max-h-60 overflow-auto">
                {suggestedForClose.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-black">{s.full_name}</p>
                        <p className="text-[10px] text-zinc-400">@{s.username}</p>
                      </div>
                    </div>
                    <button onClick={() => {
                      setCloseFriends(prev => {
                        const next = prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id];
                        localStorage.setItem('close_friends', JSON.stringify(next));
                        return next;
                      });
                    }} className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${closeFriends.includes(s.id) ? 'bg-zinc-200' : 'bg-indigo-600 text-white'}`}>
                      {closeFriends.includes(s.id) ? 'Remove' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setModal(null)} className="btn-primary flex-1 py-3">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {modal === 'reply_settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-lg font-black mb-4">Messages & Story Replies</h3>
              <p className="text-sm text-zinc-500 mb-4">Choose who can message you or reply to your stories.</p>
              {['Everyone', 'Followers', 'Close Friends', 'Off'].map(opt => (
                <button key={opt} onClick={() => { setReplyPolicy(opt); localStorage.setItem('reply_policy', opt); }} className={`w-full text-left p-4 rounded-2xl mb-2 ${replyPolicy === opt ? 'bg-indigo-50' : 'bg-zinc-50'}`}>{opt}</button>
              ))}
              <div className="mt-6 flex gap-2">
                <button onClick={() => setModal(null)} className="btn-primary flex-1 py-3">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {modal === 'language' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-lg font-black mb-4">Language</h3>
              {['English (US)', 'English (UK)', 'हिन्दी', 'Español'].map(l => (
                <button key={l} onClick={() => { setLanguage(l); setModal(null); }} className="w-full text-left p-4 rounded-2xl hover:bg-zinc-50">{l}</button>
              ))}
              <div className="mt-6 flex gap-2">
                <button onClick={() => setModal(null)} className="btn-primary flex-1 py-3">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EventDetailsView = ({ event, user, isRegistered, onRegister, onUnregister, onSave, onMessage, onEdit, onRefresh, onClose, onViewProfile, onShare }: { event: Event, user: User, isRegistered: boolean, onRegister: (id: number) => void, onUnregister: (id: number) => void, onSave: (id: number) => void, onMessage: (id: number) => void, onEdit: (event: Event) => void, onRefresh: () => void, onClose: () => void, onViewProfile: (userId: number) => void, onShare: (event: Event) => void }) => {
  const [showQR, setShowQR] = useState(false);
  const canEdit = user.role === 'admin' || user.role === 'council_president' || (user.role === 'club_president' && event.created_by === user.id);

  const addToCalendar = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const date = new Date(event.date).toISOString().replace(/-|:|\.\d+/g, "");
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${date}/${date}`;
    window.open(googleUrl, '_blank');
  };

  const setReminder = async () => {
    const remindAt = new Date(event.date);
    remindAt.setHours(remindAt.getHours() - 1);
    await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, event_id: event.id, remind_at: remindAt.toISOString() })
    });
    alert('Reminder set for 1 hour before the event!');
  };

  const getCategoryClass = (category?: string) => {
    switch (category) {
      case 'Workshop': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Social': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Academic': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Concert': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-white z-[80] overflow-y-auto"
    >
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between border-b border-zinc-100">
        <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Event Details</h2>
        <div className="flex gap-2">
          {canEdit && (
            <button onClick={() => { onEdit(event); onClose(); }} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
              <Edit3 size={20} />
            </button>
          )}
          <button onClick={() => onShare(event)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        <div className="aspect-[4/3] w-full relative">
          <img 
            src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
            alt={event.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute bottom-6 left-6 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-2xl ${getCategoryClass(event.category)}`}>
            {event.category || 'Social'}
          </div>
        </div>

        <div className="p-8">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-950 mb-4">{event.title}</h1>
          
          <div className="flex items-center gap-4 mb-8 p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div 
              className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md cursor-pointer"
              onClick={() => onViewProfile(event.created_by)}
            >
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.organizer_name}`} alt="organizer" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Organized by</p>
              <p className="text-sm font-black text-zinc-950">{event.organizer_name}</p>
            </div>
            <button 
              onClick={() => onMessage(event.created_by)}
              className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm hover:shadow-md transition-all border border-zinc-100"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
              <Calendar className="text-indigo-600 mb-3" size={20} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Date & Time</p>
              <p className="text-xs font-black text-zinc-950">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
              <MapPin className="text-rose-600 mb-3" size={20} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Location</p>
              <p className="text-xs font-black text-zinc-950 truncate">{event.location}</p>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">About Event</p>
            <p className="text-sm text-zinc-700 leading-relaxed font-medium">{event.description}</p>
          </div>

          <div className="flex flex-col items-center p-8 bg-zinc-950 rounded-[40px] text-white text-center mb-10 shadow-2xl shadow-zinc-200">
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-6">
              <QrCode size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tighter mb-2">Event Pass</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">Scan for check-in</p>
            <div className="p-4 bg-white rounded-3xl shadow-2xl">
              <QRCodeCanvas value={window.location.origin + "?event=" + event.id} size={180} />
            </div>
          </div>

          <div className="space-y-4 pb-12">
            {!isRegistered ? (
              <button 
                onClick={() => onRegister(event.id)}
                className="btn-primary w-full py-5 text-xs"
              >
                Register for Event
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onUnregister(event.id)}
                    className="bg-rose-50 text-rose-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-100 flex items-center justify-center gap-2 border border-rose-100"
                  >
                    <X size={18} strokeWidth={2.5} /> Unregister
                  </button>
                  <button 
                    onClick={addToCalendar}
                    className="bg-zinc-50 text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-100 flex items-center justify-center gap-2 border border-zinc-100"
                  >
                    <CalendarPlus size={18} strokeWidth={2.5} /> Calendar
                  </button>
                </div>
                <button 
                  onClick={setReminder}
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                >
                  <BellRing size={18} /> Set Reminder
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={addToCalendar}
                className="bg-zinc-50 text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-100 flex items-center justify-center gap-2 border border-zinc-100"
              >
                <CalendarPlus size={18} /> Calendar
              </button>
              <button 
                onClick={() => onSave(event.id)}
                className="bg-zinc-50 text-zinc-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-100 flex items-center justify-center gap-2 border border-zinc-100"
              >
                <Bookmark size={18} /> Save Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

const RegistrationModal = ({ isOpen, onClose, event, user, onConfirm }: { isOpen: boolean, onClose: () => void, event: Event, user: User, onConfirm: () => void }) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    college_name: user.college_name || '',
    roll_no: user.roll_no || ''
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tighter">Event Registration</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{event.title}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-2 block">Full Name</label>
                  <input className="input-field py-3" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-2 block">Email</label>
                  <input className="input-field py-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-2 block">College</label>
                    <input className="input-field py-3" value={formData.college_name} onChange={e => setFormData({...formData, college_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-2 block">Roll No</label>
                    <input className="input-field py-3" value={formData.roll_no} onChange={e => setFormData({...formData, roll_no: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={onConfirm}
                  className="btn-primary w-full py-5 text-xs"
                >
                  Confirm Registration
                </button>
                <p className="text-[9px] text-center text-zinc-400 mt-4 font-medium">By clicking confirm, you agree to the event terms and conditions.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);
  // Restore user from localStorage so reloads don't force logout
  useEffect(() => {
    try {
      const raw = localStorage.getItem('festora_user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    
    // Check for reset password token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetPasswordToken(token);
    }
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('festora_user', JSON.stringify(user));
      else localStorage.removeItem('festora_user');
    } catch (e) { /* ignore */ }
  }, [user]);
  const [activeTab, setActiveTab] = useState('home');
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<number[]>([]);
  const [likedEventIds, setLikedEventIds] = useState<number[]>([]);
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [showPeople, setShowPeople] = useState(false);
  const [previousTab, setPreviousTab] = useState<string>('home');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchEvents = () => {
    const url = user?.college_name ? `/api/events?college_code=${encodeURIComponent(user.college_name)}` : '/api/events';
    fetch(url).then(res => res.json()).then(setEvents);
  };

  const fetchRegistrations = () => {
    if (user) {
      fetch(`/api/registrations/user/${user.id}`).then(res => res.json()).then(setRegisteredEventIds);
    }
  };

  const fetchLikes = () => {
    if (user) {
      fetch(`/api/likes/user/${user.id}`).then(res => res.json()).then(setLikedEventIds);
    }
  };

  const fetchBookmarks = () => {
    if (user) {
      fetch(`/api/bookmarks/${user.id}`).then(res => res.json()).then(data => setBookmarkedEventIds(data.map((e: Event) => e.id)));
    }
  };

  const fetchSuggestions = () => {
    if (user) {
      fetch(`/api/users/suggestions/${user.id}`).then(res => res.json()).then(setSuggestions);
    }
  };

  const fetchActivity = () => {
    if (user) {
      fetch(`/api/activity/${user.id}`).then(res => res.json()).then(setActivity);
    }
  };

  const fetchNotifications = () => {
    if (user) {
      fetch(`/api/notifications/${user.id}`)
        .then(res => res.json())
        .then(setNotifications);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchRegistrations();
      fetchNotifications();
      fetchSuggestions();
      fetchBookmarks();
      fetchLikes();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchRegistrations();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch public events on mount so Search/Discover work before login
  useEffect(() => {
    fetchEvents();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUnregister = async (eventId: number) => {
    if (!user) return;
    const res = await fetch(`/api/unregister-event/${user.id}/${eventId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      showToast(data.message || 'Unregistered successfully!');
      fetchEvents();
      fetchRegistrations();
    } else {
      const error = await res.json();
      showToast(error.error || 'Unregistration failed');
    }
  };

  const handleRegister = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setRegisteringEvent(event);
    }
  };

  const confirmRegistration = async () => {
    if (!user || !registeringEvent) return;
    const res = await fetch('/api/register-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, event_id: registeringEvent.id })
    });
    if (res.ok) {
      const data = await res.json();
      setRegisteringEvent(null);
      showToast(data.message || 'Registration successful!');
      fetchEvents();
      fetchRegistrations();
    } else {
      const error = await res.json();
      showToast(error.error || 'Registration failed');
    }
  };

  const handleSave = async (eventId: number) => {
    if (!user) return;
    await fetch('/api/save-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, event_id: eventId })
    });
    showToast('Event saved to profile!');
  };

  const handleMessage = (organizerId: number) => {
    setActiveTab('messages');
  };

  const sendDirectMessage = async (receiverId: number, content: string) => {
    if (!user) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: user.id, receiver_id: receiverId, content })
    });
    showToast('Message sent');
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setActiveTab('create');
  };

  const handleFollowSuggestion = async (targetId: number) => {
    await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: user.id, following_id: targetId })
    });
    fetchSuggestions();
  };

  const handleViewProfile = (userId: number) => {
    setViewingProfileId(userId);
    setActiveTab('profile');
  };

  if (resetPasswordToken) {
    return <ResetPasswordView token={resetPasswordToken} onComplete={() => {
      setResetPasswordToken(null);
      window.history.replaceState({}, '', '/');
    }} />;
  }

  if (!user) {
    return <AuthView onLogin={setUser} />;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xs"
          >
            <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-bold">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && (
            <HomeView 
              events={events} 
              user={user} 
              onRegister={handleRegister} 
              onUnregister={handleUnregister}
              onSave={handleSave} 
              onMessage={handleMessage} 
              onEdit={handleEdit} 
              onRefresh={fetchEvents} 
              setActiveTab={setActiveTab}
              onSendMessage={sendDirectMessage}
              unreadCount={unreadCount}
              onViewProfile={handleViewProfile}
              onViewDetails={setViewingEvent}
            />
          )}
          {activeTab === 'discover' && (
            <DiscoverView events={events} suggestions={suggestions} user={user} onViewDetails={setViewingEvent} onFollowSuggestion={handleFollowSuggestion} />
          )}
          {activeTab === 'promotions' && (
            <SearchView 
              events={events} 
              user={user} 
              suggestions={suggestions}
              onRegister={handleRegister} 
              onUnregister={handleUnregister}
              onSave={handleSave} 
              onMessage={handleMessage} 
              onEdit={handleEdit} 
              onRefresh={fetchEvents} 
              onViewProfile={handleViewProfile}
              onViewDetails={setViewingEvent}
              onFollowSuggestion={handleFollowSuggestion}
              onBack={() => setActiveTab(previousTab)}
            />
          )}
          {activeTab === 'create' && (
            <CreateEventView 
              user={user} 
              editingEvent={editingEvent}
              onCreated={() => { 
                fetchEvents(); 
                setEditingEvent(null);
                setActiveTab('home'); 
                showToast(editingEvent ? 'Event updated!' : 'Event posted!');
              }}
              onCancel={() => setActiveTab(previousTab)}
            />
          )}
          {activeTab === 'notifications' && <NotificationsView user={user} onRead={fetchNotifications} onBack={() => setActiveTab(previousTab)} />}
          {activeTab === 'messages' && <MessagesView user={user} onBack={() => setActiveTab(previousTab)} />}
          {activeTab === 'activity' && <ActivityView user={user} onViewProfile={handleViewProfile} />}
          {activeTab === 'profile' && (
            <div className="flex flex-col">
              <ProfileView 
                user={user} 
                targetUserId={viewingProfileId || undefined}
                onLogout={() => setActiveTab('settings')} 
                onUpdate={setUser} 
                onBack={() => setViewingProfileId(null)}
                onViewProfile={handleViewProfile}
              />
              {['admin', 'council_president', 'club_president'].includes(user.role) && !viewingProfileId && (
                <AdminDashboard user={user} />
              )}
            </div>
          )}
          {activeTab === 'settings' && <SettingsView user={user} onLogout={() => setUser(null)} onBack={() => setActiveTab(previousTab)} setActiveTab={setActiveTab} />}
        </motion.div>
      </AnimatePresence>
      
      <Navbar activeTab={activeTab} setActiveTab={(t) => { setPreviousTab(activeTab); setActiveTab(t); if (t !== 'create') setEditingEvent(null); if (t !== 'profile') setViewingProfileId(null); if (t !== 'home' && t !== 'promotions') setViewingEvent(null); }} user={user} />
      
      <AnimatePresence>
        {viewingEvent && (
          <EventDetailsView 
            event={viewingEvent}
            user={user}
            isRegistered={registeredEventIds.includes(viewingEvent.id)}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            onSave={handleSave}
            onMessage={handleMessage}
            onEdit={handleEdit}
            onRefresh={() => { fetchEvents(); fetchRegistrations(); }}
            onClose={() => setViewingEvent(null)}
            onViewProfile={handleViewProfile}
            onShare={(e) => {
              const url = window.location.origin + `?event=${e.id}`;
              navigator.clipboard.writeText(url);
              showToast('Link copied!');
            }}
          />
        )}
      </AnimatePresence>
      
      {registeringEvent && user && (
        <RegistrationModal 
          isOpen={!!registeringEvent} 
          onClose={() => setRegisteringEvent(null)} 
          event={registeringEvent} 
          user={user}
          onConfirm={confirmRegistration}
        />
      )}
    </div>
  );
}
