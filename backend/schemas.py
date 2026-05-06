from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# HCP Schemas
class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None
    npi_number: Optional[str] = None


class HCPCreate(HCPBase):
    pass


class HCPResponse(HCPBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Interaction Schemas
class InteractionBase(BaseModel):
    hcp_id: int
    rep_name: str
    date: str
    interaction_type: str
    notes: str
    products_discussed: Optional[str] = None
    outcome: Optional[str] = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    rep_name: Optional[str] = None
    date: Optional[str] = None
    interaction_type: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    next_action: Optional[str] = None
    products_discussed: Optional[str] = None
    outcome: Optional[str] = None


class InteractionResponse(InteractionBase):
    id: int
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    next_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InteractionWithHCP(InteractionResponse):
    hcp: HCPResponse


class HCPWithInteractions(HCPResponse):
    interactions: List[InteractionResponse] = []


# Chat Schemas
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    tool_calls: Optional[List[dict]] = []
    session_id: str


# Tool Schemas
class ToolRequest(BaseModel):
    tool_name: str
    parameters: dict


class ToolResponse(BaseModel):
    tool_name: str
    result: dict
    success: bool
    message: str
