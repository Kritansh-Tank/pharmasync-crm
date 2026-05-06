from fastapi import APIRouter
from schemas import ChatMessage, ChatResponse, ToolRequest, ToolResponse
from agent.graph import run_agent
import json

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """
    Main conversational endpoint. Sends the user message to the LangGraph agent
    and returns the AI response along with any tool calls made.
    """
    result = run_agent(message.message)
    return ChatResponse(
        response=result["response"],
        tool_calls=result.get("tool_calls", []),
        session_id=message.session_id or "default",
    )


@router.post("/tool", response_model=ToolResponse)
async def invoke_tool(request: ToolRequest):
    """
    Direct tool invocation endpoint for the Tool Demo Panel in the frontend.
    Allows calling individual tools by name with specific parameters.
    """
    from agent.tools import TOOLS

    tool_map = {t.name: t for t in TOOLS}
    tool = tool_map.get(request.tool_name)

    if not tool:
        available = list(tool_map.keys())
        return ToolResponse(
            tool_name=request.tool_name,
            result={"available_tools": available},
            success=False,
            message=f"Tool '{request.tool_name}' not found. Available: {available}",
        )

    try:
        result_raw = tool.invoke(request.parameters)
        result = json.loads(result_raw) if isinstance(result_raw, str) else result_raw
        return ToolResponse(
            tool_name=request.tool_name,
            result=result,
            success=result.get("success", True),
            message="Tool executed successfully",
        )
    except Exception as e:
        return ToolResponse(
            tool_name=request.tool_name,
            result={},
            success=False,
            message=str(e),
        )
