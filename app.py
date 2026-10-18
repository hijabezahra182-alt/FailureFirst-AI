
import json
import os
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai

load_dotenv()

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

app = FastAPI(
    title="FailureFirst AI",
    description=(
        "Evidence-aware venture intelligence, "
        "business validation and execution planning."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class IdeaRequest(BaseModel):
    idea: str = Field(min_length=10, max_length=3000)
    audience: str = Field(min_length=2, max_length=300)
    stage: Literal[
        "idea", "research", "prototype", "launched", "growing"
    ] = "idea"

    target_country: str = Field(default="Not decided", max_length=100)
    budget: str = Field(default="Not specified", max_length=100)
    resources: str = Field(default="Not specified", max_length=500)
    business_goal: str = Field(default="Not specified", max_length=300)
    timeline: str = Field(default="Not specified", max_length=100)
    challenges: str = Field(default="Not specified", max_length=1000)

    customer_problem: str = Field(default="Not specified", max_length=1000)
    alternatives: str = Field(default="Not specified", max_length=1000)
    competitors: str = Field(default="Not researched", max_length=1000)
    revenue_model: str = Field(default="Not decided", max_length=300)
    traction: str = Field(default="No evidence provided", max_length=1000)


class FollowUpRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    business_context: dict[str, Any] = Field(default_factory=dict)
    evidence: list[dict[str, Any]] = Field(default_factory=list, max_length=100)
    experiments: list[dict[str, Any]] = Field(default_factory=list, max_length=50)
    roadmap_progress: list[dict[str, Any]] = Field(
        default_factory=list, max_length=100
    )


SYSTEM_PROMPT = """
You are FailureFirst AI, a rigorous startup strategist and business
validation specialist. Your job is to help founders make better decisions
before wasting money, time, or effort.

Be specific, practical, skeptical, evidence-aware, and useful to beginners.
Do not behave like a generic chatbot or motivational coach.

CORE RULES
1. Never invent interviews, customer feedback, sales, traction, experiments,
   market statistics, competitors, prices, regulations, or research findings.
2. Separate user-provided facts, hypotheses, estimates, and unknowns.
3. No live web research is available through this endpoint. Do not claim
   that you searched the web or verified current market conditions.
4. Treat the viability score as a directional heuristic, NOT a probability
   of success or a scientifically validated prediction.
5. Tailor all advice to the user's actual country, budget, skills, stage,
   timeline, customer, and constraints.
6. Prioritize cheap, ethical, reversible experiments.
7. Never recommend spending heavily before testing important assumptions.
8. Do not assume every business is a SaaS company or needs subscriptions.
9. Give concrete procedures, measurable thresholds, and next steps.
10. Avoid false precision. Mark estimated costs as estimates and state when
    local prices or currency need verification.
11. A generated hypothesis is not actual customer evidence.
12. Be candid when an idea has serious weaknesses. Explain how to test them.

Return valid JSON only. Do not include Markdown fences or text outside JSON.

Use exactly this general structure. Arrays should contain useful objects,
not placeholder strings. Keep the report detailed but practical.

{
  "executive_summary": "string",
  "viability_score": 0,
  "score_explanation": "string",
  "score_factors": [
    {"factor": "string", "assessment": "string", "evidence_status": "fact | hypothesis | unknown"}
  ],
  "key_strengths": [
    {"strength": "string", "reason": "string"}
  ],
  "top_risks": [
    {
      "risk": "string",
      "severity": "high | medium | low",
      "likelihood_estimate": "high | medium | low | unknown",
      "reason": "string",
      "early_warning_indicator": "string",
      "mitigation": "string",
      "evidence_needed": "string"
    }
  ],
  "assumptions": [
    {
      "assumption": "string",
      "importance": "high | medium | low",
      "current_status": "unverified | partially supported | supported | contradicted",
      "cheap_test": "string"
    }
  ],
  "failure_scenarios": [
    {
      "scenario": "string",
      "warning_signs": ["string"],
      "prevention": "string",
      "recovery_action": "string"
    }
  ],
  "customer_analysis": {
    "initial_segment": "string",
    "problem_hypothesis": "string",
    "current_alternatives": ["string"],
    "adoption_barriers": ["string"],
    "willingness_to_pay_questions": ["string"],
    "interview_questions": ["string"],
    "demand_validation_method": "string"
  },
  "differentiation_opportunities": [
    {
      "hypothesis": "string",
      "why_it_might_work": "string",
      "how_to_test": "string",
      "success_signal": "string"
    }
  ],
  "alternative_models": [
    {
      "name": "string",
      "customer": "string",
      "offer": "string",
      "revenue_model": "string",
      "resources_required": "string",
      "main_advantage": "string",
      "main_tradeoff": "string",
      "cheap_test": "string",
      "supporting_evidence": "string",
      "rejection_signal": "string"
    }
  ],
  "opportunity_priorities": {
    "highest_priority": "string",
    "most_dangerous_assumption": "string",
    "cheapest_meaningful_test": "string",
    "most_important_missing_evidence": "string",
    "avoid_for_now": "string",
    "reasoning": "string"
  },
  "growth_strategy": {
    "positioning": "string",
    "initial_customer_segment": "string",
    "value_proposition": "string",
    "messaging_hypotheses": ["string"],
    "acquisition_channels": [
      {
        "channel": "string",
        "why_it_fits": "string",
        "first_week_steps": ["string"],
        "metric": "string",
        "continue_if": "string",
        "change_if": "string",
        "cost_note": "string"
      }
    ],
    "pricing_hypotheses": ["string"],
    "willingness_to_pay_test": "string",
    "retention_approach": "string",
    "priority_actions": [
      {
        "action": "string",
        "reason": "string",
        "effort": "string",
        "cost": "string",
        "expected_learning": "string",
        "success_metric": "string",
        "next_step": "string"
      }
    ]
  },
  "country_considerations": [
    {
      "area": "string",
      "current_assessment": "string",
      "evidence_status": "hypothesis | unknown | user-provided",
      "how_to_verify": "string"
    }
  ],
  "market_research_checklist": [
    {
      "question": "string",
      "recommended_source_type": "string",
      "what_to_record": "string"
    }
  ],
  "experiments": [
    {
      "title": "string",
      "hypothesis": "string",
      "assumption_tested": "string",
      "target_participants": "string",
      "materials": ["string"],
      "preparation_steps": ["string"],
      "execution_steps": ["string"],
      "sample_script": "string",
      "duration": "string",
      "estimated_cost": "string",
      "metric": "string",
      "decision_threshold": "string",
      "confounding_factors": ["string"],
      "positive_interpretation": "string",
      "negative_interpretation": "string",
      "inconclusive_interpretation": "string",
      "next_action": "string"
    }
  ],
  "first_48_hours": [
    {
      "task": "string",
      "instructions": ["string"],
      "time_estimate": "string",
      "deliverable": "string",
      "success_criteria": "string"
    }
  ],
  "roadmap_30_60_90": [
    {
      "phase": "Days 1-30 | Days 31-60 | Days 61-90",
      "objective": "string",
      "milestones": [
        {
          "task": "string",
          "instructions": ["string"],
          "resources": ["string"],
          "dependency": "string",
          "effort": "string",
          "metric": "string",
          "completion_criteria": "string",
          "decision_checkpoint": "string",
          "if_successful": "string",
          "if_unsuccessful": "string"
        }
      ]
    }
  ],
  "biggest_unknown": "string",
  "immediate_next_action": "string",
  "evidence_boundaries": {
    "user_provided_facts": ["string"],
    "generated_hypotheses": ["string"],
    "estimates": ["string"],
    "unknowns_to_verify": ["string"],
    "live_research_performed": false
  }
}

QUALITY REQUIREMENTS
- Generate 3 practical experiments, 2-3 relevant alternative models,
  3-5 major risks, 3-5 assumptions, and a focused roadmap.
- Give examples and step-by-step instructions rather than vague advice.
- Prefer the smallest meaningful test with the highest learning value.
- Do not guarantee customer numbers, revenue, profitability, or success.
- Adapt the roadmap to the existing business stage; do not force a launched
  business to restart at the idea stage.
- If country-specific evidence is missing, state that it must be verified.
- Keep JSON types consistent with the schema.
"""


def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI is not configured. Add GEMINI_API_KEY to the backend "
                ".env file and restart the backend."
            ),
        )
    return genai.Client(api_key=api_key)


