"""Pydantic schemas for HeatSafe LLM Engine."""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Literal

WorkIntensity = Literal["light", "moderate", "heavy", "very_heavy"]
ClothingType  = Literal[
    "summer_work_clothes", "cotton_coverall", "double_layer_coverall",
    "synthetic_coverall", "reflective_suit", "saree_kurta",
    "construction_helmet_vest", "full_ppe_no_scba"
]
OccupCategory = Literal[
    "construction", "agriculture", "transport", "street_vending",
    "manufacturing", "domestic_work", "emergency_services",
    "utilities", "waste_management", "mining", "informal_labor", "other"
]
RiskLevel = Literal["safe", "caution", "warning", "danger", "extreme_danger"]

class WorkerProfile(BaseModel):
    raw_input_normalized: str
    occupation_english: str = Field(max_length=60)
    occupation_category: OccupCategory
    work_intensity: WorkIntensity
    metabolic_rate_watts_m2: float = Field(ge=100, le=550)
    metabolic_rate_total_watts: float = Field(ge=150, le=600)
    clothing_type: ClothingType
    clothing_adjustment_factor: float = Field(ge=0.0, le=12.0)
    typical_outdoor_fraction: float = Field(ge=0.0, le=1.0)
    typical_direct_sun_fraction: float = Field(ge=0.0, le=1.0)
    profiling_confidence: float = Field(ge=0.0, le=1.0)
    ambiguity_flags: List[str] = Field(default=[])
    conservative_fallback_applied: bool

class WeatherData(BaseModel):
    temperature_c: float = Field(ge=-10, le=60)
    humidity_pct:  float = Field(ge=0, le=100)
    wind_speed_ms: float = Field(ge=0, le=50, default=1.5)
    uv_index:      float = Field(ge=0, le=15, default=5.0)
    hour_of_day:   int   = Field(ge=0, le=23)
    city:          str   = Field(default="Unknown")
    source:        str   = Field(default="api")

class HeatStrainResult(BaseModel):
    wet_bulb_temp_c: float
    wbgt_outdoor_c: float
    wbgt_adjusted_c: float
    niosh_rel_c: float
    niosh_ral_c: float
    pct_of_rel: float
    heat_strain_index: float
    risk_level: RiskLevel
    max_continuous_work_min: int
    required_rest_min_per_hr: int
    water_intake_ml_per_hr: int
    safe_to_work: bool
    immediate_action_required: bool
    alert_en: str
    alert_hi: str
    calculation_trace: dict