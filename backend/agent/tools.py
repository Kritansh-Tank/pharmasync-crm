"""
LangGraph Tools for the HCP CRM Agent.
Defines 5 tools for sales-related HCP interaction management.
"""
import json
from typing import Optional
from langchain_core.tools import tool
from database import SessionLocal
import models
from agent.llm import call_llm
from datetime import datetime


def get_db_session():
    return SessionLocal()


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 1: log_interaction
# ─────────────────────────────────────────────────────────────────────────────
@tool
def log_interaction(
    hcp_name: str,
    rep_name: str,
    interaction_type: str,
    notes: str,
    date: Optional[str] = None,
    products_discussed: Optional[str] = None,
    outcome: Optional[str] = None,
) -> str:
    """
    Log a new interaction with an HCP (Healthcare Professional).
    Uses the LLM to generate a professional summary, extract sentiment,
    and recommend a next action. Creates the record in the database.

    Args:
        hcp_name: Full name of the HCP
        rep_name: Name of the field rep logging the interaction
        interaction_type: Type of interaction (visit, call, email, conference)
        notes: Raw interaction notes
        date: Date in YYYY-MM-DD format (defaults to today)
        products_discussed: Comma-separated product names discussed
        outcome: Outcome of the interaction
    """
    db = get_db_session()
    try:
        # Find or create HCP
        hcp = db.query(models.HCP).filter(
            models.HCP.name.ilike(f"%{hcp_name}%")
        ).first()

        if not hcp:
            hcp = models.HCP(name=hcp_name)
            db.add(hcp)
            db.flush()

        interaction_date = date or datetime.utcnow().strftime("%Y-%m-%d")

        # AI: generate summary, sentiment, and next action
        ai_prompt = f"""You are a pharmaceutical CRM assistant. Analyze this HCP interaction and return a JSON object.

HCP: {hcp_name}
Rep: {rep_name}
Type: {interaction_type}
Date: {interaction_date}
Products discussed: {products_discussed or 'Not specified'}
Outcome: {outcome or 'Not specified'}
Notes: {notes}

Return ONLY valid JSON with these keys:
- "summary": A 2-3 sentence professional summary of the interaction
- "sentiment": One of "positive", "neutral", or "negative"
- "next_action": A specific recommended next action for the rep

JSON:"""

        ai_response = call_llm(ai_prompt)

        # Parse AI JSON safely
        try:
            # Extract JSON block if present
            if "```json" in ai_response:
                ai_response = ai_response.split("```json")[1].split("```")[0].strip()
            elif "```" in ai_response:
                ai_response = ai_response.split("```")[1].split("```")[0].strip()
            ai_data = json.loads(ai_response)
        except Exception:
            ai_data = {
                "summary": f"Interaction with {hcp_name} on {interaction_date} via {interaction_type}. Notes: {notes[:200]}",
                "sentiment": "neutral",
                "next_action": "Schedule a follow-up within 2 weeks.",
            }

        # Save interaction
        interaction = models.Interaction(
            hcp_id=hcp.id,
            rep_name=rep_name,
            date=interaction_date,
            interaction_type=interaction_type,
            notes=notes,
            ai_summary=ai_data.get("summary"),
            sentiment=ai_data.get("sentiment"),
            next_action=ai_data.get("next_action"),
            products_discussed=products_discussed,
            outcome=outcome,
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)

        return json.dumps({
            "success": True,
            "interaction_id": interaction.id,
            "hcp_id": hcp.id,
            "ai_summary": interaction.ai_summary,
            "sentiment": interaction.sentiment,
            "next_action": interaction.next_action,
            "message": f"Interaction logged successfully with ID {interaction.id}",
        })
    except Exception as e:
        db.rollback()
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 2: edit_interaction
# ─────────────────────────────────────────────────────────────────────────────
@tool
def edit_interaction(
    interaction_id: int,
    notes: Optional[str] = None,
    interaction_type: Optional[str] = None,
    date: Optional[str] = None,
    products_discussed: Optional[str] = None,
    outcome: Optional[str] = None,
    regenerate_summary: bool = True,
) -> str:
    """
    Edit an existing logged interaction by its ID.
    If notes are changed and regenerate_summary is True, the LLM will
    re-generate the AI summary, sentiment, and next action.

    Args:
        interaction_id: The ID of the interaction to edit
        notes: Updated notes (optional)
        interaction_type: Updated type (optional)
        date: Updated date in YYYY-MM-DD format (optional)
        products_discussed: Updated products discussed (optional)
        outcome: Updated outcome (optional)
        regenerate_summary: Whether to regenerate AI summary (default True)
    """
    db = get_db_session()
    try:
        interaction = db.query(models.Interaction).filter(
            models.Interaction.id == interaction_id
        ).first()

        if not interaction:
            return json.dumps({"success": False, "error": f"Interaction {interaction_id} not found."})

        # Apply updates
        if notes is not None:
            interaction.notes = notes
        if interaction_type is not None:
            interaction.interaction_type = interaction_type
        if date is not None:
            interaction.date = date
        if products_discussed is not None:
            interaction.products_discussed = products_discussed
        if outcome is not None:
            interaction.outcome = outcome
        interaction.updated_at = datetime.utcnow()

        # Re-generate AI summary if notes changed
        if notes and regenerate_summary:
            hcp = db.query(models.HCP).filter(models.HCP.id == interaction.hcp_id).first()
            ai_prompt = f"""Analyze this updated HCP interaction. Return only a JSON object with:
- "summary": 2-3 sentence professional summary
- "sentiment": "positive", "neutral", or "negative"
- "next_action": recommended next step

HCP: {hcp.name if hcp else 'Unknown'}
Type: {interaction.interaction_type}
Date: {interaction.date}
Updated Notes: {interaction.notes}
Products: {interaction.products_discussed or 'N/A'}

JSON:"""
            ai_response = call_llm(ai_prompt)
            try:
                if "```json" in ai_response:
                    ai_response = ai_response.split("```json")[1].split("```")[0].strip()
                ai_data = json.loads(ai_response)
                interaction.ai_summary = ai_data.get("summary", interaction.ai_summary)
                interaction.sentiment = ai_data.get("sentiment", interaction.sentiment)
                interaction.next_action = ai_data.get("next_action", interaction.next_action)
            except Exception:
                pass

        db.commit()
        db.refresh(interaction)

        return json.dumps({
            "success": True,
            "interaction_id": interaction.id,
            "ai_summary": interaction.ai_summary,
            "sentiment": interaction.sentiment,
            "next_action": interaction.next_action,
            "message": f"Interaction {interaction_id} updated successfully.",
        })
    except Exception as e:
        db.rollback()
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 3: get_hcp_profile
# ─────────────────────────────────────────────────────────────────────────────
@tool
def get_hcp_profile(hcp_name: Optional[str] = None, hcp_id: Optional[int] = None) -> str:
    """
    Retrieve a comprehensive HCP profile including full interaction history,
    engagement score, last visit date, and AI-generated engagement summary.

    Args:
        hcp_name: Name (or partial name) of the HCP to search
        hcp_id: Direct ID of the HCP (preferred over name)
    """
    db = get_db_session()
    try:
        if hcp_id:
            hcp = db.query(models.HCP).filter(models.HCP.id == hcp_id).first()
        elif hcp_name:
            hcp = db.query(models.HCP).filter(
                models.HCP.name.ilike(f"%{hcp_name}%")
            ).first()
        else:
            return json.dumps({"success": False, "error": "Provide hcp_name or hcp_id."})

        if not hcp:
            return json.dumps({"success": False, "error": "HCP not found."})

        interactions = db.query(models.Interaction).filter(
            models.Interaction.hcp_id == hcp.id
        ).order_by(models.Interaction.date.desc()).all()

        total = len(interactions)
        positive = sum(1 for i in interactions if i.sentiment == "positive")
        engagement_score = round((positive / total * 100) if total > 0 else 0, 1)

        interaction_list = [{
            "id": i.id,
            "date": i.date,
            "type": i.interaction_type,
            "summary": i.ai_summary,
            "sentiment": i.sentiment,
            "next_action": i.next_action,
        } for i in interactions]

        # AI engagement summary
        if interactions:
            history_text = "\n".join([
                f"- {i.date} ({i.interaction_type}): {i.ai_summary or i.notes[:100]}"
                for i in interactions[:5]
            ])
            ai_summary = call_llm(
                f"Summarize this HCP's engagement profile in 2 sentences:\n{history_text}",
                system_prompt="You are a pharmaceutical CRM assistant. Be concise and actionable."
            )
        else:
            ai_summary = "No interactions logged yet."

        return json.dumps({
            "success": True,
            "hcp": {
                "id": hcp.id,
                "name": hcp.name,
                "specialty": hcp.specialty,
                "hospital": hcp.hospital,
                "territory": hcp.territory,
                "email": hcp.email,
                "phone": hcp.phone,
            },
            "stats": {
                "total_interactions": total,
                "engagement_score": engagement_score,
                "last_visit": interactions[0].date if interactions else None,
            },
            "ai_engagement_summary": ai_summary,
            "interactions": interaction_list,
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 4: suggest_next_action
# ─────────────────────────────────────────────────────────────────────────────
@tool
def suggest_next_action(hcp_name: Optional[str] = None, hcp_id: Optional[int] = None) -> str:
    """
    Analyze an HCP's full interaction history and use the LLM to recommend
    the best next sales action for the field rep. Returns tactical suggestions
    tailored to the HCP's specialty, sentiment trends, and engagement gaps.

    Args:
        hcp_name: Name of the HCP (partial match supported)
        hcp_id: Direct HCP ID
    """
    db = get_db_session()
    try:
        if hcp_id:
            hcp = db.query(models.HCP).filter(models.HCP.id == hcp_id).first()
        elif hcp_name:
            hcp = db.query(models.HCP).filter(models.HCP.name.ilike(f"%{hcp_name}%")).first()
        else:
            return json.dumps({"success": False, "error": "Provide hcp_name or hcp_id."})

        if not hcp:
            return json.dumps({"success": False, "error": "HCP not found."})

        interactions = db.query(models.Interaction).filter(
            models.Interaction.hcp_id == hcp.id
        ).order_by(models.Interaction.date.desc()).limit(10).all()

        history = "\n".join([
            f"- {i.date} | {i.interaction_type} | {i.sentiment} | {i.ai_summary or i.notes[:150]}"
            for i in interactions
        ]) or "No previous interactions."

        prompt = f"""You are a senior pharmaceutical sales strategist. Based on the HCP profile and interaction history below, provide 3 specific, actionable next steps for the field sales representative.

HCP Profile:
- Name: {hcp.name}
- Specialty: {hcp.specialty or 'Unknown'}
- Hospital: {hcp.hospital or 'Unknown'}
- Territory: {hcp.territory or 'Unknown'}

Recent Interaction History:
{history}

Provide EXACTLY 3 numbered recommendations. Be specific, tactical, and reference the interaction history where relevant."""

        suggestions = call_llm(prompt, model="llama-3.3-70b-versatile")

        return json.dumps({
            "success": True,
            "hcp_name": hcp.name,
            "specialty": hcp.specialty,
            "total_interactions": len(interactions),
            "suggestions": suggestions,
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 5: analyze_interaction_history
# ─────────────────────────────────────────────────────────────────────────────
@tool
def analyze_interaction_history(
    territory: Optional[str] = None,
    hcp_name: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> str:
    """
    Analyze interaction history across the territory or a specific HCP.
    Uses the LLM to generate trend insights: visit frequency, sentiment trends,
    engagement gaps, and territory performance summary.

    Args:
        territory: Filter by territory name (optional)
        hcp_name: Filter by specific HCP (optional)
        from_date: Start date in YYYY-MM-DD format (optional)
        to_date: End date in YYYY-MM-DD format (optional)
    """
    db = get_db_session()
    try:
        query = db.query(models.Interaction).join(models.HCP)

        if territory:
            query = query.filter(models.HCP.territory.ilike(f"%{territory}%"))
        if hcp_name:
            query = query.filter(models.HCP.name.ilike(f"%{hcp_name}%"))
        if from_date:
            query = query.filter(models.Interaction.date >= from_date)
        if to_date:
            query = query.filter(models.Interaction.date <= to_date)

        interactions = query.order_by(models.Interaction.date.desc()).all()

        if not interactions:
            return json.dumps({"success": True, "message": "No interactions found for the given filters.", "stats": {}})

        total = len(interactions)
        sentiments = {"positive": 0, "neutral": 0, "negative": 0}
        types = {}
        for i in interactions:
            if i.sentiment:
                sentiments[i.sentiment] = sentiments.get(i.sentiment, 0) + 1
            types[i.interaction_type] = types.get(i.interaction_type, 0) + 1

        history_sample = "\n".join([
            f"- {i.date} | HCP: {i.hcp.name} | Type: {i.interaction_type} | Sentiment: {i.sentiment}"
            for i in interactions[:20]
        ])

        prompt = f"""Analyze this pharmaceutical sales interaction data and provide a concise territory performance report.

Filter: Territory={territory or 'All'}, HCP={hcp_name or 'All'}, From={from_date or 'All'}, To={to_date or 'All'}
Total Interactions: {total}
Sentiment Breakdown: Positive={sentiments['positive']}, Neutral={sentiments['neutral']}, Negative={sentiments['negative']}
Interaction Types: {json.dumps(types)}

Sample Records:
{history_sample}

Provide:
1. Overall Engagement Assessment (2 sentences)
2. Key Trends (2-3 bullet points)
3. Priority Actions (2 bullet points)"""

        analysis = call_llm(prompt, model="llama-3.3-70b-versatile")

        return json.dumps({
            "success": True,
            "stats": {
                "total_interactions": total,
                "sentiment_breakdown": sentiments,
                "interaction_types": types,
                "date_range": f"{from_date or 'All'} to {to_date or 'All'}",
                "territory": territory or "All",
            },
            "ai_analysis": analysis,
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# Tool registry for the agent
TOOLS = [
    log_interaction,
    edit_interaction,
    get_hcp_profile,
    suggest_next_action,
    analyze_interaction_history,
]
