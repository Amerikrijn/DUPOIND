import { useEffect, useState } from 'react';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import type { WallPost, KudoEntry, Poll, UserStatus, Dish, QuizQuestion } from '../types';

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

// ── Polls ───────────────────────────────────────────────
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, snap => {
      setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() } as Poll)));
    });
    return unsub;
  }, []);

  const createPoll = async (poll: Omit<Poll, 'id'>) => {
    await addDoc(collection(db, 'polls'), { ...poll, createdAt: serverTimestamp() });
  };

  const vote = async (pollId: string, optionIndex: number, userName: string) => {
    const ref = doc(db, 'polls', pollId);
    // Remove vote from all options first, then add to chosen
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const newOptions = poll.options.map((opt, i) => ({
      ...opt,
      votes: i === optionIndex
        ? [...opt.votes.filter(v => v !== userName), userName]
        : opt.votes.filter(v => v !== userName),
    }));
    await updateDoc(ref, { options: newOptions });
  };

  return { polls, createPoll, vote };
}

// ── Presence / Status ────────────────────────────────────
export function usePresence() {
  const [squad, setSquad] = useState<UserStatus[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'presence'), snap => {
      setSquad(snap.docs.map(d => ({ ...d.data(), id: d.id } as UserStatus)));
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

  return { facts, wotd, icebreakers, dishes, loading, seed };
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

  return { questions, loading };
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
