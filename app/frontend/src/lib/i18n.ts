import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // General
      app_name: 'MatchMe',
      tagline: 'Where Talent Meets Opportunity',
      subtitle: 'AI-powered recruitment platform that matches companies and job seekers using intelligent compatibility scoring and a swipe-based experience.',
      get_started: 'Get Started',
      learn_more: 'Learn More',
      save: 'Save',
      cancel: 'Cancel',
      next: 'Next',
      back: 'Back',
      submit: 'Submit',
      loading: 'Loading...',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      close: 'Close',
      confirm: 'Confirm',
      
      // Auth
      login: 'Login',
      register: 'Create Account',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirm_password: 'Confirm Password',
      remember_me: 'Remember Me',
      forgot_password: 'Forgot Password?',
      reset_password: 'Reset Password',
      send_reset_email: 'Send Reset Email',
      verify_email: 'Verify Your Email',
      verify_email_msg: 'We sent a verification link to your email. Please check your inbox.',
      i_am: 'I am a...',
      job_seeker: 'Job Seeker',
      company: 'Company',
      job_seeker_desc: 'Looking for my next career opportunity',
      company_desc: 'Looking to hire talented professionals',
      already_have_account: 'Already have an account?',
      dont_have_account: "Don't have an account?",
      
      // Job Seeker Profile
      create_profile: 'Create Your Profile',
      photo: 'Profile Photo',
      first_name: 'First Name',
      middle_name: 'Middle Name',
      last_name: 'Last Name',
      mobile: 'Mobile Number',
      nationality: 'Nationality',
      date_of_birth: 'Date of Birth',
      current_location: 'Current Location',
      languages: 'Languages',
      upload_cv: 'Upload CV',
      education: 'Education',
      work_experience: 'Work Experience',
      key_skills: 'Key Skills',
      availability: 'Availability',
      preferences: 'Preferences',
      preferred_employment: 'Preferred Employment Type',
      preferred_location: 'Preferred Location',
      preferred_industry: 'Preferred Industry',
      preferred_company_size: 'Preferred Company Size',
      expected_salary: 'Expected Salary (USD)',
      certificates: 'Certificates',
      accomplishments: 'Accomplishments',
      resume_score: 'Resume Score',
      professional_summary: 'Professional Summary',
      
      // Company Profile
      company_name: 'Company Name',
      company_logo: 'Company Logo',
      company_website: 'Company Website',
      company_phone: 'Company Phone',
      country: 'Country',
      city: 'City',
      industry: 'Industry',
      company_size: 'Company Size',
      company_type: 'Company Type',
      local: 'Local',
      international: 'International',
      company_description: 'Company Description',
      
      // Vacancy
      post_vacancy: 'Post Vacancy',
      job_title: 'Job Title',
      employment_type: 'Employment Type',
      job_description: 'Job Description',
      required_skills: 'Required Skills',
      min_experience: 'Minimum Experience (years)',
      max_experience: 'Maximum Experience (years)',
      education_level: 'Education Level',
      salary_range: 'Salary Range (USD)',
      benefits: 'Benefits',
      job_status: 'Job Status',
      open: 'Open',
      closed: 'Closed',
      draft: 'Draft',
      scheduled: 'Scheduled',
      vacancies: 'Vacancies',
      
      // Swipe
      swipe_jobs: 'Discover Jobs',
      interested: 'Interested',
      not_interested: 'Not Interested',
      match_score: 'Match Score',
      no_more_jobs: 'No more jobs to show. Check back later!',
      its_a_match: "It's a Match!",
      match_message: 'You and {{company}} are interested in each other. Start a conversation!',
      
      // Dashboard
      dashboard: 'Dashboard',
      candidates: 'Candidates',
      messages: 'Messages',
      analytics: 'Analytics',
      subscription: 'Subscription',
      settings: 'Settings',
      profile: 'Profile',
      matched_jobs: 'Matched Jobs',
      applications: 'Applications',
      saved_jobs: 'Saved Jobs',
      left_swipes: 'Left Swipes',
      history: 'History',
      
      // Candidate Status
      new_status: 'New',
      accepted: 'Accepted',
      rejected: 'Rejected',
      interview: 'Interview',
      offer: 'Offer',
      hired: 'Hired',
      accept: 'Accept',
      reject: 'Reject',
      message: 'Message',
      bookmark: 'Bookmark',
      
      // Messaging
      type_message: 'Type a message...',
      send: 'Send',
      no_messages: 'No messages yet. Start a conversation!',
      
      // Subscription
      free_plan: 'Free',
      premium_plan: 'Premium',
      monthly: 'Monthly',
      yearly: 'Yearly',
      current_plan: 'Current Plan',
      upgrade: 'Upgrade to Premium',
      free_features: 'Limited vacancies, Limited messages, Hidden contact info',
      premium_features: 'Unlimited vacancies, Unlimited messaging, Full contact details, Advanced analytics, Priority ranking',
      per_month: '/month',
      per_year: '/year',
      
      // Landing
      feature_matching: 'AI-Powered Matching',
      feature_matching_desc: 'Our algorithm analyzes skills, experience, and preferences to find your perfect match.',
      feature_swipe: 'Swipe to Connect',
      feature_swipe_desc: 'Discover opportunities with an intuitive swipe interface. Right for interested, left to pass.',
      feature_secure: 'Secure & Private',
      feature_secure_desc: 'Your data is protected with enterprise-grade security. Share only what you choose.',
      how_it_works: 'How It Works',
      step1_title: 'Create Your Profile',
      step1_desc: 'Sign up and build your professional profile in minutes.',
      step2_title: 'Get Matched',
      step2_desc: 'Our AI finds the best matches based on compatibility.',
      step3_title: 'Connect & Hire',
      step3_desc: 'Swipe, match, and start conversations with your ideal candidates or employers.',
      
      // Language
      language: 'Language',
      english: 'English',
      arabic: 'العربية',
      switch_language: 'Switch Language',
    }
  },
  ar: {
    translation: {
      // General
      app_name: 'MatchMe',
      tagline: 'حيث يلتقي الموهبة بالفرصة',
      subtitle: 'منصة توظيف مدعومة بالذكاء الاصطناعي تربط الشركات والباحثين عن عمل باستخدام خوارزمية التوافق الذكية وتجربة السحب.',
      get_started: 'ابدأ الآن',
      learn_more: 'اعرف المزيد',
      save: 'حفظ',
      cancel: 'إلغاء',
      next: 'التالي',
      back: 'رجوع',
      submit: 'إرسال',
      loading: 'جاري التحميل...',
      search: 'بحث',
      filter: 'تصفية',
      export: 'تصدير',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض',
      close: 'إغلاق',
      confirm: 'تأكيد',
      
      // Auth
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirm_password: 'تأكيد كلمة المرور',
      remember_me: 'تذكرني',
      forgot_password: 'نسيت كلمة المرور؟',
      reset_password: 'إعادة تعيين كلمة المرور',
      send_reset_email: 'إرسال رابط إعادة التعيين',
      verify_email: 'تحقق من بريدك الإلكتروني',
      verify_email_msg: 'أرسلنا رابط التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.',
      i_am: 'أنا...',
      job_seeker: 'باحث عن عمل',
      company: 'شركة',
      job_seeker_desc: 'أبحث عن فرصتي المهنية التالية',
      company_desc: 'أبحث عن توظيف محترفين موهوبين',
      already_have_account: 'لديك حساب بالفعل؟',
      dont_have_account: 'ليس لديك حساب؟',
      
      // Job Seeker Profile
      create_profile: 'أنشئ ملفك الشخصي',
      photo: 'صورة الملف الشخصي',
      first_name: 'الاسم الأول',
      middle_name: 'الاسم الأوسط',
      last_name: 'اسم العائلة',
      mobile: 'رقم الجوال',
      nationality: 'الجنسية',
      date_of_birth: 'تاريخ الميلاد',
      current_location: 'الموقع الحالي',
      languages: 'اللغات',
      upload_cv: 'رفع السيرة الذاتية',
      education: 'التعليم',
      work_experience: 'الخبرة العملية',
      key_skills: 'المهارات الرئيسية',
      availability: 'التوفر',
      preferences: 'التفضيلات',
      preferred_employment: 'نوع التوظيف المفضل',
      preferred_location: 'الموقع المفضل',
      preferred_industry: 'الصناعة المفضلة',
      preferred_company_size: 'حجم الشركة المفضل',
      expected_salary: 'الراتب المتوقع (دولار)',
      certificates: 'الشهادات',
      accomplishments: 'الإنجازات',
      resume_score: 'نتيجة السيرة الذاتية',
      professional_summary: 'الملخص المهني',
      
      // Company Profile
      company_name: 'اسم الشركة',
      company_logo: 'شعار الشركة',
      company_website: 'موقع الشركة',
      company_phone: 'هاتف الشركة',
      country: 'الدولة',
      city: 'المدينة',
      industry: 'الصناعة',
      company_size: 'حجم الشركة',
      company_type: 'نوع الشركة',
      local: 'محلية',
      international: 'دولية',
      company_description: 'وصف الشركة',
      
      // Vacancy
      post_vacancy: 'نشر وظيفة',
      job_title: 'المسمى الوظيفي',
      employment_type: 'نوع التوظيف',
      job_description: 'الوصف الوظيفي',
      required_skills: 'المهارات المطلوبة',
      min_experience: 'الحد الأدنى للخبرة (سنوات)',
      max_experience: 'الحد الأقصى للخبرة (سنوات)',
      education_level: 'المستوى التعليمي',
      salary_range: 'نطاق الراتب (دولار)',
      benefits: 'المزايا',
      job_status: 'حالة الوظيفة',
      open: 'مفتوحة',
      closed: 'مغلقة',
      draft: 'مسودة',
      scheduled: 'مجدولة',
      vacancies: 'الوظائف',
      
      // Swipe
      swipe_jobs: 'اكتشف الوظائف',
      interested: 'مهتم',
      not_interested: 'غير مهتم',
      match_score: 'نسبة التوافق',
      no_more_jobs: 'لا توجد وظائف أخرى. تحقق لاحقاً!',
      its_a_match: 'تطابق!',
      match_message: 'أنت و{{company}} مهتمان ببعضكما. ابدأ محادثة!',
      
      // Dashboard
      dashboard: 'لوحة التحكم',
      candidates: 'المرشحون',
      messages: 'الرسائل',
      analytics: 'التحليلات',
      subscription: 'الاشتراك',
      settings: 'الإعدادات',
      profile: 'الملف الشخصي',
      matched_jobs: 'الوظائف المتطابقة',
      applications: 'التقديمات',
      saved_jobs: 'الوظائف المحفوظة',
      left_swipes: 'المرفوضات',
      history: 'السجل',
      
      // Candidate Status
      new_status: 'جديد',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      interview: 'مقابلة',
      offer: 'عرض',
      hired: 'تم التوظيف',
      accept: 'قبول',
      reject: 'رفض',
      message: 'رسالة',
      bookmark: 'حفظ',
      
      // Messaging
      type_message: 'اكتب رسالة...',
      send: 'إرسال',
      no_messages: 'لا توجد رسائل بعد. ابدأ محادثة!',
      
      // Subscription
      free_plan: 'مجاني',
      premium_plan: 'مميز',
      monthly: 'شهري',
      yearly: 'سنوي',
      current_plan: 'الخطة الحالية',
      upgrade: 'ترقية إلى المميز',
      free_features: 'وظائف محدودة، رسائل محدودة، معلومات الاتصال مخفية',
      premium_features: 'وظائف غير محدودة، رسائل غير محدودة، تفاصيل الاتصال الكاملة، تحليلات متقدمة، أولوية في الترتيب',
      per_month: '/شهر',
      per_year: '/سنة',
      
      // Landing
      feature_matching: 'مطابقة بالذكاء الاصطناعي',
      feature_matching_desc: 'تحلل خوارزميتنا المهارات والخبرة والتفضيلات للعثور على تطابقك المثالي.',
      feature_swipe: 'اسحب للتواصل',
      feature_swipe_desc: 'اكتشف الفرص بواجهة سحب بديهية. يمين للاهتمام، يسار للتمرير.',
      feature_secure: 'آمن وخاص',
      feature_secure_desc: 'بياناتك محمية بأمان على مستوى المؤسسات. شارك فقط ما تختاره.',
      how_it_works: 'كيف يعمل',
      step1_title: 'أنشئ ملفك الشخصي',
      step1_desc: 'سجل وابنِ ملفك المهني في دقائق.',
      step2_title: 'احصل على تطابقات',
      step2_desc: 'ذكاؤنا الاصطناعي يجد أفضل التطابقات بناءً على التوافق.',
      step3_title: 'تواصل ووظّف',
      step3_desc: 'اسحب، تطابق، وابدأ المحادثات مع مرشحيك أو أصحاب العمل المثاليين.',
      
      // Language
      language: 'اللغة',
      english: 'English',
      arabic: 'العربية',
      switch_language: 'تغيير اللغة',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('matchme-lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('matchme-lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// Initialize direction on load
const savedLang = localStorage.getItem('matchme-lang') || 'en';
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;