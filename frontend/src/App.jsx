
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'https://failure-first-ai-5y98.vercel.app';
const STORAGE_KEY = 'failurefirst-workspace-v2';

const emptyForm = {
  idea: '',
  audience: '',
  stage: 'idea',
  target_country: 'Pakistan',
  budget: '',
  resources: '',
  business_goal: '',
  timeline: '90 days',
  challenges: '',
  customer_problem: '',
  alternatives: '',
  competitors: '',
  revenue_model: '',
  traction: '',
};

const tabs = [
  ['command', 'Command Center'],
  ['failure', 'Failure Map'],
  ['experiments', 'Experiment Lab'],
  ['growth', 'Growth Engine'],
  ['roadmap', '90-Day Roadmap'],
  ['evidence', 'Evidence Ledger'],
  ['assistant', 'AI Workspace'],
];

function readSaved() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function saveText(value) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="section-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-mark">Ã¯Â¼â€¹</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function Pill({ children, tone = '' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function ListBlock({ title, items, renderItem }) {
  if (!Array.isArray(items) || !items.length) return null;

  return (
    <section className="content-block">
      {title && <h3>{title}</h3>}
      <div className="stack">
        {items.map((item, index) => (
          <div className="list-card" key={`${title || 'item'}-${index}`}>
            {renderItem ? renderItem(item, index) : (
              typeof item === 'string' ? item : saveText(item)
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TextList({ items }) {
  if (!Array.isArray(items) || !items.length) return <p className="muted">No items provided.</p>;
  return (
    <ul className="detail-list">
      {items.map((item, index) => (
        <li key={index}>{typeof item === 'string' ? item : saveText(item)}</li>
      ))}
    </ul>
  );
}

function App() {
  const [saved] = useState(readSaved);
  const [form, setForm] = useState({ ...emptyForm, ...(saved.form || {}) });
  const [result, setResult] = useState(saved.result || null);
  const [active, setActive] = useState('command');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [experiments, setExperiments] = useState(saved.experiments || {});
  const [evidence, setEvidence] = useState(saved.evidence || []);
  const [roadmapProgress, setRoadmapProgress] = useState(saved.roadmapProgress || {});
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState(saved.assistantAnswer || null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    observation: '',
    source: '',
    type: 'User observation',
    confidence: 'Medium',
    relation: 'Supports',
    relatedHypothesis: '',
    notes: '',
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        form, result, experiments, evidence, roadmapProgress, assistantAnswer,
      }));
    } catch {
      setNotice('Browser storage is full or unavailable. Export your workspace to keep a backup.');
    }
  }, [form, result, experiments, evidence, roadmapProgress, assistantAnswer]);

  const completedExperiments = useMemo(
    () => Object.values(experiments).filter(item => item.status === 'Complete').length,
    [experiments]
  );

  const completedMilestones = useMemo(
    () => Object.values(roadmapProgress).filter(Boolean).length,
    [roadmapProgress]
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  }

  async function runAnalysis(event) {
    event?.preventDefault();

    if (form.idea.trim().length < 10 || form.audience.trim().length < 2) {
      setError('Describe your business idea in at least 10 characters and enter your intended customers.');
      setActive('command');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    setActive('command');

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          idea: form.idea.trim(),
          audience: form.audience.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || `Analysis failed (${response.status}).`);
      }

      if (!data || typeof data !== 'object' || !data.executive_summary) {
        throw new Error('The server response was incomplete. Please retry the analysis.');
      }

      setResult(data);
      setExperiments({});
      setRoadmapProgress({});
      setAssistantAnswer(null);
      setNotice('New analysis received. Experiment and roadmap progress has been reset for this new analysis.');
    } catch (err) {
      setError(`${err.message || 'Could not reach the backend.'} Check that the backend is running on port 8002.`);
    } finally {
      setLoading(false);
    }
  }

  function updateExperiment(index, field, value) {
    setExperiments(previous => ({
      ...previous,
      [index]: {
        ...(previous[index] || { status: 'Not started', notes: '', actualResult: '' }),
        [field]: value,
      },
    }));
  }

  function addEvidence(event) {
    event.preventDefault();

    if (!evidenceForm.observation.trim()) {
      setNotice('Add an observation before saving evidence.');
      return;
    }

    const entry = {
      ...evidenceForm,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toLocaleDateString(),
    };

    setEvidence(previous => [entry, ...previous]);
    setEvidenceForm({
      observation: '',
      source: '',
      type: 'User observation',
      confidence: 'Medium',
      relation: 'Supports',
      relatedHypothesis: '',
      notes: '',
    });
    setNotice('Evidence saved to this browser workspace.');
  }

  async function askAssistant(event, interpret = false) {
    event?.preventDefault();

    if (assistantQuestion.trim().length < 2) {
      setError('Write a question first.');
      return;
    }

    if (!result) {
      setError('Run your first business analysis before using the contextual assistant.');
      return;
    }

    setAssistantLoading(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        question: assistantQuestion.trim(),
        business_context: {
          ...form,
          executive_summary: result.executive_summary,
          viability_score: result.viability_score,
          top_risks: result.top_risks,
          assumptions: result.assumptions,
          growth_strategy: result.growth_strategy,
          immediate_next_action: result.immediate_next_action,
        },
        evidence,
        experiments: (result.experiments || []).map((experiment, index) => ({
          ...experiment,
          user_status: experiments[index]?.status || 'Not started',
          actual_result: experiments[index]?.actualResult || '',
          user_notes: experiments[index]?.notes || '',
        })),
        roadmap_progress: (result.roadmap_30_60_90 || []).flatMap((phase, phaseIndex) =>
          (phase.milestones || []).map((milestone, milestoneIndex) => ({
            phase: phase.phase,
            task: milestone.task,
            completed: Boolean(roadmapProgress[`${phaseIndex}-${milestoneIndex}`]),
          }))
        ),
      };

      const endpoint = interpret ? '/api/interpret-experiment' : '/api/assistant';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          question: interpret
            ? `Interpret the recorded experiment results. ${payload.question}`
            : payload.question,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Assistant failed (${response.status}).`);

      setAssistantAnswer(data);
      setActive('assistant');
      setNotice('Response generated using the current workspace context.');
    } catch (err) {
      setError(`${err.message || 'The assistant request failed.'} Check the backend terminal.`);
    } finally {
      setAssistantLoading(false);
    }
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify({
      exported_at: new Date().toISOString(),
      form, result, experiments, evidence, roadmapProgress, assistantAnswer,
    }, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'failurefirst-workspace.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Workspace export created.');
  }

  function resetWorkspace() {
    if (!window.confirm('Start a new workspace? This removes the current saved analysis and local progress from this browser. Export first if you need a backup.')) {
      return;
    }

    setForm(emptyForm);
    setResult(null);
    setExperiments({});
    setEvidence([]);
    setRoadmapProgress({});
    setAssistantAnswer(null);
    setAssistantQuestion('');
    setError('');
    setNotice('New workspace ready.');
  }

  const risks = result?.top_risks || [];
  const assumptions = result?.assumptions || [];
  const experimentList = result?.experiments || [];
  const roadmap = result?.roadmap_30_60_90 || [];
  const growth = result?.growth_strategy || {};

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F<span>F</span></div>
          <div>
            <div className="brand-name">FailureFirst</div>
            <div className="brand-subtitle">VENTURE INTELLIGENCE</div>
          </div>
        </div>

        <div className="sidebar-caption">YOUR WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          {tabs.map(([id, label], index) => (
            <button
              key={id}
              className={`nav-item ${active === id ? 'active' : ''}`}
              onClick={() => setActive(id)}
              type="button"
            >
              <span className="nav-number">0{index + 1}</span>
              <span>{label}</span>
              {active === id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <strong>Local workspace</strong>
            <p>Saved in this browser</p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">BUILD WITH EVIDENCE</span>
            <h1>Think before you build.</h1>
          </div>
          <div className="topbar-actions">
            <button className="button button-secondary" onClick={exportWorkspace} type="button">
              Export workspace
            </button>
            <button className="button button-primary" onClick={resetWorkspace} type="button">
              New workspace
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div className={`message ${error ? 'message-error' : 'message-notice'}`} role="status">
            <span>{error || notice}</span>
            <button type="button" onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message">Ãƒâ€”</button>
          </div>
        )}

        {active === 'command' && (
          <div className="page-content">
            <SectionTitle
              eyebrow="01 / VENTURE DISCOVERY"
              title="Your business, under the microscope."
              description="Understand the risks, test demand, and choose the next move before committing more resources."
            />

            <div className="hero-grid">
              <div className="hero-panel">
                <span className="eyebrow">THE FAILUREFIRST METHOD</span>
                <h2>Make your next decision a better one.</h2>
                <p>Turn an idea into testable assumptions, measurable experiments, and a plan grounded in what you actually learn.</p>
                <div className="method-line">
                  <span>Discover</span><i>Ã¢â€ â€™</i><span>Challenge</span><i>Ã¢â€ â€™</i><span>Test</span><i>Ã¢â€ â€™</i><span>Learn</span>
                </div>
              </div>
              <div className="metric-panel">
                <div className="metric-label">DIRECTIONAL VIABILITY</div>
                <div className="metric-number">{result ? `${result.viability_score}/100` : 'Ã¢â‚¬â€'}</div>
                <p>{result ? 'A heuristic assessment, not a probability of success.' : 'Run an analysis to assess your current assumptions.'}</p>
                <div className="metric-divider" />
                <div className="metric-row"><span>Experiments completed</span><strong>{completedExperiments}/{experimentList.length}</strong></div>
                <div className="metric-row"><span>Roadmap milestones</span><strong>{completedMilestones}</strong></div>
              </div>
            </div>

            <form className="form-panel" onSubmit={runAnalysis}>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">VENTURE BRIEF</span>
                  <h3>Tell us what you're building</h3>
                </div>
                <span className="optional-label">Add what you know. Skip what you don't.</span>
              </div>

              <div className="form-grid">
                <label className="field field-wide">
                  Business idea or existing business *
                  <textarea name="idea" value={form.idea} onChange={updateField} minLength={10} maxLength={3000} required placeholder="What are you offering, what problem does it solve, and how would it work?" rows={4} />
                </label>

                <label className="field">
                  Intended customers *
                  <input name="audience" value={form.audience} onChange={updateField} required maxLength={300} placeholder="e.g. independent tutors in Pakistan" />
                </label>

                <label className="field">
                  Current stage
                  <select name="stage" value={form.stage} onChange={updateField}>
                    <option value="idea">Idea</option>
                    <option value="research">Researching</option>
                    <option value="prototype">Prototype</option>
                    <option value="launched">Launched</option>
                    <option value="growing">Growing</option>
                  </select>
                </label>

                <label className="field">
                  Target country or region
                  <input name="target_country" value={form.target_country} onChange={updateField} maxLength={100} placeholder="e.g. Pakistan, Lahore" />
                </label>

                <label className="field">
                  Available budget and currency
                  <input name="budget" value={form.budget} onChange={updateField} maxLength={100} placeholder="e.g. PKR 10,000; nearly zero" />
                </label>

                <label className="field">
                  Skills, team, tools and resources
                  <textarea name="resources" value={form.resources} onChange={updateField} maxLength={500} rows={2} placeholder="What can you do or access already?" />
                </label>

                <label className="field">
                  Business goal
                  <input name="business_goal" value={form.business_goal} onChange={updateField} maxLength={300} placeholder="e.g. validate demand for a first offer" />
                </label>

                <label className="field">
                  Implementation timeline
                  <input name="timeline" value={form.timeline} onChange={updateField} maxLength={100} placeholder="e.g. 30 days" />
                </label>

                <label className="field">
                  Customer problem
                  <textarea name="customer_problem" value={form.customer_problem} onChange={updateField} maxLength={1000} rows={2} placeholder="What problem do customers face today?" />
                </label>

                <label className="field">
                  Existing alternatives or workarounds
                  <textarea name="alternatives" value={form.alternatives} onChange={updateField} maxLength={1000} rows={2} placeholder="How do customers solve it now?" />
                </label>

                <label className="field">
                  Known competitors (optional)
                  <textarea name="competitors" value={form.competitors} onChange={updateField} maxLength={1000} rows={2} placeholder="Names or links you already know; otherwise leave blank." />
                </label>

                <label className="field">
                  Revenue or pricing model
                  <input name="revenue_model" value={form.revenue_model} onChange={updateField} maxLength={300} placeholder="e.g. one-time service fee; not decided" />
                </label>

                <label className="field">
                  Existing traction or feedback
                  <textarea name="traction" value={form.traction} onChange={updateField} maxLength={1000} rows={2} placeholder="Actual customers, sales, feedback, or state that you have none yet." />
                </label>

                <label className="field field-wide">
                  Current obstacles
                  <textarea name="challenges" value={form.challenges} onChange={updateField} maxLength={1000} rows={2} placeholder="What is stopping progress right now?" />
                </label>
              </div>

              <div className="form-footer">
                <p>AI-generated assessments are hypotheses until supported by evidence.</p>
                <button className="button button-primary button-large" disabled={loading} type="submit">
                  {loading ? 'Analyzing your ventureÃ¢â‚¬Â¦' : 'Analyze my venture Ã¢â€ â€”'}
                </button>
              </div>
            </form>

            {result && (
              <div className="report-section">
                <SectionTitle eyebrow="YOUR LATEST REPORT" title="The decision brief" description="Start with the most important finding, then explore the detailed sections." />
                <div className="report-grid">
                  <article className="report-card report-card-feature">
                    <span className="eyebrow">EXECUTIVE ASSESSMENT</span>
                    <h3>{result.executive_summary}</h3>
                    <p>{result.score_explanation}</p>
                    <Pill tone="pill-warning">Heuristic score Ã¢â‚¬â€ not a success probability</Pill>
                  </article>
                  <article className="report-card">
                    <span className="eyebrow">THE NEXT MOVE</span>
                    <h3>{result.immediate_next_action}</h3>
                    <p><strong>Biggest unknown:</strong> {result.biggest_unknown}</p>
                  </article>
                  <article className="report-card">
                    <span className="eyebrow">PRIORITY OPPORTUNITY</span>
                    <h3>{result.opportunity_priorities?.highest_priority || 'Review your opportunity priorities'}</h3>
                    <p>{result.opportunity_priorities?.reasoning}</p>
                  </article>
                </div>
                <button className="button button-primary" type="button" onClick={() => setActive('failure')}>Explore full Failure Map Ã¢â€ â€™</button>
              </div>
            )}
          </div>
        )}

        {active === 'failure' && (
          <div className="page-content">
            <SectionTitle eyebrow="02 / CHALLENGE THE IDEA" title="Failure & Opportunity Map" description="Find what could break the business, which assumptions matter most, and where evidence is missing." />
            {!result ? (
              <EmptyState title="Your map starts with an analysis" description="Complete the venture brief in Command Center to generate your first risk and opportunity assessment." action={<button className="button button-primary" onClick={() => setActive('command')} type="button">Go to venture brief</button>} />
            ) : (
              <>
                <div className="report-grid">
                  <article className="report-card">
                    <span className="eyebrow">MOST DANGEROUS ASSUMPTION</span>
                    <h3>{result.opportunity_priorities?.most_dangerous_assumption}</h3>
                    <p>Test this before making costly commitments.</p>
                  </article>
                  <article className="report-card">
                    <span className="eyebrow">CHEAPEST MEANINGFUL TEST</span>
                    <h3>{result.opportunity_priorities?.cheapest_meaningful_test}</h3>
                    <p>Prefer a real behavioral signal over compliments or hypothetical interest.</p>
                  </article>
                  <article className="report-card">
                    <span className="eyebrow">MISSING EVIDENCE</span>
                    <h3>{result.opportunity_priorities?.most_important_missing_evidence}</h3>
                    <p>{result.opportunity_priorities?.avoid_for_now}</p>
                  </article>
                </div>

                <ListBlock title="Ranked risks" items={risks} renderItem={risk => (
                  <>
                    <div className="card-topline"><Pill tone={risk.severity === 'high' ? 'pill-danger' : ''}>{risk.severity || 'Unranked'} severity</Pill><span className="muted">Likelihood: {risk.likelihood_estimate || 'Unknown'}</span></div>
                    <h4>{risk.risk}</h4>
                    <p>{risk.reason}</p>
                    <div className="detail-pair"><strong>Early warning</strong><span>{risk.early_warning_indicator}</span></div>
                    <div className="detail-pair"><strong>Mitigation</strong><span>{risk.mitigation}</span></div>
                    <div className="detail-pair"><strong>Evidence needed</strong><span>{risk.evidence_needed}</span></div>
                  </>
                )} />

                <ListBlock title="Critical assumptions" items={assumptions} renderItem={item => (
                  <>
                    <div className="card-topline"><Pill>{item.importance || 'Priority unknown'} importance</Pill><span className="muted">{item.current_status}</span></div>
                    <h4>{item.assumption}</h4>
                    <p><strong>Cheap test:</strong> {item.cheap_test}</p>
                  </>
                )} />

                <ListBlock title="Failure scenarios" items={result.failure_scenarios} renderItem={item => (
                  <>
                    <h4>{item.scenario}</h4>
                    <p><strong>Warning signs</strong></p><TextList items={item.warning_signs} />
                    <p><strong>Prevention:</strong> {item.prevention}</p>
                    <p><strong>Recovery action:</strong> {item.recovery_action}</p>
                  </>
                )} />

                <section className="content-block">
                  <h3>Customer & problem analysis</h3>
                  <div className="report-grid">
                    <article className="report-card"><span className="eyebrow">INITIAL SEGMENT</span><h4>{result.customer_analysis?.initial_segment}</h4><p>{result.customer_analysis?.problem_hypothesis}</p></article>
                    <article className="report-card"><span className="eyebrow">ADOPTION BARRIERS</span><TextList items={result.customer_analysis?.adoption_barriers} /></article>
                    <article className="report-card"><span className="eyebrow">CURRENT ALTERNATIVES</span><TextList items={result.customer_analysis?.current_alternatives} /></article>
                  </div>
                  <div className="list-card"><h4>Customer discovery questions</h4><TextList items={result.customer_analysis?.interview_questions} /></div>
                  <div className="list-card"><h4>Test willingness to pay</h4><p>{result.customer_analysis?.demand_validation_method}</p><TextList items={result.customer_analysis?.willingness_to_pay_questions} /></div>
                </section>

                <ListBlock title="Differentiation hypotheses" items={result.differentiation_opportunities} renderItem={item => (
                  <>
                    <h4>{item.hypothesis}</h4>
                    <p>{item.why_it_might_work}</p>
                    <div className="detail-pair"><strong>Test</strong><span>{item.how_to_test}</span></div>
                    <div className="detail-pair"><strong>Success signal</strong><span>{item.success_signal}</span></div>
                  </>
                )} />

                <ListBlock title="Alternative business models" items={result.alternative_models} renderItem={item => (
                  <>
                    <h4>{item.name}</h4>
                    <p>{item.offer}</p>
                    <div className="detail-pair"><strong>Customer</strong><span>{item.customer}</span></div>
                    <div className="detail-pair"><strong>Revenue model</strong><span>{item.revenue_model}</span></div>
                    <div className="detail-pair"><strong>Resources</strong><span>{item.resources_required}</span></div>
                    <div className="detail-pair"><strong>Advantage / trade-off</strong><span>{item.main_advantage} / {item.main_tradeoff}</span></div>
                    <div className="detail-pair"><strong>Cheap test</strong><span>{item.cheap_test}</span></div>
                    <div className="detail-pair"><strong>Decision signal</strong><span>Support: {item.supporting_evidence} Reject: {item.rejection_signal}</span></div>
                  </>
                )} />

                <section className="content-block">
                  <h3>Country-specific research checklist</h3>
                  <p className="muted">These are research tasks, not claims that live market research was performed.</p>
                  <ListBlock items={result.country_considerations} renderItem={item => (
                    <>
                      <div className="card-topline"><Pill>{item.evidence_status}</Pill></div>
                      <h4>{item.area}</h4><p>{item.current_assessment}</p>
                      <p><strong>How to verify:</strong> {item.how_to_verify}</p>
                    </>
                  )} />
                  <ListBlock title="Research questions" items={result.market_research_checklist} renderItem={item => (
                    <>
                      <h4>{item.question}</h4>
                      <p><strong>Source type:</strong> {item.recommended_source_type}</p>
                      <p><strong>Record:</strong> {item.what_to_record}</p>
                    </>
                  )} />
                </section>
              </>
            )}
          </div>
        )}

        {active === 'experiments' && (
          <div className="page-content">
            <SectionTitle eyebrow="03 / TEST BEFORE INVESTING" title="Experiment Lab" description="Run small, measurable tests. Record what actually happened; do not confuse a generated plan with real evidence." />
            {!result ? (
              <EmptyState title="No experiments yet" description="Generate a business analysis to receive tailored experiment plans." action={<button className="button button-primary" onClick={() => setActive('command')} type="button">Create analysis</button>} />
            ) : (
              <>
                <div className="summary-strip">
                  <div><span className="eyebrow">PLANNED</span><strong>{experimentList.length}</strong></div>
                  <div><span className="eyebrow">COMPLETED BY YOU</span><strong>{completedExperiments}</strong></div>
                  <div><span className="eyebrow">RULE</span><strong>Evidence first</strong></div>
                </div>

                {experimentList.map((item, index) => {
                  const record = experiments[index] || { status: 'Not started', notes: '', actualResult: '' };
                  return (
                    <article className="experiment-card" key={`${item.title}-${index}`}>
                      <div className="experiment-header">
                        <div><span className="eyebrow">EXPERIMENT 0{index + 1}</span><h3>{item.title}</h3></div>
                        <select aria-label={`Status for ${item.title}`} value={record.status} onChange={e => updateExperiment(index, 'status', e.target.value)}>
                          <option>Not started</option><option>In progress</option><option>Complete</option>
                        </select>
                      </div>
                      <div className="hypothesis-box"><span>HYPOTHESIS</span><p>{item.hypothesis}</p></div>
                      <div className="report-grid">
                        <div className="report-card"><h4>Who & what</h4><p><strong>Participants:</strong> {item.target_participants}</p><p><strong>Assumption:</strong> {item.assumption_tested}</p><p><strong>Materials:</strong></p><TextList items={item.materials} /></div>
                        <div className="report-card"><h4>Effort & measurement</h4><p><strong>Duration:</strong> {item.duration}</p><p><strong>Estimated cost:</strong> {item.estimated_cost}</p><p><strong>Metric:</strong> {item.metric}</p><p><strong>Decision threshold:</strong> {item.decision_threshold}</p></div>
                      </div>
                      <div className="list-card"><h4>Preparation</h4><TextList items={item.preparation_steps} /></div>
                      <div className="list-card"><h4>Execution steps</h4><TextList items={item.execution_steps} /></div>
                      {item.sample_script && <div className="script-box"><span className="eyebrow">SAMPLE SCRIPT Ã¢â‚¬â€ ADAPT BEFORE USING</span><p>{item.sample_script}</p><button className="button button-secondary" type="button" onClick={() => navigator.clipboard?.writeText(item.sample_script).then(() => setNotice('Sample script copied.')).catch(() => setNotice('Copy failed; select and copy the text manually.'))}>Copy script</button></div>}
                      <div className="report-grid interpretation-grid">
                        <div className="report-card"><h4>If positive</h4><p>{item.positive_interpretation}</p></div>
                        <div className="report-card"><h4>If negative</h4><p>{item.negative_interpretation}</p></div>
                        <div className="report-card"><h4>If inconclusive</h4><p>{item.inconclusive_interpretation}</p></div>
                      </div>
                      <div className="list-card"><h4>Possible confounding factors</h4><TextList items={item.confounding_factors} /><p><strong>Next recommended action:</strong> {item.next_action}</p></div>
                      <div className="form-grid experiment-record">
                        <label className="field field-wide">Actual results Ã¢â‚¬â€ what happened?
                          <textarea value={record.actualResult} onChange={e => updateExperiment(index, 'actualResult', e.target.value)} rows={3} placeholder="Record observed numbers, responses, behavior, and dates. Do not enter planned outcomes as results." />
                        </label>
                        <label className="field field-wide">Your observations and notes
                          <textarea value={record.notes} onChange={e => updateExperiment(index, 'notes', e.target.value)} rows={2} placeholder="What surprised you? What could have influenced the result?" />
                        </label>
                      </div>
                    </article>
                  );
                })}
                <div className="action-row">
                  <button className="button button-primary" onClick={() => { setAssistantQuestion('Interpret my recorded experiment results, identify evidence gaps, and recommend the next test.'); setActive('assistant'); }} type="button">Prepare result interpretation Ã¢â€ â€™</button>
                </div>
              </>
            )}
          </div>
        )}

        {active === 'growth' && (
          <div className="page-content">
            <SectionTitle eyebrow="04 / COMPETE & GROW" title="Growth Engine" description="Focus on a suitable position, a few acquisition channels, and a measurable next actionÃ¢â‚¬â€not every marketing tactic at once." />
            {!result ? (
              <EmptyState title="Growth strategy not generated yet" description="Run your venture analysis to receive a strategy tailored to your business." action={<button className="button button-primary" onClick={() => setActive('command')} type="button">Create analysis</button>} />
            ) : (
              <>
                <div className="hero-panel growth-hero">
                  <span className="eyebrow">RECOMMENDED POSITIONING</span>
                  <h2>{growth.positioning || 'Positioning will appear in your analysis.'}</h2>
                  <p>{growth.value_proposition}</p>
                  <div className="detail-pair"><strong>Initial customer</strong><span>{growth.initial_customer_segment}</span></div>
                </div>

                <ListBlock title="Messaging hypotheses to test" items={growth.messaging_hypotheses} />
                <ListBlock title="Customer acquisition channels" items={growth.acquisition_channels} renderItem={item => (
                  <>
                    <h4>{item.channel}</h4><p>{item.why_it_fits}</p>
                    <p><strong>First-week plan</strong></p><TextList items={item.first_week_steps} />
                    <div className="detail-pair"><strong>Metric</strong><span>{item.metric}</span></div>
                    <div className="detail-pair"><strong>Continue if</strong><span>{item.continue_if}</span></div>
                    <div className="detail-pair"><strong>Change if</strong><span>{item.change_if}</span></div>
                    <div className="detail-pair"><strong>Cost</strong><span>{item.cost_note}</span></div>
                  </>
                )} />
                <ListBlock title="Pricing hypotheses" items={growth.pricing_hypotheses} />
                <div className="list-card"><h4>Test willingness to pay</h4><p>{growth.willingness_to_pay_test}</p></div>
                <div className="list-card"><h4>Retention approach</h4><p>{growth.retention_approach}</p></div>
                <ListBlock title="Prioritized growth actions" items={growth.priority_actions} renderItem={item => (
                  <>
                    <h4>{item.action}</h4><p>{item.reason}</p>
                    <div className="detail-pair"><strong>Effort / cost</strong><span>{item.effort} / {item.cost}</span></div>
                    <div className="detail-pair"><strong>Expected learning</strong><span>{item.expected_learning}</span></div>
                    <div className="detail-pair"><strong>Success metric</strong><span>{item.success_metric}</span></div>
                    <div className="detail-pair"><strong>Next step</strong><span>{item.next_step}</span></div>
                  </>
                )} />
              </>
            )}
          </div>
        )}

        {active === 'roadmap' && (
          <div className="page-content">
            <SectionTitle eyebrow="05 / EXECUTION" title="Your 30 / 60 / 90-day roadmap" description="A working checklistÃ¢â‚¬â€not a promise of revenue or growth. Tick off milestones only when you actually complete them." />
            {!result ? (
              <EmptyState title="Roadmap not ready" description="Generate a business analysis first." action={<button className="button button-primary" onClick={() => setActive('command')} type="button">Create analysis</button>} />
            ) : (
              <>
                <div className="summary-strip"><div><span className="eyebrow">COMPLETED MILESTONES</span><strong>{completedMilestones}</strong></div><div><span className="eyebrow">ROADMAP PHASES</span><strong>{roadmap.length}</strong></div><div><span className="eyebrow">BASIS</span><strong>Evidence-led</strong></div></div>
                {roadmap.map((phase, phaseIndex) => (
                  <section className="roadmap-phase" key={`${phase.phase}-${phaseIndex}`}>
                    <div className="phase-heading"><span className="phase-number">0{phaseIndex + 1}</span><div><span className="eyebrow">EXECUTION PHASE</span><h3>{phase.phase}</h3><p>{phase.objective}</p></div></div>
                    <div className="roadmap-list">
                      {(phase.milestones || []).map((milestone, milestoneIndex) => {
                        const key = `${phaseIndex}-${milestoneIndex}`;
                        const checked = Boolean(roadmapProgress[key]);
                        return (
                          <article className={`roadmap-item ${checked ? 'roadmap-done' : ''}`} key={key}>
                            <label className="roadmap-check">
                              <input type="checkbox" checked={checked} onChange={e => setRoadmapProgress(previous => ({ ...previous, [key]: e.target.checked }))} />
                              <span className="custom-check" />
                            </label>
                            <div className="roadmap-copy">
                              <h4>{milestone.task}</h4>
                              <p>{milestone.instructions?.join(' ')}</p>
                              <div className="detail-pair"><strong>Resources</strong><span>{milestone.resources?.join(', ')}</span></div>
                              <div className="detail-pair"><strong>Dependency / effort</strong><span>{milestone.dependency} / {milestone.effort}</span></div>
                              <div className="detail-pair"><strong>Metric</strong><span>{milestone.metric}</span></div>
                              <div className="detail-pair"><strong>Completion criteria</strong><span>{milestone.completion_criteria}</span></div>
                              <div className="detail-pair"><strong>Decision checkpoint</strong><span>{milestone.decision_checkpoint}</span></div>
                              <div className="decision-pair"><p><strong>If successful:</strong> {milestone.if_successful}</p><p><strong>If unsuccessful:</strong> {milestone.if_unsuccessful}</p></div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
        )}

        {active === 'evidence' && (
          <div className="page-content">
            <SectionTitle eyebrow="06 / WHAT DO YOU ACTUALLY KNOW?" title="Evidence Ledger" description="Track observations, sources, confidence, and what each finding supports or challenges. AI-generated hypotheses are not customer evidence." />
            <div className="evidence-note"><strong>Storage note</strong><p>Entries are saved locally in this browser. They are not uploaded to a cloud database. Export your workspace regularly if you need a separate backup.</p></div>

            <form className="form-panel" onSubmit={addEvidence}>
              <div className="panel-heading"><div><span className="eyebrow">NEW ENTRY</span><h3>Record what you learned</h3></div></div>
              <div className="form-grid">
                <label className="field field-wide">Observation or finding *
                  <textarea value={evidenceForm.observation} onChange={e => setEvidenceForm(p => ({ ...p, observation: e.target.value }))} required rows={3} placeholder="What was observed, said, measured, or discovered?" />
                </label>
                <label className="field">Source or method
                  <input value={evidenceForm.source} onChange={e => setEvidenceForm(p => ({ ...p, source: e.target.value }))} placeholder="e.g. customer interview, official report" />
                </label>
                <label className="field">Evidence type
                  <select value={evidenceForm.type} onChange={e => setEvidenceForm(p => ({ ...p, type: e.target.value }))}>
                    <option>User observation</option><option>Interview feedback</option><option>Experiment result</option><option>Publicly sourced information</option><option>AI-generated hypothesis</option><option>Estimate</option><option>Unknown</option>
                  </select>
                </label>
                <label className="field">Confidence
                  <select value={evidenceForm.confidence} onChange={e => setEvidenceForm(p => ({ ...p, confidence: e.target.value }))}><option>Low</option><option>Medium</option><option>High</option></select>
                </label>
                <label className="field">Relationship to hypothesis
                  <select value={evidenceForm.relation} onChange={e => setEvidenceForm(p => ({ ...p, relation: e.target.value }))}><option>Supports</option><option>Contradicts</option><option>Inconclusive</option><option>Not assessed</option></select>
                </label>
                <label className="field field-wide">Related hypothesis
                  <input value={evidenceForm.relatedHypothesis} onChange={e => setEvidenceForm(p => ({ ...p, relatedHypothesis: e.target.value }))} placeholder="Which assumption or experiment does this relate to?" />
                </label>
                <label className="field field-wide">Context and follow-up
                  <textarea value={evidenceForm.notes} onChange={e => setEvidenceForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Date, limitations, possible bias, and what to check next." />
                </label>
              </div>
              <div className="form-footer"><p>Only record evidence you actually observed or sourced.</p><button className="button button-primary" type="submit">Save evidence entry</button></div>
            </form>

            <div className="content-block">
              <div className="section-inline"><h3>Recorded evidence</h3><span className="muted">{evidence.length} entries</span></div>
              {!evidence.length ? <EmptyState title="No evidence recorded yet" description="After an interview, test, or research task, record the observation here." /> : (
                <div className="stack">
                  {evidence.map(item => (
                    <article className="evidence-card" key={item.id}>
                      <div className="card-topline"><Pill>{item.type}</Pill><span className="muted">{item.date}</span></div>
                      <h4>{item.observation}</h4>
                      <div className="detail-pair"><strong>Source</strong><span>{item.source || 'Not specified'}</span></div>
                      <div className="detail-pair"><strong>Confidence</strong><span>{item.confidence}</span></div>
                      <div className="detail-pair"><strong>Relationship</strong><span>{item.relation}</span></div>
                      {item.relatedHypothesis && <div className="detail-pair"><strong>Hypothesis</strong><span>{item.relatedHypothesis}</span></div>}
                      {item.notes && <p>{item.notes}</p>}
                      <button className="text-button" type="button" onClick={() => setEvidence(previous => previous.filter(entry => entry.id !== item.id))}>Delete entry</button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {active === 'assistant' && (
          <div className="page-content">
            <SectionTitle eyebrow="07 / CONTEXTUAL BUSINESS ASSISTANT" title="Your AI workspace" description="Ask follow-up questions about your current analysis, actual experiment records, saved evidence, and roadmap progress." />
            {!result ? (
              <EmptyState title="Give your assistant some context" description="Generate a business analysis first. The assistant will then use that report and any evidence or progress you record." action={<button className="button button-primary" onClick={() => setActive('command')} type="button">Create analysis</button>} />
            ) : (
              <>
                <div className="assistant-context">
                  <span className="eyebrow">CURRENT VENTURE</span>
                  <h3>{form.idea.slice(0, 140)}{form.idea.length > 140 ? 'Ã¢â‚¬Â¦' : ''}</h3>
                  <div className="context-tags"><Pill>{form.stage}</Pill><Pill>{form.target_country || 'Country not specified'}</Pill><Pill>{evidence.length} evidence entries</Pill></div>
                </div>
                <form className="form-panel assistant-form" onSubmit={askAssistant}>
                  <label className="field">What decision or problem should we work on?
                    <textarea value={assistantQuestion} onChange={e => setAssistantQuestion(e.target.value)} required rows={4} placeholder="e.g. My first experiment got no responses. Help me identify possible causes and design the next test." />
                  </label>
                  <div className="suggestion-list">
                    {[
                      'How can I get my first customers without paid ads?',
                      'Which assumptions are still unverified?',
                      'Turn my next milestone into a daily action plan.',
                      'Compare my recorded evidence with my original assumptions.',
                    ].map(question => <button key={question} className="suggestion-chip" type="button" onClick={() => setAssistantQuestion(question)}>{question}</button>)}
                  </div>
                  <div className="form-footer"><p>Uses the current business report and locally recorded workspace data.</p><button className="button button-primary" disabled={assistantLoading} type="submit">{assistantLoading ? 'ThinkingÃ¢â‚¬Â¦' : 'Ask FailureFirst AI Ã¢â€ â€”'}</button></div>
                </form>

                {assistantAnswer && (
                  <article className="assistant-response">
                    <span className="eyebrow">WORKSPACE RESPONSE</span>
                    <h3>{assistantAnswer.answer || assistantAnswer.interpretation || 'Analysis response'}</h3>
                    {assistantAnswer.reasoning && <p>{assistantAnswer.reasoning}</p>}
                    {assistantAnswer.result_quality && <Pill>{assistantAnswer.result_quality} evidence quality</Pill>}
                    <ListBlock title="Recommended actions" items={assistantAnswer.recommended_actions || assistantAnswer.next_actions} renderItem={item => (
                      typeof item === 'string' ? item : (
                        <>
                          <h4>{item.action || item}</h4>
                          {item.instructions && <TextList items={item.instructions} />}
                          {item.success_metric && <p><strong>Success metric:</strong> {item.success_metric}</p>}
                          {item.next_step && <p><strong>Next step:</strong> {item.next_step}</p>}
                        </>
                      )
                    )} />
                    {assistantAnswer.what_the_evidence_supports && <ListBlock title="What the evidence supports" items={assistantAnswer.what_the_evidence_supports} />}
                    {assistantAnswer.what_it_does_not_support && <ListBlock title="What the evidence does not support" items={assistantAnswer.what_it_does_not_support} />}
                    {assistantAnswer.evidence_used && <ListBlock title="Evidence considered" items={assistantAnswer.evidence_used} />}
                    {assistantAnswer.assumptions && <ListBlock title="Assumptions" items={assistantAnswer.assumptions} />}
                    {assistantAnswer.unknowns && <ListBlock title="Unknowns to resolve" items={assistantAnswer.unknowns} />}
                    {assistantAnswer.recommended_decision && <div className="decision-banner"><span className="eyebrow">SUGGESTED DECISION</span><h4>{assistantAnswer.recommended_decision.replaceAll('_', ' ')}</h4><p>{assistantAnswer.next_experiment}</p></div>}
                  </article>
                )}
              </>
            )}
          </div>
        )}

        <footer className="app-footer">
          <span>FAILUREFIRST AI Ã‚Â· VENTURE INTELLIGENCE</span>
          <span>Hypotheses are not evidence. Decisions improve when learning is recorded.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

