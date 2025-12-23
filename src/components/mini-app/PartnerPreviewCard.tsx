import { User, MapPin, Briefcase, Phone, Globe, Youtube } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PartnerPreviewCardProps {
  data: {
    name: string;
    birthDate?: string;
    age?: string;
    profession?: string;
    professions?: string[];
    city: string;
    agency_name: string;
    agency_description: string;
    self_description: string;
    phone: string;
    tg_channel: string;
    website: string;
    youtube: string;
    rutube: string;
    dzen: string;
    vk_video: string;
    tg_video: string;
    office_address: string;
    photo_url: string;
  };
  categories: { id: string; name: string }[];
}

export function PartnerPreviewCard({ data, categories }: PartnerPreviewCardProps) {
  const hasContacts = data.phone || data.tg_channel || data.website;
  const hasVideoPlatforms = data.youtube || data.rutube || data.dzen || data.vk_video || data.tg_video;

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-4 text-muted-foreground text-xs uppercase tracking-wider mb-2">
        <span>Предпросмотр карточки</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        {data.photo_url ? (
          <img 
            src={data.photo_url} 
            alt={data.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">
            {data.name ? data.name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {data.name || 'Имя не указано'}
          </h3>
          {(data.profession || (data.professions && data.professions.length > 0)) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {data.profession || data.professions?.join(', ')}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {(data.age || data.birthDate) && (
              <span>
                {data.age ? data.age : 
                  data.birthDate ? Math.floor((new Date().getTime() - new Date(data.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : ''
                } лет
              </span>
            )}
            {data.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {data.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <Badge key={cat.id} variant="secondary" className="text-xs">
              {cat.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Agency */}
      {data.agency_name && (
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-sm font-medium text-foreground">{data.agency_name}</p>
          {data.agency_description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.agency_description}
            </p>
          )}
        </div>
      )}

      {/* Self description */}
      {data.self_description && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {data.self_description}
        </p>
      )}

      {/* Contacts */}
      {hasContacts && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Контакты</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {data.phone && (
              <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                <Phone className="w-3 h-3" />
                {data.phone}
              </span>
            )}
            {data.tg_channel && (
              <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                💬 {data.tg_channel}
              </span>
            )}
            {data.website && (
              <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                <Globe className="w-3 h-3" />
                Сайт
              </span>
            )}
          </div>
        </div>
      )}

      {/* Video platforms */}
      {hasVideoPlatforms && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Видеоконтент</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {data.youtube && (
              <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded">
                <Youtube className="w-3 h-3" />
                YouTube
              </span>
            )}
            {data.rutube && (
              <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                ▶️ Rutube
              </span>
            )}
            {data.dzen && (
              <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                📰 Дзен
              </span>
            )}
            {data.vk_video && (
              <span className="flex items-center gap-1 bg-sky-500/20 text-sky-400 px-2 py-1 rounded">
                ▶️ VK
              </span>
            )}
            {data.tg_video && (
              <span className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded">
                💬 TG Video
              </span>
            )}
          </div>
        </div>
      )}

      {/* Office address */}
      {data.office_address && (
        <div className="text-xs text-muted-foreground flex items-start gap-1.5 pt-2 border-t border-white/10">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{data.office_address}</span>
        </div>
      )}
    </div>
  );
}
