"""
Pydantic models for model configuration schema.
These models mirror the TypeScript interfaces in /data/schema/types.ts
"""

from typing import Optional
from pydantic import BaseModel, Field, model_validator


class EngineConfig(BaseModel):
    """Engine/runtime configuration. Used for unified config, prefill, and decode phases."""
    env_vars: Optional[dict[str, str]] = Field(default_factory=dict, description="Environment variables to set")
    tp: int = Field(..., ge=1, description="Tensor Parallelism degree")
    dp: Optional[int] = Field(None, ge=1, description="Data Parallelism degree")
    ep: Optional[int] = Field(None, ge=1, description="Expert Parallelism degree (for MoE models)")
    enable_dp_attention: Optional[bool] = Field(None, description="Enable DP attention optimization")
    extra_args: Optional[list[str]] = Field(default_factory=list, description="Additional command-line arguments")


class ConfigAttributes(BaseModel):
    """Attributes describing the deployment scenario"""
    nodes: str = Field(..., pattern="^(single|multi)$", description="Single node or multi-node deployment")
    optimization: str = Field(..., pattern="^(balanced|low-latency|high-throughput)$", description="Optimization target")
    quantization: str = Field(
        ...,
        pattern="^(fp8|int4|bf16|fp4)$",
        description="Quantization format (fp8, int4, bf16, fp4)."
    )


class NamedConfiguration(BaseModel):
    """A specific named configuration.

    Validation rule: Either `engine` alone OR both `prefill` and `decode` together.
    They cannot coexist - use engine for unified config, or prefill+decode for phase-specific config.
    """
    name: str = Field(..., description="Configuration name (e.g., 'default', 'low-latency-fp8')")
    attributes: ConfigAttributes
    quantized_model_path: Optional[str] = Field(None, description="Override model path for quantized models")
    engine: Optional[EngineConfig] = Field(None, description="Unified engine config (mutually exclusive with prefill/decode)")
    prefill: Optional[EngineConfig] = Field(None, description="Prefill phase config (requires decode, mutually exclusive with engine)")
    decode: Optional[EngineConfig] = Field(None, description="Decode phase config (requires prefill, mutually exclusive with engine)")

    @model_validator(mode='after')
    def validate_engine_or_phases(self) -> 'NamedConfiguration':
        """Validate that either engine OR (prefill AND decode) are set, not both."""
        has_engine = self.engine is not None
        has_prefill = self.prefill is not None
        has_decode = self.decode is not None

        if has_engine and (has_prefill or has_decode):
            raise ValueError(
                "Cannot have both 'engine' and 'prefill'/'decode'. "
                "Use either 'engine' alone OR both 'prefill' and 'decode' together."
            )

        if not has_engine and not (has_prefill and has_decode):
            if has_prefill and not has_decode:
                raise ValueError("'prefill' requires 'decode' to also be set (engine is not set)")
            if has_decode and not has_prefill:
                raise ValueError("'decode' requires 'prefill' to also be set (engine is not set)")
            if not has_prefill and not has_decode:
                raise ValueError(
                    "Must have either 'engine' OR both 'prefill' and 'decode'. "
                    "Neither is currently set."
                )

        return self


class VersionConfig(BaseModel):
    """Configuration for a specific SGLang version"""
    configurations: list[NamedConfiguration] = Field(default_factory=list)


class HardwareConfig(BaseModel):
    """Configuration for a specific hardware type"""
    versions: dict[str, VersionConfig] = Field(default_factory=dict)


class ModelAttributes(BaseModel):
    """Model-level attributes"""
    thinking_capability: str = Field(
        ...,
        pattern="^(non_thinking|thinking|hybrid)$",
        description="Thinking capability mode (non_thinking, thinking, or hybrid)"
    )
    tool_parser: Optional[str] = Field(None, description="Tool call parser name")
    reasoning_parser: Optional[str] = Field(None, description="Reasoning parser name")
    chat_template: Optional[str] = Field(None, description="Custom chat template path")


class Model(BaseModel):
    """A specific model within a family"""
    name: str = Field(..., description="Model display name")
    model_path: str = Field(..., description="HuggingFace model path")
    attributes: ModelAttributes
    hardware: dict[str, HardwareConfig] = Field(default_factory=dict)


class ModelFamily(BaseModel):
    """A family of related models"""
    name: str = Field(..., description="Family name")
    description: Optional[str] = Field(None, description="Description of the model family")
    models: list[Model] = Field(default_factory=list)


class CompanyConfig(BaseModel):
    """Root configuration for a model company"""
    company: str = Field(..., description="Company/organization identifier")
    families: list[ModelFamily] = Field(default_factory=list)
