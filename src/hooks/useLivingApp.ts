import { useEffect, useRef } from 'react';
import { useIdeas, useWallPosts, usePolls, useSystemLogs, useKudos } from './useFirestore';
import { getFullTranslation } from '../utils/translate';
import type { Idea, WallPost } from '../types';

const NEWS_FEEDS: Record<string, string> = {
  utrecht: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.duic.nl%2Ffeed%2F',
  lisbon:  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.publico.pt%2Frss%2Flocal%2Flisboa',
  chennai: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.thehindu.com%2Fnews%2Fcities%2Fchennai%2Ffeeder%2Fdefault.rss',
};

export function useLivingApp() {
  const { ideas, updateStatus } = useIdeas();
  const { posts, addPost } = useWallPosts();
  const { createPoll } = usePolls();
  const { addLog } = useSystemLogs();
  const { kudos } = useKudos();
  const lastUpdate = useRef<number>(0);
  const cycleCount = useRef<number>(0);

  useEffect(() => {
    // Run the Living Brain check every 10 minutes (or on mount if stale)
    const checkFrequency = 10 * 60 * 1000; 
    
    async function runBrain() {
      const now = Date.now();
      if (now - lastUpdate.current < checkFrequency) return;
      lastUpdate.current = now;
      cycleCount.current += 1;

      console.log('🧠 Living Brain: Checking for updates...');
      await addLog({ action: 'Living Brain Heartbeat', status: 'success', details: `Cycle #${cycleCount.current}` });

      // 1. Maintenance: Kudos Roundup (Every 5 cycles)
      if (cycleCount.current % 5 === 0 && kudos.length > 0) {
        await runKudosRoundup();
      }

      // 2. Check for many-voted ideas to realize
      const popularIdea = ideas.find(i => i.status === 'pending' && i.votes.length >= 2);
      if (popularIdea) {
        await realizeIdea(popularIdea);
        return;
      }

      // 3. Fetch news and post a System Spotlight
      const cities = ['utrecht', 'lisbon', 'chennai'];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      try {
        const res = await fetch(NEWS_FEEDS[randomCity]);
        const data = await res.json();
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const news = data.items[0];
          
          // Duplicate Prevention: Check if this headline was already posted
          const isDuplicate = posts.some((p: WallPost) => p.content.includes(news.title));
          if (isDuplicate) {
            await addLog({ action: 'News Sync', status: 'success', details: `News for ${randomCity} up to date (no new items)` });
            return;
          }

          const content = `📰 ${randomCity.toUpperCase()} SPOTLIGHT: ${news.title}`;
          const translations = await getFullTranslation(content);
          
          await addPost({
            author: 'Dupo-Atlas',
            city: randomCity.charAt(0).toUpperCase() + randomCity.slice(1),
            cityId: randomCity,
            content: `${content}\n\nRead more: ${news.link}`,
            emoji: '🌍',
            time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            translations
          });
          await addLog({ action: 'News Sync', status: 'success', details: `Synced latest news for ${randomCity}` });
        }
      } catch (e) {
        await addLog({ action: 'News Sync', status: 'warning', details: `Failed to sync news for ${randomCity}` });
        console.error('❌ News fetch failed', e);
      }
    }

    async function runKudosRoundup() {
      const recentKudos = kudos.slice(0, 5);
      const authors = recentKudos.map(k => k.from).join(', ');
      const content = `🏆 SQUAD APPRECIATION: Big shoutout to our recent contributors: ${authors}! Keep spreading the culture! 🙌`;
      const translations = await getFullTranslation(content);

      await addPost({
        author: 'Dupo-Atlas', city: 'System', cityId: 'system',
        content, emoji: '🏆',
        time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        translations
      });
      await addLog({ action: 'Kudos Roundup', status: 'success', details: 'Posted squad appreciation summary' });
    }

    async function realizeIdea(idea: Idea) {
      const { title, description, category, author } = idea;
      const content = `✨ SUGGESTION REALIZED: ${title}\n(Originally suggested by ${author})\n\n${description}`;
      const translations = await getFullTranslation(content);

      if (category === 'poll') {
        await createPoll({
          question: `📊 SQUAD VOTE: ${title}`,
          options: [{ label: 'Agree 👍', votes: [] }, { label: 'Strongly Agree 🔥', votes: [] }, { label: 'Meh 😐', votes: [] }],
          author: 'Dupo-Atlas',
          cityId: 'system',
          createdAt: new Date().toISOString()
        });
      } else {
        await addPost({
          author: 'Dupo-Atlas', cityId: 'system', city: 'System',
          content, emoji: '🚀',
          time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          translations
        });
      }

      await updateStatus(idea.id, 'realized');
      await addLog({ action: 'Idea Realization', status: 'success', details: `Realized idea: ${title}` });
    }

    if (ideas.length > 0) {
      runBrain();
    }
  }, [ideas, addPost, createPoll, updateStatus, addLog, kudos, posts]);
}
