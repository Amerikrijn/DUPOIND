import { useEffect, useState } from 'react';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  WallPost,
  KudoEntry,
  UserStatus,
  Dish,
  QuizQuestion,
  Idea,
  EngagementKind,
} from '../types';
import { ENGAGEMENT_SIGNALS_COLLECTION } from '../lib/livingHub';

export async function recordEngagementSignal(
  kind: EngagementKind,
  payload: {
    userName: string;
    cityId: string;
    metadata?: Record<string, string | number | boolean>;
  }
): Promise<void> {
  try {
    await addDoc(collection(db, ENGAGEMENT_SIGNALS_COLLECTION), {
      kind,
      userName: payload.userName,
      cityId: payload.cityId,
      metadata: payload.metadata ?? {},
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[engagement]', e);
  }
}

// ── Wall Posts ──────────────────────────────────────────
export function useWallPosts() {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'wallPosts'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as WallPost)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addPost = async (post: Omit<WallPost, 'id' | 'likes'>) => {
    await addDoc(collection(db, 'wallPosts'), { ...post, likes: [], createdAt: serverTimestamp() });
  };

  const toggleLike = async (postId: string, userName: string, liked: boolean) => {
    const ref = doc(db, 'wallPosts', postId);
    await updateDoc(ref, { likes: liked ? arrayRemove(userName) : arrayUnion(userName) });
    if (!liked) {
      const post = posts.find((p) => p.id === postId);
      void recordEngagementSignal('wall_like', {
        userName,
        cityId: typeof post?.cityId === 'string' ? post.cityId : 'system',
        metadata: { postId },
      });
    }
  };

  return { posts, loading, addPost, toggleLike };
}

// ── Kudos ───────────────────────────────────────────────
export function useKudos() {
  const [kudos, setKudos] = useState<KudoEntry[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'kudos'), orderBy('createdAt', 'desc'), limit(30));
    const unsub = onSnapshot(q, snap => {
      setKudos(snap.docs.map(d => ({ id: d.id, ...d.data() } as KudoEntry)));
    });
    return unsub;
  }, []);

  const addKudo = async (kudo: Omit<KudoEntry, 'id'>) => {
    await addDoc(collection(db, 'kudos'), { ...kudo, createdAt: serverTimestamp() });
  };

  return { kudos, addKudo };
}

// ── Presence / Status ────────────────────────────────────
export function usePresence() {
  const [squad, setSquad] = useState<UserStatus[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'presence'), snap => {
      const now = Date.now();
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as UserStatus));
      // Filter for users seen in the last 5 minutes AND who are 'available'
      const active = docs.filter(s => {
        if (!s.lastSeen) return false;
        try {
          const lastSeenTime = new Date(s.lastSeen).getTime();
          if (isNaN(lastSeenTime)) return false;
          // Users are active if seen in last 10 minutes
          return s.available && (now - lastSeenTime < 10 * 60 * 1000);
        } catch {
          return false;
        }
      });
      setSquad(active);
    });
    return unsub;
  }, []);

  const setStatus = async (userId: string, status: UserStatus) => {
    const ref = doc(db, 'presence', userId);
    const { setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(ref, { 
      ...status, 
      lastSeen: new Date().toISOString(),
      updatedAt: serverTimestamp() 
    }, { merge: true });
  };

  return { squad, setStatus };
}

// ── Dynamic Culture Data ─────────────────────────────────
interface CultureFact { cityId: string; flag: string; city: string; fact: string }
interface WOTDItem { lang: string; word: string; translation: string; useCase: string }

export function useCultureData() {
  const [facts, setFacts] = useState<CultureFact[]>([]);
  const [wotd, setWotd] = useState<WOTDItem[]>([]);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubFacts = onSnapshot(collection(db, 'cultureFacts'), snap => {
      setFacts(snap.docs.map(d => d.data() as CultureFact));
    });
    const unsubWotd = onSnapshot(collection(db, 'wotd'), snap => {
      setWotd(snap.docs.map(d => d.data() as WOTDItem));
    });
    const unsubIce = onSnapshot(collection(db, 'icebreakers'), snap => {
      setIcebreakers(snap.docs.map(d => d.data().text as string));
    });
    const unsubDishes = onSnapshot(collection(db, 'dishes'), snap => {
      setDishes(snap.docs.map(d => d.data() as Dish));
    });
    
    setLoading(false);
    return () => { unsubFacts(); unsubWotd(); unsubIce(); unsubDishes(); };
  }, []);

  const seed = async (data: { 
    facts: CultureFact[], 
    wotd: WOTDItem[], 
    icebreakers: string[], 
    squadCodes: string[], 
    dishes: Dish[],
    quiz: QuizQuestion[]
  }) => {
    const { writeBatch, doc: fireDoc } = await import('firebase/firestore');
    const batch = writeBatch(db);
    
    data.facts.forEach((f: CultureFact) => batch.set(fireDoc(collection(db, 'cultureFacts')), f));
    data.wotd.forEach((w: WOTDItem) => batch.set(fireDoc(collection(db, 'wotd')), w));
    data.icebreakers.forEach((i: string) => batch.set(fireDoc(collection(db, 'icebreakers')), { text: i }));
    data.squadCodes.forEach((c: string) => batch.set(fireDoc(collection(db, 'squadCodes')), { code: c }));
    data.dishes.forEach((d: Dish) => batch.set(fireDoc(collection(db, 'dishes')), d));
    data.quiz.forEach((q: QuizQuestion) => batch.set(fireDoc(collection(db, 'quiz')), q));
    
    await batch.commit();
  };

  const addDish = async (dish: Dish) => {
    await addDoc(collection(db, 'dishes'), dish);
  };

  return { facts, wotd, icebreakers, dishes, loading, seed, addDish };
}