def generate_json(system_instruction: str, prompt: str) -> dict[str, Any]:
    try:
        client = get_client()
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "temperature": 0.25,
            },
        )

        if not response.text:
            raise ValueError("The AI returned an empty response.")

        result = json.loads(response.text)

        if not isinstance(result, dict):
            raise ValueError("The AI response was not a JSON object.")

        return result

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="The AI returned an invalid structured response. Please retry.",
        )
    except Exception as exc:
        # Avoid returning internal errors or credentials to the frontend.
        print(f"FailureFirst AI provider error: {type(exc).__name__}")
        raise HTTPException(
            status_code=502,
            detail=(
                "AI analysis failed. Check the backend terminal, API key, "
                "provider model availability, and API quota."
            ),
        )


@app.get("/")
def home():
    return {
        "app": "FailureFirst AI",
        "status": "online",
        "message": "Venture intelligence API is ready.",
        "version": "2.0.0",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_configured": bool(os.getenv("GEMINI_API_KEY")),
        "model": MODEL_NAME,
    }


@app.post("/api/analyze")
def analyze_idea(request: IdeaRequest):
    prompt = f"""
Analyze the following business using the FailureFirst AI framework.

BUSINESS IDEA:
{request.idea}

INTENDED AUDIENCE:
{request.audience}

CURRENT STAGE:
{request.stage}

TARGET COUNTRY OR REGION:
{request.target_country}

AVAILABLE BUDGET:
{request.budget}

SKILLS, TEAM, TOOLS AND RESOURCES:
{request.resources}

BUSINESS GOAL:
{request.business_goal}

IMPLEMENTATION TIMELINE:
{request.timeline}

CURRENT CHALLENGES:
{request.challenges}

CUSTOMER PROBLEM:
{request.customer_problem}

KNOWN ALTERNATIVES:
{request.alternatives}

KNOWN COMPETITORS:
{request.competitors}

CURRENT REVENUE MODEL:
{request.revenue_model}

TRACTION AND CUSTOMER EVIDENCE:
{request.traction}

Create a personalized assessment. Do not treat missing information as fact.
If traction is not provided, say that traction evidence is unavailable.

Prioritize:
1. The single most important decision the founder must make.
2. A practical and honest viability assessment.
3. Specific customer discovery and differentiation hypotheses.
4. Three low-cost experiments with clear procedures and decision criteria.
5. Suitable acquisition channels and first-week actions.
6. Two or three relevant alternative business models.
7. An adaptive roadmap with achievable learning milestones.
8. Country-specific questions requiring verification.

The user has limited resources unless they state otherwise. Do not assume
access to a large team, paid advertising, or expensive software.

Return every required section in the specified JSON structure.
"""

    result = generate_json(SYSTEM_PROMPT, prompt)

    required = [
        "executive_summary",
        "viability_score",
        "score_explanation",
        "top_risks",
        "assumptions",
        "failure_scenarios",
        "customer_analysis",
        "differentiation_opportunities",
        "alternative_models",
        "opportunity_priorities",
        "growth_strategy",
        "country_considerations",
        "market_research_checklist",
        "experiments",
        "first_48_hours",
        "roadmap_30_60_90",
        "biggest_unknown",
        "immediate_next_action",
        "evidence_boundaries",
    ]

    missing = [key for key in required if key not in result]
    if missing:
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI response was incomplete. Missing sections: "
                + ", ".join(missing)
                + ". Please run the analysis again."
            ),
        )

    try:
        score = int(result["viability_score"])
        result["viability_score"] = max(0, min(100, score))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=502,
            detail="The AI returned an invalid viability score. Please retry.",
        )

    # Compatibility with existing frontend components.
    result["score_is_probability"] = False
    result["analysis_source"] = "gemini"
    result["model"] = MODEL_NAME

    return result


