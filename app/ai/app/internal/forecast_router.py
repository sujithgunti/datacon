from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.internal.auth import require_internal_auth
from app.forecasting import ols, holt_winters

router = APIRouter(prefix="/internal/forecast", tags=["internal-forecast"], dependencies=[Depends(require_internal_auth)])


class RegionPoint(BaseModel):
    region: str
    revenue: float


class ForecastPayload(BaseModel):
    series: list[float]
    model: str
    horizonMonths: int
    regionRevenueCurrent: list[RegionPoint]
    regionRevenuePrevious: list[RegionPoint]


class Driver(BaseModel):
    label: str
    pct: float


class ForecastOut(BaseModel):
    projected: str
    ciLow: str
    ciHigh: str
    growth: str
    mape: str
    series: list[dict]
    topDrivers: list[Driver]


def _top_drivers(current: list[RegionPoint], previous: list[RegionPoint]) -> list[Driver]:
    prev_by_region = {p.region: p.revenue for p in previous}
    deltas = [(p.region, p.revenue - prev_by_region.get(p.region, p.revenue)) for p in current]
    positive = [(region, d) for region, d in deltas if d > 0]
    total = sum(d for _, d in positive) or 1.0
    ranked = sorted(positive, key=lambda x: -x[1])[:3]
    return [Driver(label=f"{region} revenue growth", pct=round(d / total * 100)) for region, d in ranked]


@router.post("", response_model=ForecastOut)
async def forecast(payload: ForecastPayload):
    engine = ols if payload.model == "OLS" else holt_winters
    result = engine.forecast(payload.series, payload.horizonMonths)
    return ForecastOut(
        projected=f"${result['projected']:.2f}M",
        ciLow=f"${result['ci_low']:.2f}M",
        ciHigh=f"${result['ci_high']:.2f}M",
        growth=f"{result['growth_pct']:+.1f}%",
        mape=f"{result['mape']:.1f}%",
        series=[{"label": f"m{i}", "value": v} for i, v in enumerate(payload.series)],
        topDrivers=_top_drivers(payload.regionRevenueCurrent, payload.regionRevenuePrevious),
    )
