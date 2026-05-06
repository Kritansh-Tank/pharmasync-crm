from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from agent.llm import call_llm
import json
from datetime import datetime

router = APIRouter(prefix="/interactions", tags=["Interactions"])


@router.get("/", response_model=List[schemas.InteractionWithHCP])
def list_interactions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(models.Interaction)
        .order_by(models.Interaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{interaction_id}", response_model=schemas.InteractionWithHCP)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.post("/", response_model=schemas.InteractionResponse, status_code=201)
def create_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(get_db)):
    hcp = db.query(models.HCP).filter(models.HCP.id == interaction.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    # AI enrichment
    ai_prompt = f"""Analyze this HCP interaction. Return only JSON with keys: "summary", "sentiment", "next_action".

HCP: {hcp.name}
Type: {interaction.interaction_type}
Date: {interaction.date}
Notes: {interaction.notes}
Products: {interaction.products_discussed or 'N/A'}

JSON:"""
    try:
        ai_response = call_llm(ai_prompt)
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        ai_data = json.loads(ai_response)
    except Exception:
        ai_data = {"summary": interaction.notes[:200], "sentiment": "neutral", "next_action": "Follow up next week."}

    db_interaction = models.Interaction(
        **interaction.model_dump(),
        ai_summary=ai_data.get("summary"),
        sentiment=ai_data.get("sentiment"),
        next_action=ai_data.get("next_action"),
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


@router.put("/{interaction_id}", response_model=schemas.InteractionResponse)
def update_interaction(
    interaction_id: int,
    update: schemas.InteractionUpdate,
    db: Session = Depends(get_db),
):
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    for key, val in update.model_dump(exclude_unset=True).items():
        setattr(interaction, key, val)
    interaction.updated_at = datetime.utcnow()

    # Re-generate AI summary if notes were updated
    if update.notes:
        hcp = db.query(models.HCP).filter(models.HCP.id == interaction.hcp_id).first()
        try:
            ai_prompt = f"""Analyze this updated interaction. Return only JSON with "summary", "sentiment", "next_action".
HCP: {hcp.name if hcp else 'Unknown'}
Notes: {interaction.notes}
JSON:"""
            ai_response = call_llm(ai_prompt)
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
    return interaction


@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Interaction deleted"}
