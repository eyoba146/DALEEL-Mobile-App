export type Language = 'en' | 'am' | 'om' | 'ar';

export interface LanguageMeta {
  code: Language;
  name: string;
  nativeName: string;
  badge: string;
  isRTL?: boolean;
}

export const ADMIN_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', badge: 'EN', isRTL: false },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', badge: 'አማ', isRTL: false },
  { code: 'om', name: 'Oromiffa', nativeName: 'Afaan Oromoo', badge: 'OM', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', badge: 'عربي', isRTL: true },
];

export const adminTranslations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'DALEEL',
    'brand.sub': 'MANAGEMENT PORTAL',
    'brand.lead': 'Command Portal',
    
    // Navigation Sections
    'nav.section.core': 'EXECUTIVE CORE',
    'nav.section.heritage': 'HERITAGE & TOURISM',
    'nav.section.commerce': 'COMMERCE & DIRECTORY',
    'nav.section.governance': 'GOVERNANCE & ACCOUNT',

    // Nav Items
    'nav.dashboard': 'Overview & Ops',
    'nav.inquiries': 'Master Triage Desk',
    'nav.destinations': 'Destinations & Sites',
    'nav.events': 'Events & Gatherings',
    'nav.services': 'Verified Services',
    'nav.marketplace': 'Artisan Marketplace',
    'nav.investments': 'Diaspora Investments',
    'nav.users': 'Registered Members',
    'nav.team': 'Administrative Team',
    'nav.profile': 'Security & Profile',

    // Tab Titles & Subtitles
    'tab.dashboard.title': 'Overview & Activity',
    'tab.dashboard.sub': 'Summary of heritage destinations, service partners, and marketplace orders',
    'tab.inquiries.title': 'Master Triage Desk',
    'tab.inquiries.sub': 'Role-based triage desk monitoring customer inquiries, reservations, and orders',
    'tab.destinations.title': 'Heritage & Tourism',
    'tab.destinations.sub': 'Manage regional attractions, UNESCO cultural sites, and map coordinates',
    'tab.services.title': 'Verified Partner Directory',
    'tab.services.sub': 'Manage certified professional service providers and review customer inquiries',
    'tab.events.title': 'Events & Gatherings',
    'tab.events.sub': 'Publish summits, community gatherings, venue locations, and manage RSVPs',
    'tab.marketplace.title': 'Artisan Marketplace',
    'tab.marketplace.sub': 'Curate authentic Ethiopian crafts, apparel, and track customer order requests',
    'tab.investments.title': 'Diaspora Investments',
    'tab.investments.sub': 'Manage high-growth opportunities, syndicates, and investor inquiries',
    'tab.users.title': 'Registered Members Directory',
    'tab.users.sub': 'Roster of registered Ethiopian diaspora and foreign resident accounts',
    'tab.team.title': 'Administrative Team',
    'tab.team.sub': 'Manage coordinator permissions and delegate module responsibilities',
    'tab.profile.title': 'Security & Profile',
    'tab.profile.sub': 'Manage your administrator details, security credentials, and access permissions',

    // Roles
    'role.super_admin': 'Full Administrator',
    'role.destination_manager': 'Tourism & Heritage Lead',
    'role.service_manager': 'Services Directory Lead',
    'role.event_manager': 'Events Coordinator',
    'role.marketplace_manager': 'Marketplace Lead',
    'role.investment_officer': 'Investment Officer',
    'role.admin': 'Administrator',
    'role.coordinator': 'Coordinator',

    // Sidebar Widgets & Footer
    'status.operational': 'Operational',
    'status.allOnline': 'All Services Online',
    'status.encrypted': 'Encrypted Session Active',
    'status.platformStatus': 'Platform Status',
    'sidebar.manage': 'Manage',
    'sidebar.signOut': 'Sign Out',
    'sidebar.securityProfile': 'Security & Profile',

    // Common Actions
    'action.refresh': 'Refresh',
    'action.addNew': 'Add New',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.cancel': 'Cancel',
    'action.save': 'Save Changes',
    'action.saving': 'Saving...',
    'action.filter': 'Filter',
    'action.search': 'Search...',
    'action.all': 'All',
    'action.status': 'Status',
    'action.actions': 'Actions',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.export': 'Export Data',

    // Status Badges
    'badge.pending': 'Pending',
    'badge.approved': 'Approved',
    'badge.rejected': 'Rejected',
    'badge.completed': 'Completed',
    'badge.inProgress': 'In Progress',
    'badge.active': 'Active',
    'badge.inactive': 'Inactive',
    'badge.verified': 'Verified',
  },

  am: {
    // Brand & Header
    'brand.title': 'ዳሊል',
    'brand.sub': 'የአስተዳደር ፖርታል',
    'brand.lead': 'የቁጥጥር ፖርታል',

    // Navigation Sections
    'nav.section.core': 'ዋና አስፈጻሚ ክፍል',
    'nav.section.heritage': 'ቅርሶች እና ቱሪዝም',
    'nav.section.commerce': 'ንግድ እና ማውጫ',
    'nav.section.governance': 'አስተዳደር እና መለያ',

    // Nav Items
    'nav.dashboard': 'አጠቃላይ እይታ እና ክንውኖች',
    'nav.inquiries': 'የጥያቄዎች መቆጣጠሪያ ዴስክ',
    'nav.destinations': 'የቱሪዝም መዳረሻዎች',
    'nav.events': 'ክስተቶች እና ስብሰባዎች',
    'nav.services': 'የተረጋገጡ አገልግሎቶች',
    'nav.marketplace': 'የእደ-ጥበብ ገበያ',
    'nav.investments': 'የዲያስፖራ ኢንቨስትመንት',
    'nav.users': 'የተመዘገቡ አባላት',
    'nav.team': 'የአስተዳደር ቡድን',
    'nav.profile': 'ደህንነት እና መገለጫ',

    // Tab Titles & Subtitles
    'tab.dashboard.title': 'አጠቃላይ እይታ እና እንቅስቃሴ',
    'tab.dashboard.sub': 'የታሪካዊ መዳረሻዎች፣ የአገልግሎት አጋሮች እና የገበያ ትዕዛዞች ማጠቃለያ',
    'tab.inquiries.title': 'የጥያቄዎች መቆጣጠሪያ ዴስክ',
    'tab.inquiries.sub': 'የደንበኛ ጥያቄዎችን፣ ምዝገባዎችን እና ትዕዛዞችን የሚከታተል ክፍል',
    'tab.destinations.title': 'ቅርሶች እና ቱሪዝም',
    'tab.destinations.sub': 'የክልል መስህቦችን፣ የዩኔስኮ የባህል ቦታዎችን እና የካርታ መጋጠሚያዎችን ያስተዳድሩ',
    'tab.services.title': 'የተረጋገጡ አጋሮች ማውጫ',
    'tab.services.sub': 'ብቁ የሙያ አገልግሎት አቅራቢዎችን ያስተዳድሩ እና ጥያቄዎችን ይገምግሙ',
    'tab.events.title': 'ክስተቶች እና ስብሰባዎች',
    'tab.events.sub': 'ጉባኤዎችን፣ ማህበራዊ ስብሰባዎችን፣ የቦታ መረጃዎችን ያሳትሙ እና ምዝገባን ይከታተሉ',
    'tab.marketplace.title': 'የእደ-ጥበብ ገበያ',
    'tab.marketplace.sub': 'ትክክለኛ የኢትዮጵያ አልባሳትንና ምርቶችን ያቅርቡ፣ ትዕዛዞችን ይከታተሉ',
    'tab.investments.title': 'የዲያስፖራ ኢንቨስትመንት',
    'tab.investments.sub': 'ከፍተኛ ዕድገት ያላቸው የንግድ ዕድሎችን እና የባለሀብቶች ጥያቄዎችን ያስተዳድሩ',
    'tab.users.title': 'የተመዘገቡ አባላት ማውጫ',
    'tab.users.sub': 'የተመዘገቡ የኢትዮጵያ ዲያስፖራ እና የውጭ ነዋሪ መለያዎች ዝርዝር',
    'tab.team.title': 'የአስተዳደር ቡድን',
    'tab.team.sub': 'የአስተባባሪዎችን ፈቃዶች ያስተዳድሩ እና የስራ ድርሻዎችን ይመድቡ',
    'tab.profile.title': 'ደህንነት እና መገለጫ',
    'tab.profile.sub': 'የአስተዳዳሪ ዝርዝሮችን፣ የደህንነት ምስክርነቶችን እና ፈቃዶችን ያስተዳድሩ',

    // Roles
    'role.super_admin': 'ዋና አስተዳዳሪ',
    'role.destination_manager': 'የቱሪዝም እና ቅርስ ኃላፊ',
    'role.service_manager': 'የአገልግሎቶች ማውጫ ኃላፊ',
    'role.event_manager': 'የክስተቶች አስተባባሪ',
    'role.marketplace_manager': 'የገበያ ኃላፊ',
    'role.investment_officer': 'የኢንቨስትመንት ኃላፊ',
    'role.admin': 'አስተዳዳሪ',
    'role.coordinator': 'አስተባባሪ',

    // Sidebar Widgets & Footer
    'status.operational': 'በጥሩ ሁኔታ ላይ',
    'status.allOnline': 'ሁሉም አገልግሎቶች ንቁ ናቸው',
    'status.encrypted': 'የተጠበቀ ክፍለ ጊዜ ንቁ ነው',
    'status.platformStatus': 'የስርዓት ሁኔታ',
    'sidebar.manage': 'አስተዳድር',
    'sidebar.signOut': 'ውጣ',
    'sidebar.securityProfile': 'ደህንነት እና መገለጫ',

    // Common Actions
    'action.refresh': 'አድስ',
    'action.addNew': 'አዲስ አክል',
    'action.edit': 'አርትዕ',
    'action.delete': 'ሰርዝ',
    'action.cancel': 'ተመለስ',
    'action.save': 'ለውጦችን አስቀምጥ',
    'action.saving': 'በማስቀመጥ ላይ...',
    'action.filter': 'አጣራ',
    'action.search': 'ፈልግ...',
    'action.all': 'ሁሉም',
    'action.status': 'ሁኔታ',
    'action.actions': 'ተግባራት',
    'action.close': 'ዝጋ',
    'action.confirm': 'አረጋግጥ',
    'action.export': 'መረጃ አውርድ',

    // Status Badges
    'badge.pending': 'በመጠባበቅ ላይ',
    'badge.approved': 'ጸድቋል',
    'badge.rejected': 'ተቀባይነት አላገኘም',
    'badge.completed': 'ተጠናቋል',
    'badge.inProgress': 'በሂደት ላይ',
    'badge.active': 'ንቁ',
    'badge.inactive': 'ቦዝኗል',
    'badge.verified': 'የተረጋገጠ',
  },

  om: {
    // Brand & Header
    'brand.title': 'DAALIL',
    'brand.sub': 'POORTAALII BULCHIINSAA',
    'brand.lead': 'Poortaalii Ajajaa',

    // Navigation Sections
    'nav.section.core': 'KUTAA HOJII RAAWWACHIISTUU',
    'nav.section.heritage': 'DHAAFUU FI TUURIZIMII',
    'nav.section.commerce': 'DALDALA FI QINDEESSA',
    'nav.section.governance': 'BULCHIINSA FI AKKAAWUNTII',

    // Nav Items
    'nav.dashboard': 'Waliigala & Hojiiwwan',
    'nav.inquiries': 'Teephoo Gaaffilee',
    'nav.destinations': 'Bakkeewwan Tuurizimii',
    'nav.events': 'Qophiiwwan & Walgaʼii',
    'nav.services': 'Tajaajiloota Mirkanaaʼan',
    'nav.marketplace': 'Gabaa Ogummaa Harkaa',
    'nav.investments': 'Invastimantii Diyaaspooraa',
    'nav.users': 'Miseensota Galmaaʼan',
    'nav.team': 'Garee Bulchiinsaa',
    'nav.profile': 'Nageenya & Piroofaayilii',

    // Tab Titles & Subtitles
    'tab.dashboard.title': 'Waliigala & Sochiiwwan',
    'tab.dashboard.sub': 'Cuunfaa bakkeewwan tuurizimii, qooda fudhattoota tajaajilaa fi ajajawwan gabaa',
    'tab.inquiries.title': 'Teephoo Gaaffilee',
    'tab.inquiries.sub': 'Gaaffilee maamiltootaa, qabiinsa iddoo fi ajajawwan toʼachuuf kan qophaaʼe',
    'tab.destinations.title': 'Dhaafuu & Tuurizimii',
    'tab.destinations.sub': 'Harkifattoota naannoo, bakkeewwan aadaa UNESCO fi koodiiwwan kaartaa bulchi',
    'tab.services.title': 'Galmee Tajaajiltoota Mirkanaaʼanii',
    'tab.services.sub': 'Dhiyeessitoota tajaajilaa gahumsa qaban bulchi, gaaffilee maamiltootaa sakattaʼi',
    'tab.events.title': 'Qophiiwwan & Walgaʼii',
    'tab.events.sub': 'Gurguddoo, walgaʼiiwwan hawaasaa fi iddoowwan maxxansi, hirmaattota bulchi',
    'tab.marketplace.title': 'Gabaa Ogummaa Harkaa',
    'tab.marketplace.sub': 'Oomishaalee aadaa Itoophiyaa dhiyeessi, ajajawwan maamilaa hordofi',
    'tab.investments.title': 'Invastimantii Diyaaspooraa',
    'tab.investments.sub': 'Carraawwan gurguddoo daldalaa fi gaaffilee invastarootaa bulchi',
    'tab.users.title': 'Galmee Miseensota Galmaaʼanii',
    'tab.users.sub': 'Tarree miseensota diyaaspooraa fi jiraattota alaa galmaaʼanii',
    'tab.team.title': 'Garee Bulchiinsaa',
    'tab.team.sub': 'Eeyyamawwan qindeessitootaa fi itti gaafatamummaa kutaalee qoodi',
    'tab.profile.title': 'Nageenya & Piroofaayilii',
    'tab.profile.sub': 'Odeeffannoo bulchaa, ragaalee nageenyaa fi eeyyamawwan seensaa bulchi',

    // Roles
    'role.super_admin': 'Bulchaa Olaanaa',
    'role.destination_manager': 'Hoggana Tuurizimii & Aadaa',
    'role.service_manager': 'Hoggana Tajaajilootaa',
    'role.event_manager': 'Qindeessaa Qophiiwwanii',
    'role.marketplace_manager': 'Hoggana Gabaa',
    'role.investment_officer': 'Qondaala Invastimantii',
    'role.admin': 'Bulchaa',
    'role.coordinator': 'Qindeessaa',

    // Sidebar Widgets & Footer
    'status.operational': 'Hojii Irra Jira',
    'status.allOnline': 'Tajaajiloonni Hundi Hojjechaa Jiru',
    'status.encrypted': 'Ciminni Nageenyaa Banameera',
    'status.platformStatus': 'Haala Sirnaa',
    'sidebar.manage': 'Bulchi',
    'sidebar.signOut': 'Baʼi',
    'sidebar.securityProfile': 'Nageenya & Piroofaayilii',

    // Common Actions
    'action.refresh': 'Haaromsi',
    'action.addNew': 'Haaraa Idaʼi',
    'action.edit': 'Gulaali',
    'action.delete': 'Haqi',
    'action.cancel': 'Dhiisi',
    'action.save': 'Jijjiirama Olkaaʼi',
    'action.saving': 'Olkaaʼaa jira...',
    'action.filter': 'Calali',
    'action.search': 'Barbaadi...',
    'action.all': 'Hunda',
    'action.status': 'Haala',
    'action.actions': 'Tarkaanfiiwwan',
    'action.close': 'Cufi',
    'action.confirm': 'Mirkaneessi',
    'action.export': 'Ragaa Baasi',

    // Status Badges
    'badge.pending': 'Eeggachaa Jira',
    'badge.approved': 'Mirkanaaʼeera',
    'badge.rejected': 'Kufaa Taʼeera',
    'badge.completed': 'Xumurameera',
    'badge.inProgress': 'Adeemsarra Jira',
    'badge.active': 'Hojii Irra',
    'badge.inactive': 'Dhaabbateera',
    'badge.verified': 'Mirkanaaʼaa',
  },

  ar: {
    // Brand & Header
    'brand.title': 'دليل',
    'brand.sub': 'بوابة الإدارة المركزية',
    'brand.lead': 'بوابة القيادة',

    // Navigation Sections
    'nav.section.core': 'النواة التنفيذية',
    'nav.section.heritage': 'التراث والسياحة',
    'nav.section.commerce': 'التجارة والدليل',
    'nav.section.governance': 'الحوكمة والحسابات',

    // Nav Items
    'nav.dashboard': 'نظرة عامة والعمليات',
    'nav.inquiries': 'مكتب الفرز المركزي',
    'nav.destinations': 'الوجهات والمعالم',
    'nav.events': 'الفعاليات والملتقيات',
    'nav.services': 'الخدمات المعتمدة',
    'nav.marketplace': 'سوق الحرف اليدوية',
    'nav.investments': 'استثمارات المغتربين',
    'nav.users': 'الأعضاء المسجلون',
    'nav.team': 'فريق الإدارة',
    'nav.profile': 'الأمان والملف الشخصي',

    // Tab Titles & Subtitles
    'tab.dashboard.title': 'نظرة عامة والأنشطة',
    'tab.dashboard.sub': 'ملخص الوجهات التراثية، شركاء الخدمات، وطلبات السوق المفتوح',
    'tab.inquiries.title': 'مكتب الفرز المركزي',
    'tab.inquiries.sub': 'مكتب فرز مخصص لمتابعة استفسارات العملاء والحجوزات والطلبات',
    'tab.destinations.title': 'التراث والسياحة',
    'tab.destinations.sub': 'إدارة المعالم الإقليمية ومواقع التراث العالمي لليونسكو والإحداثيات',
    'tab.services.title': 'دليل الشركاء المعتمدين',
    'tab.services.sub': 'إدارة مزودي الخدمات المهنية المعتمدين ومراجعة استفسارات العملاء',
    'tab.events.title': 'الفعاليات والملتقيات',
    'tab.events.sub': 'نشر المؤتمرات والملتقيات المجتمعية والمواقع وإدارة الحضور',
    'tab.marketplace.title': 'سوق الحرف اليدوية',
    'tab.marketplace.sub': 'تنظيم المنتجات الإثيوبية الأصيلة والملبوسات ومتابعة طلبات الشراء',
    'tab.investments.title': 'استثمارات المغتربين',
    'tab.investments.sub': 'إدارة الفرص الاستثمارية ذات النمو العالي وطلبات المستثمرين',
    'tab.users.title': 'دليل الأعضاء المسجلين',
    'tab.users.sub': 'قائمة حسابات المغتربين الإثيوبيين والمقيمين الأجانب المسجلين',
    'tab.team.title': 'فريق الإدارة',
    'tab.team.sub': 'إدارة صلاحيات المنسقين وتفويض مسؤوليات الأقسام',
    'tab.profile.title': 'الأمان والملف الشخصي',
    'tab.profile.sub': 'إدارة تفاصيل المسؤول وبيانات الاعتماد الأمنية وصلاحيات الوصول',

    // Roles
    'role.super_admin': 'المسؤول العام',
    'role.destination_manager': 'مسؤول السياحة والتراث',
    'role.service_manager': 'مسؤول دليل الخدمات',
    'role.event_manager': 'منسق الفعاليات',
    'role.marketplace_manager': 'مسؤول سوق المنتجات',
    'role.investment_officer': 'مسؤول الاستثمار',
    'role.admin': 'مسؤول',
    'role.coordinator': 'منسق',

    // Sidebar Widgets & Footer
    'status.operational': 'يعمل بكفاءة',
    'status.allOnline': 'جميع الخدمات متصلة',
    'status.encrypted': 'جلسة مشفرة نشطة',
    'status.platformStatus': 'حالة المنصة',
    'sidebar.manage': 'إدارة',
    'sidebar.signOut': 'تسجيل الخروج',
    'sidebar.securityProfile': 'الأمان والملف الشخصي',

    // Common Actions
    'action.refresh': 'تحديث',
    'action.addNew': 'إضافة جديد',
    'action.edit': 'تعديل',
    'action.delete': 'حذف',
    'action.cancel': 'إلغاء',
    'action.save': 'حفظ التغييرات',
    'action.saving': 'جارٍ الحفظ...',
    'action.filter': 'تصفية',
    'action.search': 'بحث...',
    'action.all': 'الكل',
    'action.status': 'الحالة',
    'action.actions': 'الإجراءات',
    'action.close': 'إغلاق',
    'action.confirm': 'تأكيد',
    'action.export': 'تصدير البيانات',

    // Status Badges
    'badge.pending': 'قيد الانتظار',
    'badge.approved': 'معتمد',
    'badge.rejected': 'مرفوض',
    'badge.completed': 'مكتمل',
    'badge.inProgress': 'قيد التنفيذ',
    'badge.active': 'نشط',
    'badge.inactive': 'غير نشط',
    'badge.verified': 'تم التحقق',
  },
};
