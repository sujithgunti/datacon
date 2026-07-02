from app.agents.types import AgentResult
from app.llm.client import LLMClient

SYSTEM = (
    "You are Datacon's prescriptive analytics agent. Given real churn/at-risk-account "
    "figures, write one tight opening sentence introducing a short action list to reduce "
    "churn. Do not invent numbers beyond what's provided."
)


async def run(question: str, context: dict, llm: LLMClient) -> AgentResult:
    churn = context["churnSnapshot"]  # {churnPct, atRiskAccounts}
    incident_title = context.get("topIncidentTitle") or "the latest billing incident report"
    target = max(churn["churnPct"] - 0.7, 0.0)

    actions = [
        {"title": f"Launch save-offer for {churn['atRiskAccounts']} at-risk enterprise accounts", "impact": "-0.4pp", "effort": "Low", "owner": "Success"},
        {"title": f"Fix EMEA billing errors from {incident_title}", "impact": "-0.2pp", "effort": "Medium", "owner": "Engineering"},
        {"title": "Add usage-drop alerts for accounts under 40% active seats", "impact": "-0.1pp", "effort": "Low", "owner": "Product"},
    ]

    offline_text = f"Three actions are projected to bring churn from {churn['churnPct']:.1f}% toward {target:.1f}% this quarter:"

    prompt = (
        f"Question: {question}\n\nComputed facts:\n- Current churn: {churn['churnPct']:.1f}%\n"
        f"- At-risk accounts: {churn['atRiskAccounts']}\n- Target churn: {target:.1f}%\n"
        f"- Planned actions: {[a['title'] for a in actions]}"
    )

    text = await llm.compose(SYSTEM, prompt, offline_text)
    return AgentResult(text=text, payload={"actions": actions})
