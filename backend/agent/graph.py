"""
LangGraph ReAct Agent for the HCP CRM system.
Compatible with langgraph>=0.4 + langchain-core 0.2.x
"""
import os
import json
from pathlib import Path
from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from agent.tools import TOOLS
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# ── LLM with tool binding ────────────────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.2,
)
llm_with_tools = llm.bind_tools(TOOLS)

SYSTEM_PROMPT = """You are an AI-powered CRM assistant for pharmaceutical field representatives.
You help manage interactions with Healthcare Professionals (HCPs).

You have access to these tools:
1. log_interaction – Log a new HCP interaction with AI-generated summary & sentiment
2. edit_interaction – Edit an existing interaction by ID
3. get_hcp_profile – Get complete HCP profile and interaction history
4. suggest_next_action – Get AI-powered next-step recommendations for an HCP
5. analyze_interaction_history – Analyze territory-wide or HCP-specific interaction trends

When a user asks you to log, view, edit, or analyze interactions, use the appropriate tool.
Always be helpful, professional, and concise. After using a tool, summarize the result clearly."""

# ── State ────────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


# ── Nodes ────────────────────────────────────────────────────────────────────
def agent_node(state: AgentState) -> AgentState:
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


# ── Graph ────────────────────────────────────────────────────────────────────
tool_node = ToolNode(TOOLS)

graph_builder = StateGraph(AgentState)
graph_builder.add_node("agent", agent_node)
graph_builder.add_node("tools", tool_node)
graph_builder.set_entry_point("agent")
graph_builder.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph_builder.add_edge("tools", "agent")

crm_agent = graph_builder.compile()


def run_agent(user_message: str) -> dict:
    """Run the CRM agent and return response + tool calls made."""
    result = crm_agent.invoke({"messages": [HumanMessage(content=user_message)]})

    messages = result["messages"]

    # Final AI text response
    ai_msgs = [m for m in messages if isinstance(m, AIMessage) and m.content]
    final_response = ai_msgs[-1].content if ai_msgs else "Task completed."

    # Collect tool calls + results
    tool_calls = []
    for i, msg in enumerate(messages):
        if isinstance(msg, AIMessage) and getattr(msg, "tool_calls", None):
            for tc in msg.tool_calls:
                entry = {"name": tc["name"], "args": tc.get("args", {})}
                # Look for matching ToolMessage right after
                for j in range(i + 1, len(messages)):
                    if isinstance(messages[j], ToolMessage):
                        try:
                            entry["result"] = json.loads(messages[j].content)
                        except Exception:
                            entry["result"] = {"raw": messages[j].content}
                        break
                tool_calls.append(entry)

    return {"response": final_response, "tool_calls": tool_calls}