// ── Quiz ────────────────────────────────────────────────
export function useQuiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'quiz'), snap => {
      setQuestions(snap.docs.map(d => ({ ...d.data(), id: d.id } as QuizQuestion)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addQuestion = async (q: Omit<QuizQuestion, 'id'>) => {
    await addDoc(collection(db, 'quiz'), q);
  };

  return { questions, loading, addQuestion };
}

// ── Quiz Scores ─────────────────────────────────────────
export function useQuizScores() {
  const [scores, setScores] = useState<{name:string, score:number, cityId:string}[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'quizScores'), orderBy('score', 'desc'), limit(10));
    const unsub = onSnapshot(q, snap => {
      setScores(snap.docs.map(d => d.data() as {name:string, score:number, cityId:string}));
    });
    return unsub;
  }, []);

  const saveScore = async (name: string, cityId: string, score: number) => {
    await addDoc(collection(db, 'quizScores'), { name, cityId, score, createdAt: serverTimestamp() });
  };

  return { scores, saveScore };
}

// ── Global Chat ─────────────────────────────────────────
export type ChatMsg = { id:string, author:string, text:string, lang:string, trans: {nl:string, pt:string, ta:string, en?:string}, createdAt: { seconds: number, nanoseconds: number } | null };
export function useGlobalChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'globalChat'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMsg)).reverse());
    });
    return unsub;
  }, []);

  const sendMsg = async (author: string, text: string, lang: string) => {
    const { getFullTranslation } = await import('../utils/translate');
    const trans = await getFullTranslation(text, lang.toLowerCase());
    await addDoc(collection(db, 'globalChat'), { author, text, lang, trans, createdAt: serverTimestamp() });
  };

  return { messages, sendMsg };
}

// ── Squad Codes ──────────────────────────────────────────
export function useSquadCodes() {
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'squadCodes'), snap => {
      setCodes(snap.docs.map(d => d.data().code as string));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addCode = async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    await addDoc(collection(db, 'squadCodes'), { code: c });
  };

  const removeCode = async (code: string) => {
    const q = query(collection(db, 'squadCodes'));
    const unsub = onSnapshot(q, async (snap) => {
      const docToDel = snap.docs.find(d => d.data().code === code);
      if (docToDel) {
        const { deleteDoc, doc: fireDoc } = await import('firebase/firestore');
        await deleteDoc(fireDoc(db, 'squadCodes', docToDel.id));
      }
    });
    unsub();
  };

  return { codes, loading, addCode, removeCode };
}

// ── Ideas / Suggestions ──────────────────────────────────
export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Idea)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addIdea = async (idea: Omit<Idea, 'id' | 'votes' | 'status' | 'createdAt'>) => {
    await addDoc(collection(db, 'ideas'), {
      ...idea,
      votes: [],
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  };

  const toggleVote = async (ideaId: string, userName: string, voted: boolean, cityId: string) => {
    const ref = doc(db, 'ideas', ideaId);
    await updateDoc(ref, { votes: voted ? arrayRemove(userName) : arrayUnion(userName) });
    if (!voted) {
      void recordEngagementSignal('idea_vote', {
        userName,
        cityId,
        metadata: { ideaId },
      });
    }
  };

  const updateStatus = async (ideaId: string, status: 'pending' | 'realized' | 'rejected') => {
    const ref = doc(db, 'ideas', ideaId);
    await updateDoc(ref, { status });
  };

  return { ideas, loading, addIdea, toggleVote, updateStatus };
}

/** Own presence doc — avatar mood still works when user is “unavailable” (hidden from squad list). `tabKey` re-runs the effect after Connect creates `dupoind_userId` (child render runs before parent effects). */
export function useMyPresenceDoc(loggedIn: boolean, tabKey: string) {
  const [status, setStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    const id = typeof localStorage !== 'undefined' ? localStorage.getItem('dupoind_userId') : null;
    if (!id) return;
    const ref = doc(db, 'presence', id);
    const unsub = onSnapshot(ref, (snap) => {
      setStatus(snap.exists() ? (snap.data() as UserStatus) : null);
    });
    return unsub;
  }, [loggedIn, tabKey]);

  return loggedIn ? status : null;
}
