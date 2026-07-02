"""Ordinary least squares trend forecasting — pure NumPy, per the SRS's
'raw NumPy matrix operations rather than heavy frameworks' performance note."""
import numpy as np


def forecast(series: list[float], horizon_months: int) -> dict:
    n = len(series)
    x = np.arange(n, dtype=float)
    y = np.array(series, dtype=float)

    # Normal equations for y = a + b*x
    X = np.vstack([np.ones(n), x]).T
    coeffs, _, _, _ = np.linalg.lstsq(X, y, rcond=None)
    a, b = coeffs

    fitted = a + b * x
    residuals = y - fitted
    dof = max(n - 2, 1)
    residual_std = float(np.sqrt(np.sum(residuals**2) / dof))

    future_x = np.arange(n, n + horizon_months, dtype=float)
    point_forecast = a + b * future_x[-1]

    # Prediction-interval half-width widens with distance from the data mean (standard OLS PI formula).
    x_mean = x.mean()
    sxx = np.sum((x - x_mean) ** 2) or 1.0
    se_pred = residual_std * np.sqrt(1 + 1 / n + (future_x[-1] - x_mean) ** 2 / sxx)
    half_width = 1.96 * se_pred

    mape = float(np.mean(np.abs(residuals / np.where(y == 0, 1, y)))) * 100

    return {
        "projected": float(point_forecast),
        "ci_low": float(point_forecast - half_width),
        "ci_high": float(point_forecast + half_width),
        "growth_pct": float((point_forecast - y[-1]) / y[-1] * 100),
        "mape": mape,
        "fitted": fitted.tolist(),
    }