@app.post("/api/assistant")
def contextual_assistant(request: FollowUpRequest):
    prompt = f"""
Answer the founder's question using the supplied business workspace.

FOUNDER QUESTION:
{request.question}

BUSINESS CONTEXT:
{json.dumps(request.business_context, ensure_ascii=False)[:12000]}

RECORDED EXPERIMENTS:
{json.dumps(request.experiments, ensure_ascii=False)[:10000]}

USER-RECORDED EVIDENCE:
{json.dumps(request.evidence, ensure_ascii=False)[:12000]}

ROADMAP PROGRESS:
{json.dumps(request.roadmap_progress, ensure_ascii=False)[:8000]}

Requirements:
- Answer the actual question first.
- Use recorded evidence where relevant.
- Distinguish actual user-recorded observations from AI hypotheses.
- Never invent results for experiments that have not been completed.
- Give concrete next steps, relevant metrics, and decision criteria.
- If the evidence is insufficient, say what is missing.
- Do not claim live web research was performed.

Return valid JSON with this structure:
{{
  "answer": "string",
  "reasoning": "string",
  "recommended_actions": [
    {{
      "action": "string",
      "instructions": ["string"],
      "success_metric": "string",
      "next_step": "string"
    }}
  ],
  "evidence_used": ["string"],
  "assumptions": ["string"],
  "unknowns": ["string"]
}}
"""

    return generate_json(
        "You are the contextual FailureFirst AI business assistant. "
        "Be evidence-aware, specific, practical, and honest. Return JSON only.",
        prompt,
    )


@app.post("/api/interpret-experiment")
def interpret_experiment(request: FollowUpRequest):
    prompt = f"""
Interpret the founder's actual experiment results.

BUSINESS CONTEXT:
{json.dumps(request.business_context, ensure_ascii=False)[:8000]}

EXPERIMENT RECORDS:
{json.dumps(request.experiments, ensure_ascii=False)[:12000]}

USER-RECORDED EVIDENCE:
{json.dumps(request.evidence, ensure_ascii=False)[:12000]}

QUESTION:
{request.question}

Do not assume an experiment succeeded simply because it is marked complete.
Use the actual recorded metrics and notes. If results are absent, explain
what must be recorded before drawing a conclusion. Discuss confounding
factors and recommend a next test.

Return valid JSON:
{{
  "interpretation": "string",
  "result_quality": "strong | limited | insufficient",
  "what_the_evidence_supports": ["string"],
  "what_it_does_not_support": ["string"],
  "possible_confounders": ["string"],
  "recommended_decision": "continue | revise | stop | collect_more_evidence",
  "next_experiment": "string",
  "next_actions": ["string"]
}}
"""

    return generate_json(
        "You are an experiment-analysis specialist. Never fabricate evidence. "
        "Return valid JSON only.",
        prompt,
    )
