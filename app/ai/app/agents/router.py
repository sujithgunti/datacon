import re

# Priority-ordered regex cascade, ported verbatim from the prototype
# (project/Datacon.dc.html:1320-1326). Ambiguous queries fall through to
# descriptive by design — that's the PRD's specified conservative default,
# not a placeholder for an LLM fallback.
_PREDICTIVE = re.compile(r"forecast|predict|next quarter|next two|projection|will be|expect", re.I)
_DIAGNOSTIC = re.compile(r"why|cause|spike|reason|driv|because|root", re.I)
_PRESCRIPTIVE = re.compile(r"reduce|should|recommend|how do we|improve|cut |lower |action|fix", re.I)


def route(text: str) -> str:
    if _PREDICTIVE.search(text):
        return "predictive"
    if _DIAGNOSTIC.search(text):
        return "diagnostic"
    if _PRESCRIPTIVE.search(text):
        return "prescriptive"
    return "descriptive"
