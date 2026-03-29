import { useEffect, useRef } from 'react';
import { useIdeas, useWallPosts, usePolls, useKudos } from './useFirestore';
import { getFullTranslation } from '../utils/translate';
import type { Idea, WallPost } from '../types';
import { getHubConfig } from '../config/appConfig';

/**
 * Background automation with minimal Firestore usage (Spark quota).
 * Uses a single interval + refs so snapshot updates do not re-trigger runs.
 */
export function useLivingApp() {
  const { ideas, updateStatus } = useIdeas();
  const { posts, addPost } = useWallPosts();
  const { createPoll } = usePolls();
  const { kudos } = useKudos();

  const ideasRef = useRef(ideas);
  const postsRef = useRef(posts);
  const kudosRef = useRef(kudos);
  const addPostRef = useRef(addPost);
  const updateStatusRef = useRef(updateStatus);
  const createPollRef = useRef(createPoll);

  ideasRef.current = ideas;
  postsRef.current = posts;
  kudosRef.current = kudos;
  addPostRef.current = addPost;
  updateStatusRef.current = updateStatus;
  createPollRef.current = createPoll;

  useEffect(() => {
    const cfg = getHubConfig();
    const cityIds = cfg.cities.map((c) => c.id);
    const newsFeeds = cfg.newsFeeds as Record<string, string>;
    const assistantName = cfg.assistantName;
    const intervalMs = Math.max(cfg.livingBrainIntervalMs ?? 3_600_000, 300_000);
    const cycleCount = { current: 0 };
    let lastThrottle = 0;

    async function runKudosRoundup() {
      const kudosList = kudosRef.current;
      const recentKudos = kudosList.slice(0, 5);
      const authors = recentKudos.map((k) => k.from).join(', ');
      const content = `🏆 SQUAD APPRECIATION: Big shoutout to our recent contributors: ${authors}! Keep spreading the culture! 🙌`;
      const translations = await getFullTranslation(content);

      await addPostRef.current({
        author: assistantName,
        city: 'System',
        cityId: 'system',
        content,
        emoji: '🏆',
        time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        translations,
      });
    }

    async function realizeIdea(idea: Idea) {
      const { title, description, category, author } = idea;
      const content = `✨ SUGGESTION REALIZED: ${title}\n(Originally suggested by ${author})\n\n${description}`;
      const translations = await getFullTranslation(content);

      if (category === 'poll') {
        await createPollRef.current({
          question: `📊 SQUAD VOTE: ${title}`,
          options: [
            { label: 'Agree 👍', votes: [] },
            { label: 'Strongly Agree 🔥', votes: [] },
            { label: 'Meh 😐', votes: [] },
          ],
          author: assistantName,
          cityId: 'system',
          createdAt: new Date().toISOString(),
        });
      } else {
        await addPostRef.current({
          author: assistantName,
          cityId: 'system',
          city: 'System',
          content,
          emoji: '🚀',
          time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          translations,
        });
      }

      await updateStatusRef.current(idea.id, 'realized');
    }

    async function runBrain() {
      const now = Date.now();
      if (now - lastThrottle < 60_000) return;
      lastThrottle = now;
      cycleCount.current += 1;

      if (import.meta.env.DEV) {
        console.log('🧠 Living Brain: cycle', cycleCount.current);
      }

      const ideasList = ideasRef.current;
      const postsList = postsRef.current;
      const kudosList = kudosRef.current;

      if (cycleCount.current % 5 === 0 && kudosList.length > 0) {
        await runKudosRoundup();
        return;
      }

      const popularIdea = ideasList.find((i) => i.status === 'pending' && i.votes.length >= 2);
      if (popularIdea) {
        await realizeIdea(popularIdea);
        return;
      }

      const randomCity = cityIds[Math.floor(Math.random() * cityIds.length)];
      const feedUrl = newsFeeds[randomCity];
      if (!feedUrl) return;

      try {
        const res = await fetch(feedUrl);
        const data = await res.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const news = data.items[0];
          const isDuplicate = postsList.some((p: WallPost) => p.content.includes(news.title));
          if (isDuplicate) return;

          const content = `📰 ${randomCity.toUpperCase()} SPOTLIGHT: ${news.title}`;
          const translations = await getFullTranslation(content);

          await addPostRef.current({
            author: assistantName,
            city: randomCity.charAt(0).toUpperCase() + randomCity.slice(1),
            cityId: randomCity,
            content: `${content}\n\nRead more: ${news.link}`,
            emoji: '🌍',
            time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            translations,
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('News sync failed', e);
      }
    }

    const timer = setInterval(() => {
      void runBrain();
    }, intervalMs);
    const first = setTimeout(() => {
      void runBrain();
    }, 30_000);

    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, []);
}
