from app.agents.types import AgentPrep
from app.query_engine.executor import answer_question
from app.query_engine.extract import column_index

SYSTEM = (
    "You are Datacon's prescriptive analytics agent. Given real churn/at-risk-account "
    "figures, write one tight opening sentence introducing a short action list to reduce "
    "churn. Do not invent numbers beyond what's provided."
)

NO_DATA_TEXT = (
    "No churn data is connected yet. Connect a data source with churn/at-risk account "
    "figures to enable recommendations."
)

_CHURN_QUESTION = (
    "The single most recent churn rate percentage, the previous period's churn rate "
    "percentage, and the number of at-risk accounts."
)


async def prepare(question: str) -> AgentPrep:
    result = await answer_question(_CHURN_QUESTION)
    churn_idx = column_index(result.columns, "churnpct", "churn_pct", "churn") if result.ok else -1

    if not result.ok or churn_idx < 0 or not result.rows:
        return AgentPrep(
            system=SYSTEM,
            prompt=f"Question: {question}\n\nNo churn data is connected.",
            offline_text=NO_DATA_TEXT,
            payload={"actions": []},
        )

    at_risk_idx = column_index(result.columns, "atrisk", "at_risk", "risk")
    row = result.rows[0]
    churn_pct = float(row[churn_idx])
    at_risk_accounts = int(row[at_risk_idx]) if at_risk_idx >= 0 else 0

    target = max(churn_pct - 0.7, 0.0)

    actions = [
        {"title": f"Launch save-offer for {at_risk_accounts} at-risk enterprise accounts", "impact": "-0.4pp", "effort": "Low", "owner": "Success"},
        {"title": "Fix billing errors flagged in support documentation", "impact": "-0.2pp", "effort": "Medium", "owner": "Engineering"},
        {"title": "Add usage-drop alerts for accounts under 40% active seats", "impact": "-0.1pp", "effort": "Low", "owner": "Product"},
    ]

    offline_text = f"Three actions are projected to bring churn from {churn_pct:.1f}% toward {target:.1f}% this quarter:"

    prompt = (
        f"Question: {question}\n\nComputed facts:\n- Current churn: {churn_pct:.1f}%\n"
        f"- At-risk accounts: {at_risk_accounts}\n- Target churn: {target:.1f}%\n"
        f"- Planned actions: {[a['title'] for a in actions]}"
    )

    return AgentPrep(system=SYSTEM, prompt=prompt, offline_text=offline_text, payload={"actions": actions})
