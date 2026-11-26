import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Calendar,
  Award,
  Globe,
  Building,
  CheckCircle2,
  Users,
  Compass,
  FileText,
  Search,
  X,
  School,
  Share2
} from 'lucide-react';
import { SupportedLanguage } from '../utils/taskGenerator.ts';

interface UniversityHomePageProps {
  lang: SupportedLanguage;
  onNavigateToGenerator: () => void;
  onNavigateToProfessor: () => void;
  isLoggedIn: boolean;
  professorName?: string;
  theme?: 'light' | 'dark';
}

const HOME_TEXT = {
  uk: {
    crestSub: "SAPIENTIA AEDIFICAVIT SIBI DOMVM • Заснований у 1241 році",
    badgeCampus: "Міжнародний кампус досконалості (CEI Triangular-E3)",
    navUVa: "УНІВЕРСИТЕТ ВАЛЬЯДОЛІД",
    navResearch: "ДОСЛІДЖЕННЯ",
    navInternational: "МІЖНАРОДНИЙ",
    navInnovation: "ІННОВАЦІЇ",
    navExperience: "ВІДЧУЙТЕ УФА (SIENTE LA UVa)",
    heroTitle: "Ректор відзначає роботу науковців та викладачів Університету Вальядоліда, включених до Стенфордського рейтингу найцитованіших вчених світу",
    heroSub: "Stanford University Top 2% Scientists • Видатні досягнення в галузі архітектури, штучного інтелекту, біомедицини та гуманітарних наук",
    btnReadNews: "Читати новину",
    newsSlide1: "Дослідники UVa у рейтингу Стенфорда",
    newsSlide2: "Відкриття нового семестру 2026/2027",
    newsSlide3: "Програми міжнародних стажувань Erasmus+",
    newsSlide4: "Цифрова лабораторія штучного інтелекту та гуманітаристики",
    newsSlide5: "Палац Санта-Крус: Реставрація спадщини",
    quickTitle: "Швидкий доступ до академічних сервісів UVa",
    cardGenTitle: "Генератор завдань (Wikidata)",
    cardGenDesc: "Створюйте польові, аналітичні завдання та експрес-тести з прив'язкою до архітектурних об'єктів та Linked Open Data.",
    btnLaunchGen: "Відкрити генератор",
    cardProfTitle: "Особистий кабінет викладача",
    cardProfDesc: "Керуйте цьогорічними курсами (2026/2027), архівами минулих років та репозиторієм матеріалів у папках.",
    btnEnterCabinet: "Увійти в кабінет",
    btnCabinetOpen: "Перейти до кабінету",
    cardRepoTitle: "Репозиторії дисциплін та LOD",
    cardRepoDesc: "Структуровані навчальні курси факультету філософії та красного письменства для студентів та аспірантів.",
    statsHeader: "Щодо пропозиції стажування та академічної мобільності",
    stat1Number: "4059",
    stat1Label: "студентські стажування",
    stat1Sub: "Навчальні та виробничі практики на провідних підприємствах і в установах спадщини",
    stat2Number: "472",
    stat2Label: "стажування випускників",
    stat2Sub: "Програми першого робочого місця та професійного старту для молодих спеціалістів",
    stat3Number: "+400",
    stat3Label: "стажування за кордоном",
    stat3Sub: "Міжнародна академічна мобільність у партнерських університетах Європи та світу",
    statYearFounded: "1241",
    statYearLabel: "Рік заснування (один із найстаріших у Європі)",
    statInstitutes: "25+",
    statInstitutesLabel: "Науково-дослідних інститутів",
    partnersTitle: "Інституційні партнери та сертифікації досконалості",
    col1Title: "Розголошення",
    col1Link1: "Відділ комунікацій та преси",
    col1Link2: "Науковий портал UVaDivulga",
    col1Link3: "Наукові журнали та видавництво Ediciones UVa",
    col1Link4: "Академічні прес-релізи",
    col2Title: "Інформація",
    col2Link1: "Довідкова служба: +34 983 42 30 00",
    col2Link2: "Авторизація цифрового простору",
    col2Link3: "Веб-доступність та стандарти W3C",
    col2Link4: "Інтерактивна карта кампусів (4 міста)",
    col3Title: "Відкрийте UVa",
    col3Link1: "Ласкаво просимо до Вальядоліда",
    col3Link2: "Вивчайте іспанську мову у Вальядоліді",
    col3Link3: "Історичний Палац Санта-Крус",
    col3Link4: "Музей університету та колекції",
    col4Title: "Адміністрація",
    col4Link1: "Електронна штаб-квартира (Sede Electrónica)",
    col4Link2: "Портал прозорості та відкритого уряду",
    col4Link3: "Профіль державного контрактора",
    col4Link4: "Внутрішній інформаційний канал",
    col5Title: "Доступ",
    col5Link1: "Університетська бібліотека (BUVa)",
    col5Link2: "Зона ПАС (адміністративний персонал)",
    col5Link3: "Зона викладацького та наукового персоналу",
    col5Link4: "Віртуальний кампус та точки доступу",
    footerCopy: "Universidad de Valladolid • Plaza de Santa Cruz, 8, 47002 Valladolid, España • Всі права захищено 2026"
  },
  en: {
    crestSub: "SAPIENTIA AEDIFICAVIT SIBI DOMVM • Founded in 1241",
    badgeCampus: "International Campus of Excellence (CEI Triangular-E3)",
    navUVa: "UNIVERSIDAD DE VALLADOLID",
    navResearch: "RESEARCH",
    navInternational: "INTERNATIONAL",
    navInnovation: "INNOVATION",
    navExperience: "EXPERIENCE UVA (SIENTE LA UVa)",
    heroTitle: "The Rector commends the work of University of Valladolid researchers and professors ranked in Stanford's World Top 2% Scientist List",
    heroSub: "Stanford University Top 2% Scientists • Outstanding breakthroughs in Architecture, AI, Biomedicine and the Humanities",
    btnReadNews: "Read news",
    newsSlide1: "UVa Researchers in Stanford World Ranking",
    newsSlide2: "Opening of 2026/2027 Academic Semester",
    newsSlide3: "Erasmus+ International Internship Programs",
    newsSlide4: "AI & Digital Humanities Innovation Lab",
    newsSlide5: "Palacio de Santa Cruz: Heritage Restoration",
    quickTitle: "Quick Access to UVa Academic Services",
    cardGenTitle: "Task Generator (Wikidata)",
    cardGenDesc: "Create fieldwork, analytical cases and express quizzes linked to real heritage points of interest and Linked Open Data.",
    btnLaunchGen: "Launch Generator",
    cardProfTitle: "Faculty & Professor Portal",
    cardProfDesc: "Manage current year courses (2026/2027), multi-year archives and teaching material repositories in organized folders.",
    btnEnterCabinet: "Sign In as Professor",
    btnCabinetOpen: "Open Professor Portal",
    cardRepoTitle: "Course Repositories & LOD",
    cardRepoDesc: "Curricular syllabi and learning resources from the Faculty of Philosophy & Letters for students and researchers.",
    statsHeader: "Internship & Academic Mobility Opportunities",
    stat1Number: "4059",
    stat1Label: "student internships",
    stat1Sub: "Curricular and extracurricular internships across leading industry and cultural heritage partners",
    stat2Number: "472",
    stat2Label: "graduate internships",
    stat2Sub: "First-job career placements and professional onboarding programs for recent graduates",
    stat3Number: "+400",
    stat3Label: "internships abroad",
    stat3Sub: "International academic mobility in partner universities across Europe and overseas",
    statYearFounded: "1241",
    statYearLabel: "Year of foundation (one of the oldest universities in Europe)",
    statInstitutes: "25+",
    statInstitutesLabel: "University Research Institutes",
    partnersTitle: "Institutional Partners & Accreditations of Excellence",
    col1Title: "Dissemination",
    col1Link1: "Communications & Press Office",
    col1Link2: "Scientific Outreach Portal UVaDivulga",
    col1Link3: "Academic Journals & Ediciones UVa",
    col1Link4: "Press Releases & Media Room",
    col2Title: "Information",
    col2Link1: "General Inquiry Desk: +34 983 42 30 00",
    col2Link2: "Digital Workspace Authorization",
    col2Link3: "Web Accessibility & W3C Standards",
    col2Link4: "Interactive Campuses Map (4 Cities)",
    col3Title: "Discover UVa",
    col3Link1: "Welcome to Valladolid",
    col3Link2: "Learn Spanish at Universidad de Valladolid",
    col3Link3: "Historic Palacio de Santa Cruz",
    col3Link4: "University Museum & Heritage Collections",
    col4Title: "Administration",
    col4Link1: "Electronic Headquarters (Sede Electrónica)",
    col4Link2: "Transparency & Open Government Portal",
    col4Link3: "Public Contractor Profile",
    col4Link4: "Internal Whistleblowing Channel",
    col5Title: "Access Points",
    col5Link1: "University Library System (BUVa)",
    col5Link2: "Administrative Staff Portal (Zona PAS)",
    col5Link3: "Faculty & Teaching Staff Portal",
    col5Link4: "Virtual Campus & Student Single Sign-On",
    footerCopy: "Universidad de Valladolid • Plaza de Santa Cruz, 8, 47002 Valladolid, Spain • All rights reserved 2026"
  },
  es: {
    crestSub: "SAPIENTIA AEDIFICAVIT SIBI DOMVM • Fundada en 1241",
    badgeCampus: "Campus de Excelencia Internacional (CEI Triangular-E3)",
    navUVa: "UNIVERSIDAD DE VALLADOLID",
    navResearch: "INVESTIGACIÓN",
    navInternational: "INTERNACIONAL",
    navInnovation: "INNOVACIÓN",
    navExperience: "SIENTE LA UVA",
    heroTitle: "El Rector reconoce la labor de los investigadores y docentes de la Universidad de Valladolid incluidos en el prestigioso ranking de Stanford",
    heroSub: "Stanford University Top 2% Scientists • Destacados logros en Arquitectura, Inteligencia Artificial, Biomedicina y Humanidades",
    btnReadNews: "Leer noticia",
    newsSlide1: "Investigadores UVa en el Ranking Stanford",
    newsSlide2: "Apertura del Curso Académico 2026/2027",
    newsSlide3: "Programas de Prácticas Internacionales Erasmus+",
    newsSlide4: "Laboratorio Digital de IA y Humanidades",
    newsSlide5: "Palacio de Santa Cruz: Restauración del Patrimonio",
    quickTitle: "Accesos directos a los servicios académicos UVa",
    cardGenTitle: "Generador de Tareas (Wikidata)",
    cardGenDesc: "Diseñe tareas de campo, casos analíticos y cuestionarios tipo test vinculados a puntos patrimoniales y Datos Abiertos Enlazados.",
    btnLaunchGen: "Abrir Generador",
    cardProfTitle: "Portal del Docente e Investigador",
    cardProfDesc: "Consulte las asignaturas de este curso (2026/2027), los cursos anteriores por año y los materiales en carpetas ordenadas.",
    btnEnterCabinet: "Acceder como Docente",
    btnCabinetOpen: "Ir al Portal Docente",
    cardRepoTitle: "Repositorio de Asignaturas y LOD",
    cardRepoDesc: "Guías docentes y materiales académicos de la Facultad de Filosofía y Letras para estudiantes e investigadores.",
    statsHeader: "Oferta de Prácticas y Empleabilidad",
    stat1Number: "4059",
    stat1Label: "prácticas de estudiantes",
    stat1Sub: "Prácticas curriculares y extracurriculares en empresas líderes e instituciones culturales",
    stat2Number: "472",
    stat2Label: "prácticas de titulados",
    stat2Sub: "Inserción laboral y programas de primer empleo para titulados universitarios",
    stat3Number: "+400",
    stat3Label: "prácticas en el extranjero",
    stat3Sub: "Movilidad internacional y estancias formativas en universidades socias europeas",
    statYearFounded: "1241",
    statYearLabel: "Año de fundación (una de las más antiguas de Europa)",
    statInstitutes: "25+",
    statInstitutesLabel: "Institutos Universitarios de Investigación",
    partnersTitle: "Alianzas institucionales y acreditaciones de excelencia",
    col1Title: "Difusión",
    col1Link1: "Gabinete de Comunicación y Prensa",
    col1Link2: "Portal de Divulgación Científica UVaDivulga",
    col1Link3: "Revistas Científicas y Ediciones Universidad de Valladolid",
    col1Link4: "Notas de prensa y comunicados",
    col2Title: "Información",
    col2Link1: "Atención al Ciudadano: +34 983 42 30 00",
    col2Link2: "Autorización de Espacio Digital",
    col2Link3: "Accesibilidad Web y Estándares W3C",
    col2Link4: "Plano Interactivo de Campus (4 Sedes)",
    col3Title: "Descubre la UVa",
    col3Link1: "Bienvenida Institucional a Valladolid",
    col3Link2: "Cursos de Español para Extranjeros",
    col3Link3: "Histórico Palacio de Santa Cruz",
    col3Link4: "Museo de la Universidad y Patrimonio Cultural",
    col4Title: "Administración",
    col4Link1: "Sede Electrónica UVa",
    col4Link2: "Portal de Transparencia y Gobierno Abierto",
    col4Link3: "Perfil de Contratante del Sector Público",
    col4Link4: "Canal Interno de Información",
    col5Title: "Puntos de Acceso",
    col5Link1: "Biblioteca Universitaria de Valladolid (BUVa)",
    col5Link2: "Zona de Personal de Administración y Servicios (PAS)",
    col5Link3: "Zona de Personal Docente e Investigador (PDI)",
    col5Link4: "Campus Virtual Moodle y Portal del Estudiante",
    footerCopy: "Universidad de Valladolid • Plaza de Santa Cruz, 8, 47002 Valladolid, España • Todos los derechos reservados 2026"
  }
};

