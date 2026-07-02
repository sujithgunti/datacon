"""Holt's linear (double exponential smoothing) forecasting — hand-rolled with
NumPy, no statsmodels dependency, per the SRS's performance requirement.
Seasonality is intentionally omitted: 18 months of history isn't enough for a
reliable seasonal component (needs 2+ full cycles), so this is level+trend only."""
import numpy as np

ALPHA = 0.4  # level smoothing
BETA = 0.2  # trend smoothing


def forecast(series: list[float], horizon_months: int) -> dict:
    y = np.array(series, dtype=float)
    n = len(y)

    level = y[0]
    trend = y[1] - y[0] if n > 1 else 0.0
    fitted = [level]

    one_step_errors = []
    for t in range(1, n):
        forecast_t = level + trend
        one_step_errors.append(y[t] - forecast_t)
        new_level = ALPHA * y[t] + (1 - ALPHA) * (level + trend)
        new_trend = BETA * (new_level - level) + (1 - BETA) * trend
        level, trend = new_level, new_trend
        fitted.append(forecast_t)

    residual_std = float(np.std(one_step_errors)) if one_step_errors else 0.0
    point_forecast = level + trend * horizon_months

    # Multi-step forecast error variance grows with horizon (standard Holt result: 1 + sum of squared trend coefficients).
    growth_factor = np.sqrt(1 + (horizon_months - 1) * (ALPHA**2 + ALPHA * BETA * horizon_months))
    half_width = 1.96 * residual_std * growth_factor

    mape = float(np.mean(np.abs(np.array(one_step_errors) / y[1:]))) * 100 if n > 1 else 0.0

    return {
        "projected": float(point_forecast),
        "ci_low": float(point_forecast - half_width),
        "ci_high": float(point_forecast + half_width),
        "growth_pct": float((point_forecast - y[-1]) / y[-1] * 100),
        "mape": mape,
        "fitted": fitted,
    }
