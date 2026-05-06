from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/hcps", tags=["HCPs"])


@router.get("/", response_model=List[schemas.HCPResponse])
def list_hcps(db: Session = Depends(get_db)):
    return db.query(models.HCP).all()


@router.get("/{hcp_id}", response_model=schemas.HCPWithInteractions)
def get_hcp(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(models.HCP).filter(models.HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp


@router.post("/", response_model=schemas.HCPResponse, status_code=201)
def create_hcp(hcp: schemas.HCPCreate, db: Session = Depends(get_db)):
    db_hcp = models.HCP(**hcp.model_dump())
    db.add(db_hcp)
    db.commit()
    db.refresh(db_hcp)
    return db_hcp


@router.put("/{hcp_id}", response_model=schemas.HCPResponse)
def update_hcp(hcp_id: int, hcp: schemas.HCPBase, db: Session = Depends(get_db)):
    db_hcp = db.query(models.HCP).filter(models.HCP.id == hcp_id).first()
    if not db_hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    for key, val in hcp.model_dump(exclude_unset=True).items():
        setattr(db_hcp, key, val)
    db.commit()
    db.refresh(db_hcp)
    return db_hcp


@router.delete("/{hcp_id}")
def delete_hcp(hcp_id: int, db: Session = Depends(get_db)):
    db_hcp = db.query(models.HCP).filter(models.HCP.id == hcp_id).first()
    if not db_hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    db.delete(db_hcp)
    db.commit()
    return {"message": "HCP deleted"}
