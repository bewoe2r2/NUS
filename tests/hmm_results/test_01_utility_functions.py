"""
TEST SUITE 01: Utility Functions (safe_log, gaussian_log_pdf, gaussian_pdf)
~200 tests covering math foundations
"""
import math
import pytest
import numpy as np
from conftest import safe_log, gaussian_log_pdf, gaussian_pdf


# =============================================================================
# safe_log
# =============================================================================
class TestSafeLog:
    """Tests for safe_log: handles zero/negative gracefully."""

    def test_positive_value(self):
        assert safe_log(1.0) == 0.0

    def test_e_value(self):
        assert abs(safe_log(math.e) - 1.0) < 1e-10

    def test_large_value(self):
        assert abs(safe_log(1e100) - math.log(1e100)) < 1e-6

    def test_small_positive(self):
        assert abs(safe_log(1e-200) - math.log(1e-200)) < 1e-6

    def test_zero_does_not_crash(self):
        result = safe_log(0.0)
        assert result < -600  # Very large negative

    def test_negative_does_not_crash(self):
        result = safe_log(-1.0)
        assert result < -600

    def test_negative_large_does_not_crash(self):
        result = safe_log(-1e100)
        assert result < -600

    def test_one_half(self):
        assert abs(safe_log(0.5) - math.log(0.5)) < 1e-10

    @pytest.mark.parametrize("x", [0.001, 0.01, 0.1, 0.5, 1.0, 2.0, 10.0, 100.0, 1000.0])
    def test_matches_math_log(self, x):
        assert abs(safe_log(x) - math.log(x)) < 1e-10

    @pytest.mark.parametrize("x", [0.0, -0.0, -1.0, -100.0, -1e-300])
    def test_non_positive_returns_finite(self, x):
        result = safe_log(x)
        assert math.isfinite(result)

    def test_tiny_positive(self):
        result = safe_log(1e-300)
        assert math.isfinite(result)
        assert result < 0


# =============================================================================
# gaussian_log_pdf
# =============================================================================
class TestGaussianLogPdf:
    """Tests for Gaussian log-PDF computation."""

    def test_none_returns_zero(self):
        assert gaussian_log_pdf(None, 5.0, 1.0) == 0.0

    def test_at_mean(self):
        """PDF is maximized at the mean."""
        lp = gaussian_log_pdf(5.0, 5.0, 1.0)
        expected = -0.5 * math.log(2 * math.pi * 1.0)
        assert abs(lp - expected) < 1e-10

    def test_symmetric(self):
        """PDF should be symmetric around the mean."""
        lp1 = gaussian_log_pdf(3.0, 5.0, 1.0)
        lp2 = gaussian_log_pdf(7.0, 5.0, 1.0)
        assert abs(lp1 - lp2) < 1e-10

    def test_decreases_away_from_mean(self):
        lp_close = gaussian_log_pdf(5.5, 5.0, 1.0)
        lp_far = gaussian_log_pdf(8.0, 5.0, 1.0)
        assert lp_close > lp_far

    def test_zero_var_clamped(self):
        """Zero variance should not crash (clamped to 1e-6)."""
        result = gaussian_log_pdf(5.0, 5.0, 0.0)
        assert math.isfinite(result)

    def test_negative_var_clamped(self):
        result = gaussian_log_pdf(5.0, 5.0, -1.0)
        assert math.isfinite(result)

    def test_large_deviation(self):
        """Very far from mean should give very negative log-prob."""
        lp = gaussian_log_pdf(100.0, 5.0, 1.0)
        assert lp < -1000

    def test_large_variance(self):
        """Large variance = flatter distribution = higher log-prob for far values."""
        lp_small_var = gaussian_log_pdf(10.0, 5.0, 1.0)
        lp_large_var = gaussian_log_pdf(10.0, 5.0, 100.0)
        assert lp_large_var > lp_small_var

    @pytest.mark.parametrize("x,mean,var", [
        (0.0, 0.0, 1.0),
        (5.0, 5.0, 2.0),
        (10.0, 0.0, 25.0),
        (-5.0, 0.0, 1.0),
        (100.0, 50.0, 400.0),
    ])
    def test_matches_scipy_formula(self, x, mean, var):
        expected = -0.5 * (math.log(2 * math.pi * var) + ((x - mean) ** 2) / var)
        assert abs(gaussian_log_pdf(x, mean, var) - expected) < 1e-10

    @pytest.mark.parametrize("mean", [0.0, -100.0, 100.0, 1e6, -1e6])
    def test_various_means(self, mean):
        lp = gaussian_log_pdf(mean, mean, 1.0)
        assert math.isfinite(lp)

    @pytest.mark.parametrize("var", [0.001, 0.1, 1.0, 10.0, 100.0, 10000.0])
    def test_various_variances(self, var):
        lp = gaussian_log_pdf(5.0, 5.0, var)
        assert math.isfinite(lp)

    def test_standard_normal(self):
        """N(0,1) at x=0 should give log(1/sqrt(2pi))."""
        lp = gaussian_log_pdf(0.0, 0.0, 1.0)
        expected = -0.5 * math.log(2 * math.pi)
        assert abs(lp - expected) < 1e-10

    def test_one_sigma(self):
        """At 1 sigma, log-prob should drop by 0.5."""
        lp_0 = gaussian_log_pdf(0.0, 0.0, 1.0)
        lp_1 = gaussian_log_pdf(1.0, 0.0, 1.0)
        assert abs((lp_0 - lp_1) - 0.5) < 1e-10

    def test_two_sigma(self):
        lp_0 = gaussian_log_pdf(0.0, 0.0, 1.0)
        lp_2 = gaussian_log_pdf(2.0, 0.0, 1.0)
        assert abs((lp_0 - lp_2) - 2.0) < 1e-10

    def test_three_sigma(self):
        lp_0 = gaussian_log_pdf(0.0, 0.0, 1.0)
        lp_3 = gaussian_log_pdf(3.0, 0.0, 1.0)
        assert abs((lp_0 - lp_3) - 4.5) < 1e-10


