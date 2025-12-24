import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface TelegramPostPreviewProps {
  data: {
    name: string;
    profession?: string;
    professions?: string[];
    professionDescriptions?: Record<string, string>;
    city?: string;
    age?: number;
    agency_name?: string;
    agency_description?: string;
    self_description?: string;
    phone?: string;
    tg_channel?: string;
    website?: string;
    youtube?: string;
    rutube?: string;
    dzen?: string;
    vk_video?: string;
    office_address?: string;
    photo_url?: string;
  };
}

export function TelegramPostPreview({ data }: TelegramPostPreviewProps) {
  const profession = data.profession || data.professions?.join(', ') || '';
  const professions = profession ? profession.split(', ').map(p => p.trim()).filter(Boolean) : [];
  
  // Build info line
  const infoItems: string[] = [];
  if (profession) infoItems.push(profession);
  if (data.city) infoItems.push(`📍 ${data.city}`);
  if (data.age) infoItems.push(`${data.age} лет`);

  // Build links array
  const links: { emoji: string; label: string; url: string }[] = [];
  
  if (data.tg_channel) {
    const channelLink = data.tg_channel.startsWith('@') 
      ? `https://t.me/${data.tg_channel.slice(1)}`
      : data.tg_channel.startsWith('http') ? data.tg_channel : `https://t.me/${data.tg_channel}`;
    links.push({ emoji: '💬', label: 'Telegram', url: channelLink });
  }
  
  if (data.website) {
    const websiteUrl = data.website.startsWith('http') ? data.website : `https://${data.website}`;
    links.push({ emoji: '🌐', label: 'Сайт', url: websiteUrl });
  }
  
  if (data.youtube) {
    links.push({ emoji: '▶️', label: 'YouTube', url: data.youtube });
  }
  
  if (data.rutube) {
    links.push({ emoji: '📺', label: 'Rutube', url: data.rutube });
  }
  
  if (data.dzen) {
    links.push({ emoji: '📰', label: 'Дзен', url: data.dzen });
  }
  
  if (data.vk_video) {
    links.push({ emoji: '📹', label: 'VK Видео', url: data.vk_video });
  }

  // Build hashtags from professions
  const hashtags = professions.map(p => '#' + p.replace(/[\s-]+/g, '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, ''));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">Канал партнёров</p>
          <p className="text-white/50 text-xs">публичный канал</p>
        </div>
      </div>

      {/* Photo if exists */}
      {data.photo_url && (
        <div className="aspect-[4/3] bg-black/20">
          <img 
            src={data.photo_url} 
            alt="Фото партнёра" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Message Content */}
      <div className="p-4 space-y-3 text-white text-sm">
        {/* Name */}
        <p className="font-bold text-base">{data.name}</p>
        
        {/* Info line */}
        {infoItems.length > 0 && (
          <p className="text-white/80">{infoItems.join(' • ')}</p>
        )}

        {/* Profession descriptions in quote blocks */}
        {data.professionDescriptions && professions.length > 0 && professions.map((prof, index) => {
          const desc = data.professionDescriptions?.[prof];
          if (!desc || !desc.trim()) return null;
          return (
            <motion.div 
              key={prof}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-l-2 border-blue-400/50 pl-3 text-white/70 italic"
            >
              <span className="text-white/90 not-italic font-medium">{prof}:</span> {desc.trim()}
            </motion.div>
          );
        })}

        {/* Self description */}
        {data.self_description && (
          <div className="border-l-2 border-blue-400/50 pl-3 text-white/70 italic">
            <span className="text-white/90 not-italic font-medium">О себе:</span>
            <br />
            {data.self_description.trim()}
          </div>
        )}

        {/* Agency info */}
        {data.agency_name && (
          <div className="space-y-1">
            <p className="text-white/90">🏢 <span className="font-medium">{data.agency_name}</span></p>
            {data.agency_description && (
              <p className="text-white/70 italic border-l-2 border-blue-400/50 pl-3">
                {data.agency_description.trim()}
              </p>
            )}
          </div>
        )}

        {/* Contacts */}
        <div className="pt-2 space-y-2">
          <p className="font-medium text-white/90">Контакты:</p>
          
          {data.phone && (
            <p className="text-white/80">📞 {data.phone}</p>
          )}
          
          {/* Links */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-blue-400">
              {links.map((link, index) => (
                <motion.span 
                  key={link.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="hover:underline cursor-pointer"
                >
                  {link.emoji} {link.label}
                </motion.span>
              ))}
            </div>
          )}
        </div>

        {/* Office address */}
        {data.office_address && (
          <p className="text-white/80">
            <span className="font-medium text-white/90">Адрес офиса:</span> {data.office_address}
          </p>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-2 flex flex-wrap gap-2"
          >
            {hashtags.map((tag, index) => (
              <span 
                key={index} 
                className="text-blue-400 text-xs"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Footer with timestamp */}
      <div className="px-4 pb-3 flex justify-end">
        <span className="text-white/40 text-xs">
          {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
