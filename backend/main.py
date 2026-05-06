from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: F401 – ensure models are registered
from routers import hcps, interactions, chat
from pathlib import Path
from dotenv import load_dotenv
import os, json

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ── Create tables ─────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-First CRM – HCP Module",
    description="LangGraph-powered CRM for pharmaceutical field representatives.",
    version="1.0.0",
)

# Allow Vercel frontend URL in production; wildcard in dev
_frontend_url = os.getenv("FRONTEND_URL", "")
_origins = [_frontend_url] if _frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # covers all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(hcps.router)
app.include_router(interactions.router)
app.include_router(chat.router)


# ── Seed data ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
def seed_data():
    """Seed the database with sample HCPs if empty."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(models.HCP).count() == 0:
            sample_hcps = [
                models.HCP(name="Dr. Sarah Mitchell", specialty="Oncology", hospital="Memorial Cancer Center", email="s.mitchell@memorialcc.org", phone="+1-555-0101", territory="North-East"),
                models.HCP(name="Dr. James Patel", specialty="Cardiology", hospital="St. Luke's Heart Institute", email="j.patel@stlukes.org", phone="+1-555-0102", territory="Mid-West"),
                models.HCP(name="Dr. Emily Chen", specialty="Neurology", hospital="Pacific Neuro Center", email="e.chen@pacificneuro.com", phone="+1-555-0103", territory="West"),
                models.HCP(name="Dr. Robert Walsh", specialty="Internal Medicine", hospital="General City Hospital", email="r.walsh@gch.org", phone="+1-555-0104", territory="South"),
                models.HCP(name="Dr. Priya Sharma", specialty="Endocrinology", hospital="Diabetes & Hormone Center", email="p.sharma@dhc.org", phone="+1-555-0105", territory="North-East"),
            ]
            db.add_all(sample_hcps)
            db.commit()
            db.flush()

            # Add sample interactions
            hcps = db.query(models.HCP).all()
            sample_interactions = [
                models.Interaction(hcp_id=hcps[0].id, rep_name="Alex Johnson", date="2026-04-15", interaction_type="visit", notes="Discussed Phase III oncology trial data for DRUGTX-001. Dr. Mitchell expressed strong interest in enrolling patients.", ai_summary="Productive in-office visit discussing Phase III trial data. HCP showed high interest in patient enrollment.", sentiment="positive", next_action="Send detailed trial enrollment packet within 3 days.", products_discussed="DRUGTX-001"),
                models.Interaction(hcp_id=hcps[1].id, rep_name="Alex Johnson", date="2026-04-20", interaction_type="call", notes="Quick check-in call. Dr. Patel mentioned he has been seeing good outcomes with CardioPro. Requested updated literature.", ai_summary="Brief follow-up call confirming positive outcomes with CardioPro. HCP requested updated clinical literature.", sentiment="positive", next_action="Email updated clinical literature and schedule an office visit.", products_discussed="CardioPro"),
                models.Interaction(hcp_id=hcps[2].id, rep_name="Alex Johnson", date="2026-04-22", interaction_type="conference", notes="Met Dr. Chen at the Neurology Summit. She raised concerns about side effects of NeuroMax in elderly patients.", ai_summary="Conference meeting where HCP raised safety concerns about NeuroMax in elderly patients. Requires follow-up.", sentiment="neutral", next_action="Prepare safety data booklet for elderly patient use and schedule a dedicated meeting.", products_discussed="NeuroMax"),
                models.Interaction(hcp_id=hcps[3].id, rep_name="Alex Johnson", date="2026-04-28", interaction_type="email", notes="Sent Dr. Walsh the latest clinical guidelines and introduced our new formulary update.", ai_summary="Email outreach sharing updated clinical guidelines and formulary changes.", sentiment="neutral", next_action="Follow up with a phone call to gauge interest and answer questions.", products_discussed="General Formulary"),
                models.Interaction(hcp_id=hcps[4].id, rep_name="Alex Johnson", date="2026-05-01", interaction_type="visit", notes="Dr. Sharma was very receptive to new DiabetoMed data. She currently prescribes competitor products but is open to switching.", ai_summary="In-office visit presenting DiabetoMed data. HCP currently prescribes competitor but showed openness to switching.", sentiment="positive", next_action="Provide samples and organize a lunch-and-learn session for her team.", products_discussed="DiabetoMed"),
            ]
            db.add_all(sample_interactions)
            db.commit()
    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "healthy", "service": "AI-First CRM HCP Module"}


@app.get("/tools")
def list_tools():
    """Return metadata about all available LangGraph tools."""
    return {
        "tools": [
            {
                "name": "log_interaction",
                "description": "Log a new HCP interaction with AI-generated summary, sentiment, and next action recommendation.",
                "parameters": ["hcp_name", "rep_name", "interaction_type", "notes", "date", "products_discussed", "outcome"],
            },
            {
                "name": "edit_interaction",
                "description": "Edit an existing logged interaction. Re-generates AI summary if notes are updated.",
                "parameters": ["interaction_id", "notes", "interaction_type", "date", "products_discussed", "outcome", "regenerate_summary"],
            },
            {
                "name": "get_hcp_profile",
                "description": "Retrieve complete HCP profile with interaction history and AI engagement summary.",
                "parameters": ["hcp_name", "hcp_id"],
            },
            {
                "name": "suggest_next_action",
                "description": "Get AI-powered next-step recommendations for a specific HCP based on interaction history.",
                "parameters": ["hcp_name", "hcp_id"],
            },
            {
                "name": "analyze_interaction_history",
                "description": "Analyze territory-wide or HCP-specific interaction trends, sentiment, and performance.",
                "parameters": ["territory", "hcp_name", "from_date", "to_date"],
            },
        ]
    }
