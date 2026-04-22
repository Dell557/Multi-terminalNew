import api from './api';

export const chatWithAI = async (messages, model = 'gpt-4o') => {
  const res = await api.post('/ai/chat', { messages, model });
  if (!res.ok) {
    throw new Error(res.message || 'AI 请求失败');
  }
  return res.data;
};

export const chatCompletions = async (messages, model = 'gpt-4o') => {
  const res = await api.post('/ai/chat', { messages, model });
  if (!res.ok) {
    throw new Error(res.message || 'AI 请求失败');
  }
  return res.data;
};

export const chatCompletionsStream = async (messages, model = 'gpt-4o', onChunk) => {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, model, stream: true })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(data);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (content && onChunk) {
          onChunk(content);
        }
      } catch (e) {}
    }
  }
};

export const listModels = async () => {
  return await api.get('/ai/models');
};
