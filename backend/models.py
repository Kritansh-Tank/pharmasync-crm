from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    specialty = Column(String(200))
    hospital = Column(String(300))
    email = Column(String(200))
    phone = Column(String(50))
    territory = Column(String(100))
    npi_number = Column(String(20), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="hcp", cascade="all, delete-orphan")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False)
    rep_name = Column(String(200), nullable=False)
    date = Column(String(20), nullable=False)
    interaction_type = Column(String(50), nullable=False)  # visit, call, email, conference
    notes = Column(Text, nullable=False)
    ai_summary = Column(Text, nullable=True)
    sentiment = Column(String(20), nullable=True)  # positive, neutral, negative
    next_action = Column(Text, nullable=True)
    products_discussed = Column(Text, nullable=True)
    outcome = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hcp = relationship("HCP", back_populates="interactions")