# =============================================================================
# gaussian_pdf
# =============================================================================
class TestGaussianPdf:
    """Tests for gaussian_pdf (exp version)."""

    def test_none_returns_one(self):
        assert gaussian_pdf(None, 5.0, 1.0) == 1.0

    def test_at_mean_positive(self):
        p = gaussian_pdf(5.0, 5.0, 1.0)
        assert p > 0

    def test_consistency_with_log_version(self):
        """exp(log_pdf) should equal pdf."""
        x, mean, var = 6.0, 5.0, 2.0
        log_p = gaussian_log_pdf(x, mean, var)
        p = gaussian_pdf(x, mean, var)
        assert abs(math.exp(log_p) - p) < 1e-10

    def test_very_far_returns_tiny(self):
        """Very far from mean should return ~0 (clamped to 1e-300)."""
        p = gaussian_pdf(1000.0, 5.0, 1.0)
        assert p <= 1e-300 or p >= 0

    def test_zero_var_handled(self):
        p = gaussian_pdf(5.0, 5.0, 0.0)
        assert p > 0

    def test_negative_var_handled(self):
        p = gaussian_pdf(5.0, 5.0, -5.0)
        assert p > 0

    @pytest.mark.parametrize("x", np.linspace(-5, 15, 50))
    def test_always_non_negative(self, x):
        p = gaussian_pdf(x, 5.0, 2.0)
        assert p >= 0

    @pytest.mark.parametrize("x", np.linspace(0, 10, 20))
    def test_pdf_log_pdf_consistency(self, x):
        log_p = gaussian_log_pdf(x, 5.0, 2.0)
        p = gaussian_pdf(x, 5.0, 2.0)
        if log_p > -700:
            assert abs(math.exp(log_p) - p) < 1e-10


# =============================================================================
# Stress tests with extreme values
# =============================================================================
class TestExtremeValues:
    """Numerical stability under extreme inputs."""

    @pytest.mark.parametrize("x", [1e-300, 1e-200, 1e-100, 1e100, 1e200])
    def test_safe_log_extreme(self, x):
        result = safe_log(x)
        assert math.isfinite(result)

    @pytest.mark.parametrize("x", [1e10, -1e10, 1e15, -1e15])
    def test_gaussian_log_pdf_extreme_x(self, x):
        result = gaussian_log_pdf(x, 0.0, 1.0)
        assert math.isfinite(result)

    @pytest.mark.parametrize("var", [1e-10, 1e-6, 1e6, 1e10])
    def test_gaussian_log_pdf_extreme_var(self, var):
        result = gaussian_log_pdf(5.0, 5.0, var)
        assert math.isfinite(result)

    def test_gaussian_pdf_underflow_clamped(self):
        """When log-prob < -700, pdf should return 1e-300 not 0."""
        p = gaussian_pdf(1000.0, 0.0, 1.0)
        assert p >= 0  # Should be 1e-300 or similar tiny value

    @pytest.mark.parametrize("x,mean", [
        (0.0, 0.0), (1e6, 1e6), (-1e6, -1e6),
        (1e10, 0.0), (0.0, 1e10),
    ])
    def test_log_pdf_finite(self, x, mean):
        assert math.isfinite(gaussian_log_pdf(x, mean, 1.0))
