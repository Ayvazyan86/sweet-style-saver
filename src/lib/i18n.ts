// Локализация RU/EN
export const translations = {
  ru: {
    // Navigation
    becomePartner: 'Стать партнёром',
    wantToOrder: 'Хочу заказать',
    askQuestion: 'Задать вопрос',
    
    
    // Form labels
    name: 'Имя',
    age: 'Возраст',
    profession: 'Профессия',
    city: 'Город',
    categories: 'Категории',
    agencyName: 'Название агентства',
    agencyDescription: 'Описание агентства',
    selfDescription: 'Описание себя',
    phone: 'Телефон',
    tgChannel: 'Telegram канал',
    website: 'Сайт',
    youtube: 'YouTube / Rutube / Дзен',
    officeAddress: 'Адрес офиса',
    
    // Order form
    orderText: 'Текст заказа',
    budget: 'Бюджет',
    contact: 'Контакт для связи',
    
    // Question form
    questionText: 'Текст вопроса',
    details: 'Детали / контекст',
    
    // Buttons
    submit: 'Отправить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить',
    confirm: 'Подтвердить',
    
    // Statuses
    pending: 'На модерации',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    active: 'Активно',
    expired: 'Истекло',
    awaitingPartners: 'Ожидает партнёров',
    
    // Messages
    applicationSent: 'Заявка отправлена',
    applicationSentDesc: 'Ваша заявка отправлена на модерацию',
    error: 'Ошибка',
    errorDesc: 'Произошла ошибка. Попробуйте позже.',
    required: 'Обязательное поле',
    selectCategories: 'Выберите категории',
    selectCategory: 'Выберите категорию',
    
    // Placeholders
    enterName: 'Введите имя',
    enterAge: 'Введите возраст',
    enterProfession: 'Введите профессию',
    enterCity: 'Введите город',
    enterPhone: 'Введите телефон',
    enterWebsite: 'https://example.com',
    enterDescription: 'Введите описание...',
    enterOrderText: 'Опишите, что вам нужно...',
    enterQuestionText: 'Введите ваш вопрос...',
  },
  en: {
    // Navigation
    becomePartner: 'Become a Partner',
    wantToOrder: 'Want to Order',
    askQuestion: 'Ask a Question',
    
    
    // Form labels
    name: 'Name',
    age: 'Age',
    profession: 'Profession',
    city: 'City',
    categories: 'Categories',
    agencyName: 'Agency Name',
    agencyDescription: 'Agency Description',
    selfDescription: 'About Yourself',
    phone: 'Phone',
    tgChannel: 'Telegram Channel',
    website: 'Website',
    youtube: 'YouTube / Rutube / Zen',
    officeAddress: 'Office Address',
    
    // Order form
    orderText: 'Order Text',
    budget: 'Budget',
    contact: 'Contact Info',
    
    // Question form
    questionText: 'Question Text',
    details: 'Details / Context',
    
    // Buttons
    submit: 'Submit',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    
    // Statuses
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    expired: 'Expired',
    awaitingPartners: 'Awaiting Partners',
    
    // Messages
    applicationSent: 'Application Sent',
    applicationSentDesc: 'Your application has been sent for moderation',
    error: 'Error',
    errorDesc: 'An error occurred. Please try again later.',
    required: 'Required field',
    selectCategories: 'Select categories',
    selectCategory: 'Select category',
    
    // Placeholders
    enterName: 'Enter name',
    enterAge: 'Enter age',
    enterProfession: 'Enter profession',
    enterCity: 'Enter city',
    enterPhone: 'Enter phone',
    enterWebsite: 'https://example.com',
    enterDescription: 'Enter description...',
    enterOrderText: 'Describe what you need...',
    enterQuestionText: 'Enter your question...',
  }
};

export type Language = 'ru' | 'en';
export type TranslationKey = keyof typeof translations.ru;

export const t = (key: TranslationKey, lang: Language = 'ru'): string => {
  return translations[lang][key] || key;
};