export const UniversityHomePage: React.FC<UniversityHomePageProps> = ({
  lang,
  onNavigateToGenerator,
  onNavigateToProfessor,
  isLoggedIn,
  professorName,
  theme = 'light'
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const t = HOME_TEXT[lang] || HOME_TEXT.uk;

  const slides = [
    {
      title: t.heroTitle,
      sub: t.heroSub,
      tag: "Stanford Top 2%",
      year: "2026"
    },
    {
      title: lang === 'es' ? "Apertura del nuevo año académico en el Paraninfo Histórico" : lang === 'en' ? "Opening of the New Academic Year in the Historic Paraninfo Hall" : "Урочисте відкриття нового навчального року в Історичному Паранінфо",
      sub: lang === 'es' ? "Más de 25.000 estudiantes inician sus actividades formativas e investigadoras en los 4 campus" : lang === 'en' ? "Over 25,000 students begin their academic courses across our 4 university campuses" : "Понад 25 000 студентів розпочинають навчання та наукову роботу на 4 кампусах UVa",
      tag: "Academic Year",
      year: "2026/2027"
    },
    {
      title: lang === 'es' ? "Nuevas convocatorias de movilidad internacional y prácticas Erasmus+" : lang === 'en' ? "New International Mobility & Erasmus+ Traineeship Opportunities" : "Нові конкурси міжнародної мобільності та практик Erasmus+",
      sub: lang === 'es' ? "Convenios con más de 400 instituciones europeas para prácticas de grado y posgrado" : lang === 'en' ? "Agreements with over 400 European institutions for undergraduate and postgraduate training" : "Угоди з понад 400 європейськими установами для бакалаврів та магістрів",
      tag: "Erasmus+ Mobility",
      year: "+400 Spots"
    },
    {
      title: lang === 'es' ? "Impulso a la innovación docente mediante IA y Linked Open Data" : lang === 'en' ? "Advancing Educational Innovation through AI and Linked Open Data" : "Розвиток інноваційної освіти завдяки ШІ та Linked Open Data",
      sub: lang === 'es' ? "La Facultad de Filosofía y Letras integra modelos inteligentes para generación de tareas" : lang === 'en' ? "Faculty of Philosophy & Letters implements AI-powered methodological task generation" : "Факультет філософії інтегрує інтелектуальні методи генерації навчальних завдань",
      tag: "AI & Education",
      year: "UVa Lab"
    },
    {
      title: lang === 'es' ? "Restauración y estudio patrimonial del Palacio de Santa Cruz" : lang === 'en' ? "Heritage Conservation and Structural Study of Santa Cruz Palace" : "Реставрація та архітектурне дослідження Палацу Санта-Крус",
      sub: lang === 'es' ? "Investigadores del Departamento de Historia culminan la documentación 3D del rectorado" : lang === 'en' ? "Department of History researchers finalize 3D photogrammetric survey of historic rectorate" : "Науковці кафедри історії завершують лазерне 3D сканування пам'ятки платереско",
      tag: "Cultural Heritage",
      year: "Plateresque"
    }
  ];

  const currentSlideData = slides[activeSlide] || slides[0];

  return (
    <div className={`w-full flex-1 overflow-y-auto flex flex-col ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. INSTITUTIONAL UVa SUB-HEADER BAR (Matching Photo 1)                   */}
      {/* ========================================================================= */}
      <section className={`${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } border-b px-4 sm:px-8 py-3.5 shadow-2xs`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* UVa Brand Identity & Historic Coat of Arms */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#581221] text-[#D4AF37] flex items-center justify-center p-2 shadow border border-[#D4AF37]/30 shrink-0">
              <GraduationCap className="w-7 h-7 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#581221]">
                  Universidad
                </span>
                <span className="text-xl sm:text-2xl font-light text-slate-600">
                  de <b className="font-bold text-[#7A1C30]">Valladolid</b>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-serif italic tracking-wide">
                {t.crestSub}
              </p>
            </div>
          </div>

          {/* Academic Portal Sub-Navigation (Matching photo 1) */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-bold text-[#581221] tracking-wider uppercase">
            <span className="hover:text-[#9E2A43] cursor-pointer transition border-b-2 border-[#7A1C30] pb-0.5">
              {t.navUVa}
            </span>
            <span className="text-slate-700 hover:text-[#7A1C30] cursor-pointer transition">
              {t.navResearch}
            </span>
            <span className="text-slate-700 hover:text-[#7A1C30] cursor-pointer transition">
              {t.navInternational}
            </span>
            <span className="text-slate-700 hover:text-[#7A1C30] cursor-pointer transition">
              {t.navInnovation}
            </span>
            <span className="text-[#D4AF37] hover:text-[#B89528] cursor-pointer transition font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              {t.navExperience}
            </span>
          </nav>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH IMAGE BANNER (Exact Matching to Photo 1)             */}
      {/* ========================================================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-300 bg-slate-900 group">
          
          {/* Real University Hero Image from user assets */}
          <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] overflow-hidden">
            <img
              src="/assets/aistudio/______________2026-11-10___20.05.42_b45d3680.png"
              alt="Universidad de Valladolid Faculty & Researchers in Stanford Ranking"
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition duration-700 ease-out"
            />
            
            {/* Top gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 pointer-events-none" />
            
            {/* Top badge */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
              <span className="bg-[#7A1C30]/90 text-white text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/50 backdrop-blur-xs shadow">
                {currentSlideData.tag}
              </span>
              <span className="bg-black/60 text-amber-200 text-xs px-2.5 py-1 rounded-full font-mono backdrop-blur-xs border border-white/20">
                {currentSlideData.year}
              </span>
            </div>
          </div>

          {/* Bottom Caption Overlay Banner (Exact visual structure from Photo 1) */}
          <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md px-5 py-4 sm:px-8 sm:py-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                {currentSlideData.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                {currentSlideData.sub}
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-3">
              <button
                onClick={() => setIsNewsModalOpen(true)}
                className="bg-[#581221] hover:bg-[#7A1C30] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer border border-[#D4AF37]/40"
              >
                <span>{t.btnReadNews}</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </div>

        {/* 5-Dash Carousel / Slide Indicators (Matching Photo 1) */}
        <div className="flex items-center justify-center space-x-2 pt-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === idx
                  ? "w-10 bg-[#7A1C30]"
                  : "w-5 bg-slate-300 hover:bg-slate-400"
              }`}
              title={`Slide ${idx + 1}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THREE PRIMARY WORKSPACE LAUNCHPADS                                     */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full">
        <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#581221] tracking-tight">
              {t.quickTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Facultad de Filosofía y Letras • Campus de Valladolid
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#7A1C30] bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
            Educational Task Suite 2026/2027
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Task Generator */}
          <div className={`${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          } rounded-xl p-5 border hover:border-[#7A1C30]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group`}>
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center mb-3 border border-amber-200 group-hover:bg-[#7A1C30] group-hover:text-[#D4AF37] transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition ${
                theme === 'dark' ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-[#7A1C30]'
              }`}>
                {t.cardGenTitle}
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t.cardGenDesc}
              </p>
            </div>
            <button
              onClick={isLoggedIn ? onNavigateToGenerator : onNavigateToProfessor}
              className="mt-4 w-full bg-[#7A1C30] hover:bg-[#9E2A43] text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span>{isLoggedIn ? t.btnLaunchGen : t.btnEnterCabinet}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>

          {/* Card 2: Professor Portal */}
          <div className={`${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          } rounded-xl p-5 border hover:border-[#7A1C30]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group`}>
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-[#7A1C30] flex items-center justify-center mb-3 border border-rose-200 group-hover:bg-[#581221] group-hover:text-[#D4AF37] transition">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition ${
                theme === 'dark' ? 'text-white group-hover:text-rose-300' : 'text-slate-900 group-hover:text-[#7A1C30]'
              }`}>
                {t.cardProfTitle}
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t.cardProfDesc}
              </p>
              {isLoggedIn && professorName && (
                <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                  ✓ {professorName}
                </div>
              )}
            </div>
            <button
              onClick={onNavigateToProfessor}
              className="mt-4 w-full bg-[#581221] hover:bg-[#7A1C30] text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs border border-[#D4AF37]/30"
            >
              <span>{isLoggedIn ? t.btnCabinetOpen : t.btnEnterCabinet}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>

          {/* Card 3: Repositories & Heritage LOD */}
          <div className={`${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          } rounded-xl p-5 border hover:border-[#7A1C30]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group`}>
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center mb-3 border border-blue-200 group-hover:bg-[#7A1C30] group-hover:text-[#D4AF37] transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition ${
                theme === 'dark' ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-[#7A1C30]'
              }`}>
                {t.cardRepoTitle}
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t.cardRepoDesc}
              </p>
            </div>
            <button
              onClick={isLoggedIn ? onNavigateToGenerator : onNavigateToProfessor}
              className={`mt-4 w-full text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <span>{isLoggedIn ? t.btnLaunchGen : t.btnEnterCabinet}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STATISTICS & INTERNSHIP SECTION (Exact Matching to Photo 2)            */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="bg-[#0f3460] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-900">
          
          {/* Subtle background crest accent */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
            <School className="w-96 h-96 text-white" />
          </div>

          {/* Heading from Photo 2 */}
          <div className="border-b border-blue-400/30 pb-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Universidad de Valladolid • Empleabilidad y Desarrollo
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {t.statsHeader}
            </h3>
          </div>

          {/* The 3 main prominent numbers from Photo 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            
            {/* Stat 1: 4059 */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-6 border border-white/15 text-center">
              <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight">
                {t.stat1Number}
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-2 capitalize">
                {t.stat1Label}
              </div>
              <p className="text-xs text-blue-100/80 mt-1">
                {t.stat1Sub}
              </p>
            </div>

            {/* Stat 2: 472 */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-6 border border-white/15 text-center">
              <div className="text-4xl sm:text-5xl font-black text-emerald-300 font-mono tracking-tight">
                {t.stat2Number}
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-2 capitalize">
                {t.stat2Label}
              </div>
              <p className="text-xs text-blue-100/80 mt-1">
                {t.stat2Sub}
              </p>
            </div>

            {/* Stat 3: +400 */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-6 border border-white/15 text-center">
              <div className="text-4xl sm:text-5xl font-black text-cyan-300 font-mono tracking-tight">
                {t.stat3Number}
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-2 capitalize">
                {t.stat3Label}
              </div>
              <p className="text-xs text-blue-100/80 mt-1">
                {t.stat3Sub}
              </p>
            </div>
          </div>

          {/* Additional Institutional Figures */}
          <div className="mt-6 pt-5 border-t border-blue-400/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white font-mono">{t.statYearFounded}</div>
              <div className="text-[11px] text-blue-200">{t.statYearLabel}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono">{t.statInstitutes}</div>
              <div className="text-[11px] text-blue-200">{t.statInstitutesLabel}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono">25,000+</div>
              <div className="text-[11px] text-blue-200">
                {lang === 'es' ? "Estudiantes en 4 campus" : lang === 'en' ? "Students across 4 campuses" : "Студентів у 4 кампусах"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono">100+</div>
              <div className="text-[11px] text-blue-200">
                {lang === 'es' ? "Titulaciones oficiales de grado" : lang === 'en' ? "Official degree programs" : "Офіційних освітніх програм"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INSTITUTIONAL ACCREDITATIONS & PARTNER BADGES (Matching Photo 2)       */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="text-center mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t.partnersTitle}
          </span>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 items-center justify-items-center p-6 rounded-xl border shadow-2xs ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          {/* Badge 1: Valladolid Ciudad Universitaria */}
          <div className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer">
            <span className="text-xs font-black tracking-tight text-purple-900 group-hover:text-purple-700 transition">
              VALLADOLID
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Ciudad Universitaria
            </span>
          </div>

          {/* Badge 2: CEI Triangular-E3 */}
          <div className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer border-l sm:border-l border-slate-200">
            <span className="text-xs font-black tracking-tight text-[#7A1C30] group-hover:text-[#9E2A43] transition">
              CEI TRIANGULAR-E³
            </span>
            <span className="text-[9px] text-slate-500">
              Campus de Excelencia Internacional
            </span>
          </div>

          {/* Badge 3: HR Excellence in Research */}
          <div className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer border-l sm:border-l border-slate-200">
            <span className="text-xs font-black tracking-tight text-blue-900 group-hover:text-blue-700 transition">
              HR EXCELLENCE
            </span>
            <span className="text-[9px] text-slate-500">
              European Commission
            </span>
          </div>

          {/* Badge 4: Santander Universidades */}
          <div className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer border-l sm:border-l border-slate-200">
            <span className="text-sm font-black tracking-tight text-red-600 group-hover:text-red-700 transition">
              Santander
            </span>
            <span className="text-[9px] text-slate-500">
              Universidades
            </span>
          </div>

          {/* Badge 5: B travel / Erasmus */}
          <div className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer border-l sm:border-l border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-xs font-black tracking-tight text-indigo-800 group-hover:text-indigo-600 transition">
              B travel
            </span>
            <span className="text-[9px] text-slate-500">
              Movilidad Erasmus+
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FULL UNIVERSITY FOOTER (Exact 5 Columns from Photo 2)                   */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#0d274d] text-white mt-auto pt-10 pb-6 border-t border-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* 5 Distinct Columns Matching Photo 2 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 pb-8 border-b border-blue-900/60">
            
            {/* Column 1: Розголошення / Difusión */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3 border-b border-blue-800 pb-1.5">
                {t.col1Title}
              </h4>
              <ul className="space-y-2 text-xs text-blue-100/80">
                <li className="hover:text-white cursor-pointer transition">{t.col1Link1}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col1Link2}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col1Link3}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col1Link4}</li>
              </ul>
            </div>

            {/* Column 2: Інформація / Información */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3 border-b border-blue-800 pb-1.5">
                {t.col2Title}
              </h4>
              <ul className="space-y-2 text-xs text-blue-100/80">
                <li className="hover:text-white cursor-pointer transition font-mono text-[11px]">{t.col2Link1}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col2Link2}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col2Link3}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col2Link4}</li>
              </ul>
            </div>

            {/* Column 3: Відкрийте / Descubre */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3 border-b border-blue-800 pb-1.5">
                {t.col3Title}
              </h4>
              <ul className="space-y-2 text-xs text-blue-100/80">
                <li className="hover:text-white cursor-pointer transition">{t.col3Link1}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col3Link2}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col3Link3}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col3Link4}</li>
              </ul>
            </div>

            {/* Column 4: Адміністрація / Administración */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3 border-b border-blue-800 pb-1.5">
                {t.col4Title}
              </h4>
              <ul className="space-y-2 text-xs text-blue-100/80">
                <li className="hover:text-white cursor-pointer transition">{t.col4Link1}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col4Link2}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col4Link3}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col4Link4}</li>
              </ul>
            </div>

            {/* Column 5: Доступ / Acceso */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3 border-b border-blue-800 pb-1.5">
                {t.col5Title}
              </h4>
              <ul className="space-y-2 text-xs text-blue-100/80">
                <li className="hover:text-white cursor-pointer transition">{t.col5Link1}</li>
                <li className="hover:text-white cursor-pointer transition">{t.col5Link2}</li>
                <li
                  onClick={onNavigateToProfessor}
                  className="text-amber-300 hover:text-amber-200 font-semibold cursor-pointer transition flex items-center gap-1"
                >
                  <span>{t.col5Link3}</span>
                  <ArrowRight className="w-3 h-3 text-amber-300" />
                </li>
                <li className="hover:text-white cursor-pointer transition">{t.col5Link4}</li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright line */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-200/70 gap-3">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.footerCopy}</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <span className="hover:text-white cursor-pointer transition">Aviso Legal</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition">Privacidad</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer transition">Cookies</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. STANFORD RANKING NEWS MODAL                                            */}
      {/* ========================================================================= */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-300">
            <div className="bg-[#581221] text-white px-6 py-4 flex items-center justify-between border-b border-[#7A1C30]">
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm sm:text-base font-bold">
                  {lang === 'es'
                    ? "Universidad de Valladolid en el Ranking Stanford"
                    : lang === 'en'
                    ? "University of Valladolid in Stanford World Ranking"
                    : "Університет Вальядоліда у Стенфордському рейтингу"}
                </h3>
              </div>
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="text-rose-200 hover:text-white p-1 rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="w-full h-48 rounded-xl overflow-hidden relative mb-3">
                <img
                  src="/assets/aistudio/______________2026-11-10___20.05.42_b45d3680.png"
                  alt="Faculty of UVa"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <h4 className="text-base sm:text-lg font-bold text-[#581221]">
                {currentSlideData.title}
              </h4>

              <p>
                {lang === 'es'
                  ? "El rector de la Universidad de Valladolid, Antonio Largo Cabrerizo, ha presidido el acto institucional de reconocimiento a los investigadores y profesores de la UVa incluidos en la prestigiosa lista 'World's Top 2% Scientists' elaborada anualmente por la Universidad de Stanford junto al grupo editorial Elsevier."
                  : lang === 'en'
                  ? "The Rector of the Universidad de Valladolid, Antonio Largo Cabrerizo, chaired the institutional ceremony honoring UVa professors and researchers named in the prestigious 'World's Top 2% Scientists' list compiled annually by Stanford University and Elsevier."
                  : "Ректор Університету Вальядоліда Антоніо Ларго Кабрерісо провів урочисту церемонію вшанування науковців та професорів UVa, які увійшли до престижного глобального рейтингу 'World's Top 2% Scientists', що публікується Стенфордським університетом спільно з видавництвом Elsevier."}
              </p>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                <b>{lang === 'es' ? "Disciplinas destacadas:" : lang === 'en' ? "Key academic areas:" : "Провідні наукові напрями:"}</b>{" "}
                {lang === 'es'
                  ? "Historia del Arte y Arquitectura Renacentista, Inteligencia Artificial, Tratamiento del Lenguaje Natural, Biomedicina y Restauración Patrimonial."
                  : lang === 'en'
                  ? "History of Art & Renaissance Architecture, Artificial Intelligence, Natural Language Processing, Biomedicine and Monument Conservation."
                  : "Історія архітектури та Ренесансу, Штучний інтелект, Семантичний аналіз тексту, Біомедицина та Реставрація культурної спадщини."}
              </div>

              <p>
                {lang === 'es'
                  ? "Este reconocimiento avala la calidad científica y la excelencia docente que nuestros profesores trasladan diariamente a las aulas y a los proyectos de innovación pedagógica, como la plataforma de generación metodológica de tareas con Linked Open Data."
                  : lang === 'en'
                  ? "This milestone underscores the academic excellence our faculty brings to students every day, directly inspiring cutting-edge educational projects such as our Linked Open Data task generator suite."
                  : "Це визнання підтверджує високу якість наукових розробок, яку професори UVa передають студентам у навчальних курсах та впроваджують у проєкти автоматизованої генерації завдань на основі зв'язаних даних."}
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="bg-[#581221] hover:bg-[#7A1C30] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition"
              >
                {lang === 'es' ? "Entendido" : lang === 'en' ? "Close" : "Зрозуміло"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
