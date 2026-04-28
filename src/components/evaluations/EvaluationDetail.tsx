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
  finalized: 'bg-emerald-600 text-white',
};

const PAGE_TWO_SECTION_IDS = ['attendance', 'attitude', 'ethics'] as const;
const PAGE_THREE_SECTION_IDS = ['quality', 'teamwork'] as const;

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
  if (!evaluation) return null;
  const printableRef = useRef<HTMLDivElement | null>(null);

  const handleExportPdf = () => {
    if (!printableRef.current) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900');
    if (!printWindow) return;

    const title = evaluation.intern
      ? `${evaluation.intern.first_name} ${evaluation.intern.last_name} Evaluation`
      : 'Supervisor Evaluation';

    printWindow.document.write(`
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
            }
            .rule-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-bottom: 16px;
            }
            .rule-table th,
            .rule-table td {
              border: 1px solid #111827;
              padding: 8px 10px;
              vertical-align: top;
            }
            .rule-table th {
              text-align: left;
              font-weight: 700;
            }
            .score-cell {
              width: 84px;
              text-align: center;
              font-weight: 700;
              font-size: 13px;
            }
            .overview-table {
              width: 70%;
              border-collapse: collapse;
              font-size: 11px;
              margin-top: 12px;
            }
            .overview-table th,
            .overview-table td {
              border: 1px solid #111827;
              padding: 7px 10px;
            }
            .overview-table th {
              text-align: left;
            }
            .overall-line {
              margin-top: 10px;
              font-size: 13px;
              font-weight: 700;
            }
            .comment-box {
              margin-top: 12px;
              border: 1px solid #111827;
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
              border: 1px solid #111827;
              padding: 8px 10px;
              vertical-align: top;
            }
            .rating-table th {
              text-align: left;
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
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto border-slate-200 bg-slate-50/50 print:max-w-none print:shadow-none">
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="text-lg font-bold">Supervisor Evaluation Report</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={handleExportPdf}>
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </Button>
              <Badge className={statusColors[evaluation.status] || 'bg-muted'}>{evaluation.status.toUpperCase()}</Badge>
              {evaluation.award_eligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div ref={printableRef} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="h-16 w-16 border border-slate-200 shadow-sm">
                  <AvatarImage src={evaluation.intern?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {getInitials(evaluation)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-wide">M.A. Brain Development Center</p>
                  <p className="text-sm text-muted-foreground">Abu Dhabi, United Arab Emirates</p>
                  <h2 className="pt-1 text-xl font-bold text-slate-900">
                    {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'Intern Evaluation'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Work Immersion Internship Supervisor Evaluation</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-6 py-5 text-center lg:min-w-[220px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total Score</p>
                <div className="mt-2 flex items-end justify-center gap-2">
                  <span className="text-5xl font-black leading-none text-primary">{evaluation.overall_score ?? 0}</span>
                  <span className="pb-1 text-base font-semibold text-muted-foreground">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {evaluation.award_eligible ? 'Award eligible' : 'Evaluation completed'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Intern</p>
              <p className="mt-1 text-sm font-semibold">
                {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor</p>
              <p className="mt-1 text-sm font-semibold">
                {evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Evaluation Period</p>
              <p className="mt-1 text-sm font-semibold">
                {format(new Date(evaluation.evaluation_period_start), 'MMM d, yyyy')} - {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Date Evaluated</p>
              <p className="mt-1 text-sm font-semibold">{format(new Date(evaluation.evaluation_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor Evaluation Notes</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {SUPERVISOR_EVALUATION_GUIDELINES.slice(0, 6).map((guideline) => (
                <li key={guideline} className="flex gap-2">
                  <span className="mt-1 text-foreground">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            {RUBRIC_SECTIONS.map((section) => {
              const sectionTotal = sumEvaluationSection(evaluation, section.id);

              return (
                <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">Category total: {sectionTotal} / {section.maxScore}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Category Total</p>
                      <p className="text-lg font-bold text-slate-900">{sectionTotal} / {section.maxScore}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((item) => {
                      const score = evaluation[item.key];
                      const normalized = score ? (score / 5) * 100 : 0;

                      return (
                        <div key={item.key} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                            <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                              <p className="text-lg font-bold text-primary">{score ?? 0}<span className="text-sm text-muted-foreground">/5</span></p>
                              <p className="text-[11px] font-medium text-muted-foreground">
                                {score ? RATING_LABELS[score] : 'Not rated'}
                              </p>
                            </div>
                          </div>
                          <Progress value={normalized} className="h-2.5 bg-slate-200" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {evaluation.supervisor_comments && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor Comments</h3>
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">{evaluation.supervisor_comments}</p>
            </div>
          )}

          {evaluation.comments && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Comments</h3>
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">{evaluation.comments}</p>
            </div>
          )}

          {evaluation.recommendations && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Recommendations</h3>
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">{evaluation.recommendations}</p>
            </div>
          )}

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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
  const notes = [evaluation.supervisor_comments, evaluation.comments, evaluation.recommendations]
    .filter(Boolean)
    .join('\n\n');

  return `
    <section class="page">
      <div class="center">
        <p class="subheading"><strong>M.A. BRAIN DEVELOPMENT CENTER</strong></p>
        <p class="subheading">Abu Dhabi, United Arab Emirates</p>
        <p class="heading">WORK IMMERSION INTERNSHIP</p>
        <p class="subheading">Guidelines for Supervisors Before Intern Evaluation</p>
      </div>

      <ul class="guidelines small">
        ${SUPERVISOR_EVALUATION_GUIDELINES.map((guideline) => `<li>${escapeHtml(guideline)}</li>`).join('')}
      </ul>

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
    </section>

    <section class="page">
      <div class="center">
        <p class="heading">WORK IMMERSION INTERNSHIP RUBRIC</p>
      </div>
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
        <div><strong>Evaluation Period:</strong> ${escapeHtml(format(new Date(evaluation.evaluation_period_start), 'MMM d, yyyy'))} - ${escapeHtml(format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy'))}</div>
        <div><strong>Date Evaluated:</strong> ${escapeHtml(format(new Date(evaluation.evaluation_date), 'MMM d, yyyy'))}</div>
      </div>
    </section>
  `;
}
