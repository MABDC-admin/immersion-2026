import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download } from 'lucide-react';
import { InternEvaluation, RUBRIC_SECTIONS, SUPERVISOR_EVALUATION_GUIDELINES, sumEvaluationSection } from '@/hooks/useEvaluations';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Very Satisfactory',
  5: 'Outstanding',
};

const PREPARED_BY = [
  'ABM Work Immersion Facilitator - Ms. Jade Emerald Amurao',
  'HUMSS Work Immersion Facilitator - Mr. Mark John Ramirez',
  'STEM Work Immersion Facilitator - Mr. Jan Alfred Macalintal',
] as const;

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-primary text-primary-foreground',
  finalized: 'bg-hrms-success text-white',
};

const SECTION_STYLES: Record<string, {
  summary: string;
  total: string;
  item: string;
  score: string;
  progress: string;
}> = {
  attendance: {
    summary: 'border-emerald-200 bg-emerald-50/85',
    total: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    item: 'border-emerald-100 bg-emerald-50/55',
    score: 'text-emerald-700',
    progress: 'bg-emerald-100 [&>div]:bg-emerald-500',
  },
  attitude: {
    summary: 'border-amber-200 bg-amber-50/85',
    total: 'border-amber-200 bg-amber-50 text-amber-800',
    item: 'border-amber-100 bg-amber-50/55',
    score: 'text-amber-700',
    progress: 'bg-amber-100 [&>div]:bg-amber-500',
  },
  ethics: {
    summary: 'border-violet-200 bg-violet-50/85',
    total: 'border-violet-200 bg-violet-50 text-violet-800',
    item: 'border-violet-100 bg-violet-50/55',
    score: 'text-violet-700',
    progress: 'bg-violet-100 [&>div]:bg-violet-500',
  },
  quality: {
    summary: 'border-cyan-200 bg-cyan-50/85',
    total: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    item: 'border-cyan-100 bg-cyan-50/55',
    score: 'text-cyan-700',
    progress: 'bg-cyan-100 [&>div]:bg-cyan-500',
  },
  teamwork: {
    summary: 'border-rose-200 bg-rose-50/85',
    total: 'border-rose-200 bg-rose-50 text-rose-800',
    item: 'border-rose-100 bg-rose-50/55',
    score: 'text-rose-700',
    progress: 'bg-rose-100 [&>div]:bg-rose-500',
  },
};

const DETAIL_STAT_STYLES = {
  intern: 'border-orange-200 bg-orange-50/85 text-orange-800',
  supervisor: 'border-violet-200 bg-violet-50/85 text-violet-800',
  period: 'border-cyan-200 bg-cyan-50/85 text-cyan-800',
  date: 'border-amber-200 bg-amber-50/85 text-amber-800',
} as const;

const PAGE_TWO_SECTION_IDS = ['attendance', 'attitude'] as const;
const PAGE_THREE_SECTION_IDS = ['ethics', 'quality', 'teamwork'] as const;

interface EvaluationDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: InternEvaluation | null;
}

function getInitials(evaluation: InternEvaluation) {
  const first = evaluation.intern?.first_name?.[0] || 'I';
  const last = evaluation.intern?.last_name?.[0] || 'N';
  return `${first}${last}`.toUpperCase();
}

