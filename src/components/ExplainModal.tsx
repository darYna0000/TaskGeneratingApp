import React from 'react';
import { X, Sparkles, Database, BookOpen, Layers } from 'lucide-react';
import { SupportedLanguage } from '../utils/taskGenerator.ts';

interface ExplainModalProps {
  variantNum: number | null;
  poiName: string;
  isOpen: boolean;
  onClose: () => void;
  lang?: SupportedLanguage;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  variantNum,
  poiName,
  isOpen,
  onClose,
  lang = 'uk'
}) => {
  if (!isOpen || variantNum === null) return null;

  const safePoi = poiName.trim() || (lang === 'uk' ? "об'єкта" : lang === 'es' ? "monumento" : "monument");

  const getExplanation = () => {
    if (lang === 'en') {
      switch (variantNum) {
        case 1:
          return {
            title: "Field Task Methodology",
            summary: `On-site architectural inspection and visual field recording of ${safePoi}.`,
            points: [
              "Linked Open Data Integration: Construction period and stylistic classification from Wikidata establish authoritative analytical benchmarks.",
              "Direct Visual Verification: Students correlate Wikidata ontological facts (decorative motifs, spatial layout, material) with the physical monument.",
              "Pedagogical Impact: Fosters architectural field observation, photographic documentation, and critical spatial analysis."
            ],
            btnClose: "Got it",
            closeAria: "Close"
          };
        case 2:
          return {
            title: "Analytical Case Methodology",
            summary: `Historical, urban, and cultural impact synthesis of ${safePoi}.`,
            points: [
              "Semantic Event Graphing: Employs Wikidata knowledge graph relations to trace chronology and historical stakeholders connected to the site.",
              "Comparative Synthesis: Guides students to benchmark architectural movements against contemporaneous European landmarks.",
              "Pedagogical Impact: Cultivates primary source interrogation, historiographical rigor, and academic essay composition."
            ],
            btnClose: "Got it",
            closeAria: "Close"
          };
        case 3:
        default:
          return {
            title: "Assessment Quiz Methodology",
            summary: `Structured evaluation of core conceptual mastery regarding ${safePoi}.`,
            points: [
              "Fact-based Validation: Questions derive directly from authoritative Wikidata items (period, architectural style, historical figures).",
              "Differentiated Assessment: Combines closed-ended verification (dates, styles) with analytical prompts testing spatial reasoning.",
              "Pedagogical Impact: Enables formative knowledge checks in seminar sessions and field practicums."
            ],
            btnClose: "Got it",
            closeAria: "Close"
          };
      }
    }

    if (lang === 'es') {
      switch (variantNum) {
        case 1:
          return {
            title: "Metodología de Tarea de Campo (Field Task)",
            summary: `Inspección in situ y registro formal de los parámetros arquitectónicos de ${safePoi}.`,
            points: [
              "Integración de Datos Abiertos Enlazados (LOD): El año de construcción y la clasificación estilística de Wikidata establecen puntos clave de verificación.",
              "Verificación visual directa: El alumnado coteja los datos ontológicos de Wikidata (decoración, planta, fábrica material) con el estado real del monumento.",
              "Impacto pedagógico: Desarrolla destrezas de prospección visual, documentación fotográfica y descripción formal del espacio arquitectónico."
            ],
            btnClose: "Entendido",
            closeAria: "Cerrar"
          };
        case 2:
          return {
            title: "Metodología de Caso Analítico",
            summary: `Análisis histórico, urbano y cultural del impacto de ${safePoi} en el patrimonio regional.`,
            points: [
              "Vinculación semántica de eventos: Emplea el grafo de conocimiento de Wikidata para trazar la cronología y los hitos clave del monumento.",
              "Análisis comparativo: Conduce al alumnado a contrastar la escuela arquitectónica con modelos homólogos del contexto europeo.",
              "Impacto pedagógico: Fortalece competencias de crítica historiográfica, consulta de fuentes y redacción de ensayos académicos."
            ],
            btnClose: "Entendido",
            closeAria: "Cerrar"
          };
        case 3:
        default:
          return {
            title: "Metodología de Cuestionario / Quiz",
            summary: `Evaluación formativa estructurada del dominio conceptual sobre ${safePoi}.`,
            points: [
              "Validación factual: Preguntas sustentadas directamente en identificadores verificados de Wikidata (cronología, estilo arquitectónico, promotores).",
              "Evaluación diferenciada: Combina reactivos de respuesta objetiva (fechas, estilos) con preguntas de razonamiento espacial.",
              "Impacto pedagógico: Proporciona control de aprendizaje inmediato en seminarios o prácticas de campo."
            ],
            btnClose: "Entendido",
            closeAria: "Cerrar"
          };
      }
    }

    // Default: Ukrainian
    switch (variantNum) {
      case 1:
        return {
          title: "Методологія Польового Завдання (Field Task)",
          summary: `Натурне обстеження та фіксація архітектурних параметрів об'єкта ${safePoi}.`,
          points: [
            "Інтеграція Linked Open Data: Рік заснування та стильова класифікація з Wikidata формують ключові контрольні точки для студентів.",
            "Пряма візуальна верифікація: Студенти зіставляють онтологічні факти Wikidata (наприклад, елементи декору, планування, матеріал) із реальним станом пам'ятки.",
            "Педагогічний ефект: Розвиває навички архітектурного нагляду, фотофіксації та критичного опису просторової композиції."
          ],
          btnClose: "Зрозуміло",
          closeAria: "Закрити"
        };
      case 2:
        return {
          title: "Методологія Аналітичного Кейсу (Analytical Case)",
          summary: `Історичний та культурний аналіз впливу ${safePoi} на регіональну спадщину.`,
          points: [
            "Семантичний зв'язок подій: Завдання використовує граф знань Wikidata для побудови хронологічного ланцюга подій, пов'язаних з об'єктом.",
            "Компаративний аналіз: Спонукає здобувачів вищої освіти порівняти архітектурну школу об'єкта з європейськими аналогами тієї ж доби.",
            "Педагогічний ефект: Формує компетенції історико-архітектурного аналізу, роботи з першоджерелами та написання наукових есе."
          ],
          btnClose: "Зрозуміло",
          closeAria: "Закрити"
        };
      case 3:
      default:
        return {
          title: "Методологія Оцінювального Тесту (Assessment Quiz)",
          summary: `Структурована перевірка засвоєння фундаментальних концепцій навколо ${safePoi}.`,
          points: [
            "Фактологічна валідація: Запитання автоматично ґрунтуються на перевірених ідентифікаторах Wikidata (період, стиль, історичні діячі).",
            "Диференційоване оцінювання: Поєднує питання з однозначною відповіддю (дати, стилі) з відкритими питаннями на просторову уяву.",
            "Педагогічний ефект: Забезпечує експрес-контроль знань під час семінарів або польових практик."
          ],
          btnClose: "Зрозуміло",
          closeAria: "Закрити"
        };
    }
  };

  const exp = getExplanation();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#7A1C30] text-white px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-[#D4AF37] font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{exp.title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition cursor-pointer"
            aria-label={exp.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm font-medium text-slate-800 bg-amber-50 p-3 rounded-lg border border-amber-200/80">
            {exp.summary}
          </p>

          <div className="space-y-3">
            {exp.points.map((pt, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                <div className="mt-0.5 text-[#7A1C30] shrink-0">
                  {idx === 0 ? <Database className="w-4 h-4" /> : idx === 1 ? <BookOpen className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                </div>
                <div className="leading-relaxed">{pt}</div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#581221] hover:bg-[#7A1C30] rounded-lg transition cursor-pointer"
            >
              {exp.btnClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