export function EvaluationDetail({ open, onOpenChange, evaluation }: EvaluationDetailProps) {
  const printableRef = useRef<HTMLDivElement | null>(null);
  if (!evaluation) return null;

  const handleExportPdf = () => {
    const title = evaluation.intern
      ? `${evaluation.intern.first_name} ${evaluation.intern.last_name} Evaluation`
      : 'Supervisor Evaluation';

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body {
              background: white;
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            }
            @page {
              size: A4;
              margin: 14mm;
            }
            .page {
              width: 100%;
              max-width: 816px;
              margin: 0 auto;
              padding: 24px 18px;
              box-sizing: border-box;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .center { text-align: center; }
            .report-cover {
              border: 1px solid #fed7aa;
              border-radius: 18px;
              overflow: hidden;
              background: linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #ecfeff 100%);
              margin-bottom: 18px;
            }
            .brand-strip {
              padding: 16px 18px;
              background: linear-gradient(90deg, #fb923c 0%, #22d3ee 100%);
              color: white;
            }
            .school-logo {
              display: block;
              width: 86px;
              height: 86px;
              object-fit: contain;
              margin: 0 auto 10px auto;
              border-radius: 999px;
              background: white;
              border: 3px solid rgba(255, 255, 255, 0.92);
              box-shadow: 0 8px 20px rgba(15, 23, 42, 0.22);
            }
            .brand-strip .subheading,
            .brand-strip .heading {
              color: white;
            }
            .identity-card {
              display: flex;
              gap: 16px;
              align-items: center;
              padding: 16px 18px;
            }
            .intern-photo {
              width: 88px;
              height: 88px;
              border-radius: 18px;
              object-fit: cover;
              border: 4px solid white;
              box-shadow: 0 8px 22px rgba(15, 23, 42, 0.14);
              background: #ffedd5;
              flex: 0 0 auto;
            }
            .intern-photo-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              color: #c2410c;
              font-size: 28px;
              font-weight: 800;
            }
            .identity-copy {
              flex: 1;
              min-width: 0;
            }
            .identity-copy h2 {
              margin: 0;
              font-size: 22px;
              line-height: 1.2;
            }
            .identity-copy p {
              margin: 4px 0 0 0;
            }
            .score-card {
              min-width: 132px;
              border: 1px solid #bae6fd;
              border-radius: 16px;
              padding: 12px;
              text-align: center;
              background: #f0f9ff;
              color: #0369a1;
            }
            .score-big {
              display: block;
              margin-top: 4px;
              font-size: 34px;
              line-height: 1;
              font-weight: 900;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              padding: 0 18px 18px 18px;
            }
            .meta-card {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              background: white;
              padding: 9px 10px;
              font-size: 11px;
            }
            .meta-label {
              display: block;
              margin-bottom: 3px;
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.09em;
              text-transform: uppercase;
              color: #64748b;
            }
            .meta-card.orange { border-color: #fed7aa; background: #fff7ed; color: #9a3412; }
            .meta-card.violet { border-color: #ddd6fe; background: #f5f3ff; color: #5b21b6; }
            .meta-card.cyan { border-color: #a5f3fc; background: #ecfeff; color: #155e75; }
            .meta-card.amber { border-color: #fde68a; background: #fffbeb; color: #92400e; }
            .meta-card.emerald { border-color: #a7f3d0; background: #ecfdf5; color: #047857; }
            .meta-card.rose { border-color: #fecdd3; background: #fff1f2; color: #be123c; }
            .guidelines-card {
              border: 1px solid #ddd6fe;
              border-radius: 16px;
              background: #f5f3ff;
              padding: 14px 16px;
              margin-top: 14px;
            }
            .heading {
              font-size: 19px;
              font-weight: 700;
              margin: 0;
            }
            .subheading {
              font-size: 14px;
              margin: 0 0 2px 0;
            }
            .small {
              font-size: 11px;
              line-height: 1.45;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              margin: 18px 0 8px 0;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 8px 10px;
            }
            .rule-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-bottom: 16px;
            }
            .rule-table th,
            .rule-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              vertical-align: top;
            }
            .rule-table th {
              text-align: left;
              font-weight: 700;
              background: #f8fafc;
            }
            .score-cell {
              width: 84px;
              text-align: center;
              font-weight: 700;
              font-size: 13px;
            }
            .section-attendance .section-title,
            .section-attendance .score-cell { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .section-attendance th { background: #d1fae5; color: #065f46; }
            .section-attitude .section-title,
            .section-attitude .score-cell { background: #fffbeb; color: #b45309; border-color: #fde68a; }
            .section-attitude th { background: #fef3c7; color: #92400e; }
            .section-ethics .section-title,
            .section-ethics .score-cell { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
            .section-ethics th { background: #ede9fe; color: #5b21b6; }
            .section-quality .section-title,
            .section-quality .score-cell { background: #ecfeff; color: #0891b2; border-color: #a5f3fc; }
            .section-quality th { background: #cffafe; color: #155e75; }
            .section-teamwork .section-title,
            .section-teamwork .score-cell { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
            .section-teamwork th { background: #ffe4e6; color: #9f1239; }
            .overview-table {
              width: 70%;
              border-collapse: collapse;
              font-size: 11px;
              margin-top: 12px;
            }
            .overview-table th,
            .overview-table td {
              border: 1px solid #cbd5e1;
              padding: 7px 10px;
            }
            .overview-table th {
              text-align: left;
              background: #ecfeff;
              color: #155e75;
            }
            .overall-line {
              margin-top: 10px;
              font-size: 13px;
              font-weight: 700;
              color: #0369a1;
            }
            .comment-box {
              margin-top: 12px;
              border: 1px solid #fed7aa;
              border-radius: 14px;
              background: #fff7ed;
              min-height: 92px;
              padding: 10px;
              white-space: pre-wrap;
              font-size: 11px;
              line-height: 1.45;
            }
            .muted-line {
              margin: 0 0 6px 0;
            }
            ul.guidelines {
              margin: 12px 0 0 0;
              padding-left: 18px;
            }
            ul.guidelines li {
              margin-bottom: 6px;
            }
            .rating-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-top: 14px;
            }
            .rating-table th,
            .rating-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              vertical-align: top;
            }
            .rating-table th {
              text-align: left;
              background: #ffedd5;
              color: #9a3412;
            }
            .prepared {
              margin-top: 24px;
              font-size: 11px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          ${buildEvaluationPrintHtml(evaluation)}
        </body>
      </html>
    `;

    // Use a hidden iframe in the current document — avoids popup blockers and
    // reliably triggers the browser's native "Save as PDF" dialog.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const cleanup = () => {
      // Delay removal so the print dialog can finish reading the document.
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    };

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) {
          cleanup();
          return;
        }
        // Give images/fonts a tick to lay out before printing.
        setTimeout(() => {
          try {
            win.focus();
            win.print();
          } catch (err) {
            console.error('Print failed', err);
          } finally {
            cleanup();
          }
        }, 250);
      } catch (err) {
        console.error('Print iframe error', err);
        cleanup();
      }
    };

    // srcdoc gives the iframe a real document and fires `load` reliably.
    iframe.srcdoc = html;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] xl:max-w-7xl max-h-[92vh] overflow-y-auto border-slate-200 bg-slate-50/50 print:max-w-none print:shadow-none">
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="text-lg font-bold">Supervisor Evaluation Report</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={handleExportPdf}>
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Badge className={statusColors[evaluation.status] || 'bg-muted'}>{evaluation.status.toUpperCase()}</Badge>
              {evaluation.award_eligible && <Badge className="bg-hrms-warning/100 text-black">Award Eligible</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div ref={printableRef} className="space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-cyan-50 p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="h-14 w-14 border border-slate-200 shadow-sm">
                  <AvatarImage src={evaluation.intern?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {getInitials(evaluation)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-wide">M.A. Brain Development Center</p>
                  <p className="text-sm text-muted-foreground">Abu Dhabi, United Arab Emirates</p>
                  <h2 className="pt-1 text-lg font-bold text-slate-900">
                    {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'Intern Evaluation'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Work Immersion Internship Supervisor Evaluation</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-center lg:min-w-[200px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total Score</p>
                <div className="mt-2 flex items-end justify-center gap-2">
                  <span className="text-4xl font-black leading-none text-primary">{evaluation.overall_score ?? 0}</span>
                  <span className="pb-1 text-base font-semibold text-muted-foreground">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {evaluation.award_eligible ? 'Award eligible' : 'Evaluation completed'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DetailStat
              label="Intern"
              value={evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'N/A'}
              tone="intern"
            />
            <DetailStat
              label="Supervisor"
              value={evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : 'N/A'}
              tone="supervisor"
            />
            <DetailStat
              label="Evaluation Period"
              value={`${format(new Date(evaluation.evaluation_period_start), 'MMM d, yyyy')} - ${format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}`}
              tone="period"
            />
            <DetailStat
              label="Date Evaluated"
              value={format(new Date(evaluation.evaluation_date), 'MMM d, yyyy')}
              tone="date"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {RUBRIC_SECTIONS.map((section) => {
              const sectionTotal = sumEvaluationSection(evaluation, section.id);
              const style = SECTION_STYLES[section.id];

              return (
                <div key={section.id} className={`rounded-2xl border p-4 shadow-sm ${style.summary}`}>
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{section.title}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className={`text-2xl font-black ${style.score}`}>{sectionTotal}</span>
                    <span className="pb-0.5 text-sm font-semibold text-muted-foreground">/ {section.maxScore}</span>
                  </div>
                  <Progress value={(sectionTotal / section.maxScore) * 100} className={`mt-3 h-2 ${style.progress}`} />
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor Evaluation Notes</p>
            </div>
            <ul className="grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
              {SUPERVISOR_EVALUATION_GUIDELINES.slice(0, 4).map((guideline) => (
                <li key={guideline} className="flex gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="mt-1 text-foreground">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {RUBRIC_SECTIONS.map((section) => {
              const sectionTotal = sumEvaluationSection(evaluation, section.id);
              const style = SECTION_STYLES[section.id];

              return (
                <div key={section.id} className={`rounded-2xl border p-4 shadow-sm ${style.summary}`}>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">Category total: {sectionTotal} / {section.maxScore}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 text-right ${style.total}`}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Category Total</p>
                      <p className="text-lg font-bold">{sectionTotal} / {section.maxScore}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {section.items.map((item) => {
                      const score = evaluation[item.key];
                      const normalized = score ? (score / 5) * 100 : 0;

                      return (
                        <div key={item.key} className={`flex min-h-[132px] flex-col justify-between rounded-2xl border p-3 ${style.item}`}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-snug">{item.label}</p>
                            <div className="shrink-0 rounded-xl bg-white px-2.5 py-1.5 text-right shadow-sm">
                              <p className={`text-base font-bold leading-none ${style.score}`}>
                                {score ?? 0}<span className="text-xs text-muted-foreground">/5</span>
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-[11px] font-medium text-muted-foreground">
                                {score ? RATING_LABELS[score] : 'Not rated'}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{Math.round(normalized)}%</span>
                            </div>
                            <Progress value={normalized} className={`h-2 ${style.progress}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <NoteCard title="Supervisor Comments" value={evaluation.supervisor_comments} />
            <NoteCard title="Comments" value={evaluation.comments} />
            <NoteCard title="Recommendations" value={evaluation.recommendations} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Prepared By</p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {PREPARED_BY.map((person) => (
                <p key={person}>{person}</p>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof DETAIL_STAT_STYLES;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${DETAIL_STAT_STYLES[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function NoteCard({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
        {value || 'No notes provided.'}
      </p>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRubricTable(sectionIds: readonly string[], evaluation: InternEvaluation) {
  return sectionIds
    .map((sectionId) => {
      const section = RUBRIC_SECTIONS.find((entry) => entry.id === sectionId);
      if (!section) return '';

      const rows = section.items
        .map((item) => {
          const score = evaluation[item.key] ?? '';
          return `
            <tr>
              <td>${escapeHtml(item.label)}</td>
              <td>${escapeHtml(item.description)}</td>
              <td class="score-cell">${score}</td>
            </tr>
          `;
        })
        .join('');

      return `
        <div class="rubric-section section-${escapeHtml(section.id)}">
        <div class="section-title">${escapeHtml(section.title)} (Max: ${section.maxScore} points)</div>
        <table class="rule-table">
          <thead>
            <tr>
              <th style="width: 31%;">Criteria</th>
              <th>What to Evaluate</th>
              <th style="width: 90px;">Possible Score (1-5)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        </div>
      `;
    })
    .join('');
}

function buildEvaluationPrintHtml(evaluation: InternEvaluation) {
  const attendanceTotal = sumEvaluationSection(evaluation, 'attendance');
  const attitudeTotal = sumEvaluationSection(evaluation, 'attitude');
  const ethicsTotal = sumEvaluationSection(evaluation, 'ethics');
  const qualityTotal = sumEvaluationSection(evaluation, 'quality');
  const teamworkTotal = sumEvaluationSection(evaluation, 'teamwork');
  const supervisorName = evaluation.evaluator
    ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}`
    : 'N/A';
  const internName = evaluation.intern
    ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}`
    : 'N/A';
  const internDepartment = evaluation.intern?.department?.name || 'Department pending';
  const internPhoto = evaluation.intern?.avatar_url
    ? `<img class="intern-photo" src="${escapeHtml(evaluation.intern.avatar_url)}" alt="${escapeHtml(internName)}" />`
    : `<div class="intern-photo intern-photo-fallback">${escapeHtml(getInitials(evaluation))}</div>`;
  const evaluationPeriod =
    `${format(new Date(evaluation.evaluation_period_start), 'MMM d, yyyy')} - ${format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}`;
  const evaluatedDate = format(new Date(evaluation.evaluation_date), 'MMM d, yyyy');
  const notes = [evaluation.supervisor_comments, evaluation.comments, evaluation.recommendations]
    .filter(Boolean)
    .join('\n\n');

  return `
    <section class="page">
      <div class="report-cover">
        <div class="brand-strip center">
          <img class="school-logo" src="/images/school-logo.png" alt="M.A. Brain Development Center logo" />
          <p class="subheading"><strong>M.A. BRAIN DEVELOPMENT CENTER</strong></p>
          <p class="subheading">Abu Dhabi, United Arab Emirates</p>
          <p class="heading">WORK IMMERSION INTERNSHIP</p>
          <p class="subheading">Supervisor Evaluation Report</p>
        </div>

        <div class="identity-card">
          ${internPhoto}
          <div class="identity-copy">
            <span class="meta-label">Intern</span>
            <h2>${escapeHtml(internName)}</h2>
            <p class="small">${escapeHtml(internDepartment)}</p>
            <p class="small">Supervisor: <strong>${escapeHtml(supervisorName)}</strong></p>
          </div>
          <div class="score-card">
            <span class="meta-label">Total Score</span>
            <span class="score-big">${evaluation.overall_score ?? 0}</span>
            <span class="small">/ 100</span>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-card orange"><span class="meta-label">Evaluation Period</span>${escapeHtml(evaluationPeriod)}</div>
          <div class="meta-card cyan"><span class="meta-label">Date Evaluated</span>${escapeHtml(evaluatedDate)}</div>
          <div class="meta-card amber"><span class="meta-label">Status</span>${escapeHtml(evaluation.status.toUpperCase())}</div>
          <div class="meta-card emerald"><span class="meta-label">Award</span>${evaluation.award_eligible ? 'Eligible' : 'Not marked eligible'}</div>
          <div class="meta-card violet"><span class="meta-label">Intern ID</span>${escapeHtml(evaluation.intern_id.slice(0, 8))}</div>
          <div class="meta-card rose"><span class="meta-label">Evaluation ID</span>${escapeHtml(evaluation.id.slice(0, 8))}</div>
        </div>
      </div>

      <div class="center">
        <p class="subheading"><strong>Guidelines for Supervisors Before Intern Evaluation</strong></p>
      </div>
      <div class="guidelines-card">
      <ul class="guidelines small">
        ${SUPERVISOR_EVALUATION_GUIDELINES.map((guideline) => `<li>${escapeHtml(guideline)}</li>`).join('')}
      </ul>
      </div>

    </section>

    <section class="page">
      <div class="center">
        <p class="heading">WORK IMMERSION INTERNSHIP RUBRIC</p>
      </div>

      <div class="section-title">Rating Scale</div>
      <table class="rating-table">
        <thead>
          <tr>
            <th style="width: 80px;">Rating</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>5</strong></td><td>Demonstrates exceptional performance that exceeds expectations.</td></tr>
          <tr><td><strong>4</strong></td><td>Consistently meets and occasionally surpasses expectations. Performs well with minimal areas requiring improvement.</td></tr>
          <tr><td><strong>3</strong></td><td>Meets the basic requirements and performs adequately. Displays potential for growth despite some gaps that need attention.</td></tr>
          <tr><td><strong>2</strong></td><td>Performance does not consistently meet expectations and falls below standards in several areas. Requires guidance and targeted development.</td></tr>
          <tr><td><strong>1</strong></td><td>Fails to meet established expectations; performance is inadequate. Immediate corrective action is required.</td></tr>
        </tbody>
      </table>

      ${buildRubricTable(PAGE_TWO_SECTION_IDS, evaluation)}
    </section>

    <section class="page">
      ${buildRubricTable(PAGE_THREE_SECTION_IDS, evaluation)}

      <div class="section-title">Performance Overview</div>
      <table class="overview-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="width: 120px;">Total Score</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Attendance &amp; Punctuality</td><td>${attendanceTotal}</td></tr>
          <tr><td>Attitude &amp; Enthusiasm</td><td>${attitudeTotal}</td></tr>
          <tr><td>Work Ethics &amp; Responsibility</td><td>${ethicsTotal}</td></tr>
          <tr><td>Quality of Work &amp; Accomplishments</td><td>${qualityTotal}</td></tr>
          <tr><td>Teamwork &amp; Collaboration</td><td>${teamworkTotal}</td></tr>
        </tbody>
      </table>

      <div class="overall-line">Overall score: ${evaluation.overall_score ?? 0} / 100</div>

      <div class="section-title">Supervisor Comments</div>
      <div class="comment-box">${escapeHtml(notes || 'No comments provided.')}</div>

      <div class="prepared">
        <p class="muted-line"><strong>Prepared By:</strong></p>
        ${PREPARED_BY.map((person) => `<div>${escapeHtml(person)}</div>`).join('')}
        <div style="margin-top: 18px;"><strong>Intern:</strong> ${escapeHtml(internName)}</div>
        <div><strong>Supervisor:</strong> ${escapeHtml(supervisorName)}</div>
        <div><strong>Evaluation Period:</strong> ${escapeHtml(evaluationPeriod)}</div>
        <div><strong>Date Evaluated:</strong> ${escapeHtml(evaluatedDate)}</div>
      </div>
    </section>
  `;
}
